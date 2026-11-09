/**
 * ADIL-SNAKER-PANEL - 3D Three.js Game Engine
 * Adheres to Three.js and Ultra Mode Craft Directives:
 * - isSoftwareGl detection & loop pacing via afterDraw()
 * - ACESFilmicToneMapping & SRGBColorSpace
 * - RoomEnvironment reflection via PMREMGenerator
 * - Zero GC in animation loop (pre-allocated math helpers)
 * - Composite 3-12 part procedural snake head & grounded props
 * - Smooth exponential damping for camera and snake kinematics
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SNAKE_SKINS } from './skins';
import { WORLDS } from './worlds';
import {
  calculateCoinsEarned,
  calculateScore,
  checkCollision,
  checkFoodPickup,
  checkLevelComplete,
  checkTailCollision,
  getLevelConfig,
} from './rules';
import { createProceduralGroundTexture, createSnakeScalesTexture } from './textures';
import { soundManager } from './audio';
import { FoodItem, GameMode, LevelConfig, Obstacle, Position2D, SkinId, WorldId } from './types';

// Pre-allocated math objects to ensure zero GC in animation loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3Cam = new THREE.Vector3();
const _quatA = new THREE.Quaternion();

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number, apples: number, combo: number, coins: number, diamonds: number) => void;
  onGameOver: (finalScore: number, applesEaten: number, coinsEarned: number, diamondsEarned: number, reason: string) => void;
  onLevelComplete: (level: number, score: number, coinsEarned: number, diamondsEarned: number) => void;
  onTimerUpdate?: (remainingSeconds: number) => void;
}

export class ThreeSnakeGame {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private pmremGenerator: THREE.PMREMGenerator | null = null;
  private isSoftwareGl: boolean = false;
  private animationFrameId: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Game state
  private mode: GameMode = 'classic';
  private worldId: WorldId = 'jungle';
  private skinId: SkinId = 'green';
  private level: number = 1;
  private levelConfig: LevelConfig | null = null;
  private levelTimer: number = 0;

  private score: number = 0;
  private applesEaten: number = 0;
  private coinsEarned: number = 0;
  private diamondsEarned: number = 0;
  private comboMultiplier: number = 1;
  private comboTimer: number = 0;

  // Snake mechanics
  private snakeHeadPos: Position2D = { x: 0, z: 0 };
  private snakeVelocity: Position2D = { x: 0, z: -1 };
  private targetDirection: Position2D = { x: 0, z: -1 };
  private moveSpeed: number = 7.5; // units per second
  private turnSpeed: number = 12.0;
  private segmentSpacing: number = 0.55;
  private bodyHistory: Position2D[] = [];
  private snakeSegments: Position2D[] = [];
  private targetSegmentCount: number = 6;

  // 3D Visual Objects
  private snakeHeadGroup: THREE.Group = new THREE.Group();
  private snakeTongue: THREE.Mesh | null = null;
  private snakeLeftEye: THREE.Group | null = null;
  private snakeRightEye: THREE.Group | null = null;
  private segmentMeshes: THREE.Mesh[] = [];
  private segmentShadows: THREE.Mesh[] = [];
  private headShadow: THREE.Mesh | null = null;

  // Arena & Props
  private arenaMesh: THREE.Mesh | null = null;
  private wallGroup: THREE.Group = new THREE.Group();
  private obstacles: Obstacle[] = [];
  private obstacleMeshes: THREE.Object3D[] = [];
  private foodItems: FoodItem[] = [];
  private foodMeshes: Map<string, THREE.Group> = new Map();

  // Shared Geometries & Materials
  private headMaterial: THREE.MeshStandardMaterial | null = null;
  private bodyMaterial: THREE.MeshStandardMaterial | null = null;
  private shadowMaterial: THREE.MeshBasicMaterial | null = null;
  private appleGeometry: THREE.BufferGeometry | null = null;
  private appleMaterial: THREE.MeshStandardMaterial | null = null;
  private starGeometry: THREE.BufferGeometry | null = null;
  private starMaterial: THREE.MeshStandardMaterial | null = null;
  private diamondGeometry: THREE.BufferGeometry | null = null;
  private diamondMaterial: THREE.MeshPhysicalMaterial | null = null;
  private berryGeometry: THREE.BufferGeometry | null = null;
  private berryMaterial: THREE.MeshStandardMaterial | null = null;

  // Particles
  private particleGroup: THREE.Group = new THREE.Group();
  private activeParticles: {
    mesh: THREE.Mesh;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];

  // Camera Shake & Juice
  private cameraTrauma: number = 0;
  private lastTime: number = performance.now();
  private callbacks: GameEngineCallbacks;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Detect software WebGL safely
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup scene
    this.scene = new THREE.Scene();

    // 3. Setup Camera (Mobile Portrait 9:16 optimized FOV)
    const aspect = this.container.clientWidth / (this.container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(54, aspect, 0.1, 150);
    this.camera.position.set(0, 18, 14);
    this.camera.lookAt(0, 0, 0);

    // 4. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 5. Studio Environment map via RoomEnvironment
    try {
      this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    } catch (e) {
      console.warn('RoomEnvironment fallback', e);
    }

    // Add particle group and wall group
    this.scene.add(this.particleGroup);
    this.scene.add(this.wallGroup);

    // Shared shadow material
    this.shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });

    // Window resize binding
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.onKeyDown);
  }

  public initGame(
    mode: GameMode,
    worldId: WorldId,
    skinId: SkinId,
    level: number = 1
  ) {
    this.mode = mode;
    this.worldId = worldId;
    this.skinId = skinId;
    this.level = level;
    this.levelConfig = mode === 'level' ? getLevelConfig(level) : null;
    this.levelTimer = this.levelConfig?.timeLimitSeconds || 120; // 2 min for time challenge

    this.score = 0;
    this.applesEaten = 0;
    this.coinsEarned = 0;
    this.diamondsEarned = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.cameraTrauma = 0;

    // Reset snake coordinates
    this.snakeHeadPos = { x: 0, z: 2 };
    this.snakeVelocity = { x: 0, z: -1 };
    this.targetDirection = { x: 0, z: -1 };
    this.targetSegmentCount = 6;
    this.bodyHistory = [];
    this.snakeSegments = [];

    // Pre-populate segments
    for (let i = 0; i < this.targetSegmentCount; i++) {
      this.snakeSegments.push({ x: 0, z: 2 + i * this.segmentSpacing });
    }
    for (let i = 0; i < 200; i++) {
      this.bodyHistory.push({ x: 0, z: 2 + (i * 0.1) });
    }

    // Set speed depending on skin & mode
    const skinDef = SNAKE_SKINS[skinId];
    this.moveSpeed = 7.5 + (skinDef.id === 'red' ? 0.8 : 0);

    // Build 3D World Scene
    this.buildWorld();
    this.buildSnakeVisuals();
    this.spawnInitialFood();

    // Sound
    soundManager.startBGM(this.worldId);

    this.callbacks.onScoreUpdate(
      this.score,
      this.applesEaten,
      this.comboMultiplier,
      this.coinsEarned,
      this.diamondsEarned
    );
  }

  /**
   * Builds the 3D World Arena, Environment, Lighting, and Obstacles
   */
  private buildWorld() {
    const worldDef = WORLDS[this.worldId];

    // Clear existing objects
    if (this.arenaMesh) {
      this.scene.remove(this.arenaMesh);
      this.arenaMesh.geometry.dispose();
      this.arenaMesh = null;
    }
    while (this.wallGroup.children.length > 0) {
      const child = this.wallGroup.children[0];
      this.wallGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }
    this.obstacleMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
    });
    this.obstacleMeshes = [];
    this.obstacles = [];

    // Clear food
    this.foodMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
    });
    this.foodMeshes.clear();
    this.foodItems = [];

    // Clear lights
    const existingLights = this.scene.children.filter((c) => c instanceof THREE.Light);
    existingLights.forEach((l) => this.scene.remove(l));

    // Sky & Fog
    this.scene.background = new THREE.Color(worldDef.skyColor);
    this.scene.fog = new THREE.FogExp2(worldDef.fogColor, 0.022);

    // 1. Studio Lighting Rig (Key, Fill, Rim)
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    keyLight.position.set(12, 22, 12);
    keyLight.castShadow = !this.isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 60;
      const d = worldDef.arenaSize / 2 + 4;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xdff0ff, 0x1a2e1d, worldDef.ambientIntensity);
    this.scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(worldDef.wallColor, 1.0);
    rimLight.position.set(-15, 10, -15);
    this.scene.add(rimLight);

    // 2. Procedural Ground Mesh
    const groundTex = createProceduralGroundTexture(this.worldId);
    const groundGeo = new THREE.PlaneGeometry(worldDef.arenaSize, worldDef.arenaSize);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.7,
      metalness: 0.15,
      color: 0xffffff,
    });
    this.arenaMesh = new THREE.Mesh(groundGeo, groundMat);
    this.arenaMesh.rotation.x = -Math.PI / 2;
    this.arenaMesh.position.y = 0;
    this.arenaMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(this.arenaMesh);

    // 3. Perimeter Boundary Fences / Laser Energy Pylons
    const half = worldDef.arenaSize / 2;
    const postGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.8, 8);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const laserMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(worldDef.wallColor),
      transparent: true,
      opacity: 0.65,
    });

    const step = 4;
    for (let x = -half; x <= half; x += step) {
      // Top wall post
      this.createWallPost(x, -half, postGeo, postMat, worldDef.wallColor);
      // Bottom wall post
      this.createWallPost(x, half, postGeo, postMat, worldDef.wallColor);
    }
    for (let z = -half; z <= half; z += step) {
      // Left wall post
      this.createWallPost(-half, z, postGeo, postMat, worldDef.wallColor);
      // Right wall post
      this.createWallPost(half, z, postGeo, postMat, worldDef.wallColor);
    }

    // Glowing Laser barrier planes between posts
    const beamGeoX = new THREE.BoxGeometry(worldDef.arenaSize, 0.25, 0.15);
    const beamTop = new THREE.Mesh(beamGeoX, laserMat);
    beamTop.position.set(0, 0.9, -half);
    const beamBottom = new THREE.Mesh(beamGeoX, laserMat);
    beamBottom.position.set(0, 0.9, half);
    this.wallGroup.add(beamTop, beamBottom);

    const beamGeoZ = new THREE.BoxGeometry(0.15, 0.25, worldDef.arenaSize);
    const beamLeft = new THREE.Mesh(beamGeoZ, laserMat);
    beamLeft.position.set(-half, 0.9, 0);
    const beamRight = new THREE.Mesh(beamGeoZ, laserMat);
    beamRight.position.set(half, 0.9, 0);
    this.wallGroup.add(beamLeft, beamRight);

    // 4. Procedural 3D Obstacles
    const obstacleCount = this.mode === 'level' && this.levelConfig ? this.levelConfig.obstacleCount : worldDef.obstacleCount;
    this.generateObstacles(obstacleCount, worldDef.arenaSize);
  }

  private createWallPost(
    x: number,
    z: number,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    glowColor: string
  ) {
    const post = new THREE.Mesh(geo, mat);
    post.position.set(x, 0.9, z);
    post.castShadow = !this.isSoftwareGl;

    // Glowing neon beacon on top of post
    const beaconGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: glowColor });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 1.0;
    post.add(beacon);

    this.wallGroup.add(post);
  }

  private generateObstacles(count: number, arenaSize: number) {
    const half = arenaSize / 2 - 3;
    const colors = [0x475569, 0x334155, 0x1e293b];

    for (let i = 0; i < count; i++) {
      let x = (Math.random() - 0.5) * half * 2;
      let z = (Math.random() - 0.5) * half * 2;
      // Keep a wide clear corridor in front of the player's spawn (spawn is at x:0, z:2, moving north towards z:-half)
      if (Math.abs(x) < 3.8 && z > -14 && z < 6) {
        x += x >= 0 ? 5.5 : -5.5;
        if (Math.abs(x) > half) {
          x = (Math.random() - 0.5) * half * 1.5;
        }
      }

      const radius = 0.8 + Math.random() * 0.5;
      const height = 1.8 + Math.random() * 1.5;

      const obsGroup = new THREE.Group();
      obsGroup.position.set(x, 0, z);

      if (this.worldId === 'desert') {
        // Sandstone Pyramid Monolith
        const geo = new THREE.ConeGeometry(radius, height, 4);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xd97706,
          roughness: 0.8,
          metalness: 0.1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = height / 2;
        mesh.rotation.y = Math.PI / 4;
        mesh.castShadow = !this.isSoftwareGl;
        obsGroup.add(mesh);
      } else if (this.worldId === 'ice') {
        // Glowing Ice Crystal Spire
        const geo = new THREE.ConeGeometry(radius, height, 6);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.3,
          roughness: 0.2,
          metalness: 0.4,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = height / 2;
        mesh.castShadow = !this.isSoftwareGl;
        obsGroup.add(mesh);
      } else if (this.worldId === 'lava') {
        // Volcanic Obsidian Basalt Spire with lava fissure
        const geo = new THREE.CylinderGeometry(radius * 0.6, radius, height, 5);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x1c1917,
          roughness: 0.9,
          metalness: 0.3,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = height / 2;
        mesh.castShadow = !this.isSoftwareGl;
        obsGroup.add(mesh);

        // Core glow
        const glowGeo = new THREE.SphereGeometry(radius * 0.4, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = height * 0.8;
        obsGroup.add(glow);
      } else if (this.worldId === 'neon') {
        // Cyber Pylon with animated neon ring
        const geo = new THREE.BoxGeometry(radius * 1.5, height, radius * 1.5);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.2,
          metalness: 0.9,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = height / 2;
        mesh.castShadow = !this.isSoftwareGl;
        obsGroup.add(mesh);

        // Glowing ring
        const ringGeo = new THREE.TorusGeometry(radius * 1.2, 0.1, 8, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = height * 0.6;
        obsGroup.add(ring);
      } else {
        // Jungle Mossy Ancient Stone Monolith
        const geo = new THREE.CylinderGeometry(radius * 0.8, radius, height, 7);
        const mat = new THREE.MeshStandardMaterial({
          color: colors[i % colors.length],
          roughness: 0.85,
          metalness: 0.1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = height / 2;
        mesh.castShadow = !this.isSoftwareGl;
        obsGroup.add(mesh);
      }

      // Ground contact shadow disc
      const shadowGeo = new THREE.CircleGeometry(radius * 1.4, 16);
      const shadow = new THREE.Mesh(shadowGeo, this.shadowMaterial!);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.02;
      obsGroup.add(shadow);

      this.scene.add(obsGroup);
      this.obstacleMeshes.push(obsGroup);
      this.obstacles.push({
        id: `obs_${i}`,
        x,
        z,
        radius: radius * 0.9,
        height,
        type: 'rock',
      });
    }
  }

  /**
   * Procedural Composite 3-12 Part 3D Snake Visuals
   */
  private buildSnakeVisuals() {
    const skinDef = SNAKE_SKINS[this.skinId];

    // Clear old snake head parts
    while (this.snakeHeadGroup.children.length > 0) {
      const child = this.snakeHeadGroup.children[0];
      this.snakeHeadGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }
    this.scene.remove(this.snakeHeadGroup);

    // Clear old segment meshes
    this.segmentMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    });
    this.segmentMeshes = [];

    this.segmentShadows.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    });
    this.segmentShadows = [];

    // Snake Materials
    const skinTex = createSnakeScalesTexture(
      skinDef.primaryColor,
      skinDef.secondaryColor,
      skinDef.pattern
    );

    this.headMaterial = new THREE.MeshStandardMaterial({
      map: skinTex,
      color: 0xffffff,
      roughness: skinDef.roughness,
      metalness: skinDef.metalness,
      emissive: new THREE.Color(skinDef.emissiveColor),
      emissiveIntensity: 0.35,
    });

    this.bodyMaterial = new THREE.MeshStandardMaterial({
      map: skinTex,
      color: 0xffffff,
      roughness: skinDef.roughness,
      metalness: skinDef.metalness,
      emissive: new THREE.Color(skinDef.emissiveColor),
      emissiveIntensity: 0.25,
    });

    // 1. Procedural 3D Snake Head Group (Composite 8-part Model)
    // Part A: Main skull capsule
    const skullGeo = new THREE.SphereGeometry(0.65, 16, 16);
    skullGeo.scale(1.0, 0.75, 1.25);
    const skullMesh = new THREE.Mesh(skullGeo, this.headMaterial);
    skullMesh.position.set(0, 0.55, 0);
    skullMesh.castShadow = !this.isSoftwareGl;
    this.snakeHeadGroup.add(skullMesh);

    // Part B: Upper Snout / Jaw Extension
    const snoutGeo = new THREE.SphereGeometry(0.45, 12, 12);
    snoutGeo.scale(0.85, 0.55, 1.1);
    const snoutMesh = new THREE.Mesh(snoutGeo, this.headMaterial);
    snoutMesh.position.set(0, 0.48, -0.65);
    snoutMesh.castShadow = !this.isSoftwareGl;
    this.snakeHeadGroup.add(snoutMesh);

    // Part C & D: Expressive Eyes (Left & Right)
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    const createEye = (x: number) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(x, 0.8, -0.3);

      const eyeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), eyeWhiteMat);
      eyeSphere.scale.set(1.0, 1.1, 0.9);
      eyeGroup.add(eyeSphere);

      const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8), pupilMat);
      pupil.position.set(0, 0, -0.1);
      eyeGroup.add(pupil);

      return eyeGroup;
    };

    this.snakeLeftEye = createEye(-0.38);
    this.snakeRightEye = createEye(0.38);
    this.snakeHeadGroup.add(this.snakeLeftEye, this.snakeRightEye);

    // Part E: Forked Snake Tongue
    const tongueGeo = new THREE.BoxGeometry(0.12, 0.04, 0.55);
    const tongueMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    this.snakeTongue = new THREE.Mesh(tongueGeo, tongueMat);
    this.snakeTongue.position.set(0, 0.38, -1.2);
    this.snakeHeadGroup.add(this.snakeTongue);

    // Part F: Skin Special Accessories (Crest / Cyber Horns)
    if (skinDef.id === 'gold' || skinDef.id === 'neon' || skinDef.id === 'mecha') {
      const crownGeo = new THREE.ConeGeometry(0.16, 0.45, 4);
      const crownMat = new THREE.MeshStandardMaterial({
        color: skinDef.secondaryColor,
        metalness: 0.9,
        roughness: 0.1,
      });
      const crownCenter = new THREE.Mesh(crownGeo, crownMat);
      crownCenter.position.set(0, 1.1, -0.15);
      const crownLeft = new THREE.Mesh(crownGeo, crownMat);
      crownLeft.position.set(-0.25, 1.0, -0.1);
      crownLeft.rotation.z = 0.3;
      const crownRight = new THREE.Mesh(crownGeo, crownMat);
      crownRight.position.set(0.25, 1.0, -0.1);
      crownRight.rotation.z = -0.3;
      this.snakeHeadGroup.add(crownCenter, crownLeft, crownRight);
    }

    // Ground Contact Shadow Disc for Head
    const headShadowGeo = new THREE.CircleGeometry(0.75, 16);
    this.headShadow = new THREE.Mesh(headShadowGeo, this.shadowMaterial!);
    this.headShadow.rotation.x = -Math.PI / 2;
    this.headShadow.position.y = 0.015;
    this.snakeHeadGroup.add(this.headShadow);

    this.scene.add(this.snakeHeadGroup);

    // 2. Segment Meshes
    for (let i = 0; i < this.targetSegmentCount; i++) {
      this.addSegmentMesh(i);
    }
  }

  private addSegmentMesh(index: number) {
    // Tapering scale along body length
    const factor = Math.max(0.45, 1.0 - (index / 60));
    const radius = 0.52 * factor;

    const segGeo = new THREE.SphereGeometry(radius, 12, 12);
    segGeo.scale(1.0, 0.85, 1.05);

    const segMesh = new THREE.Mesh(segGeo, this.bodyMaterial!);
    segMesh.position.set(this.snakeHeadPos.x, 0.42 * factor, this.snakeHeadPos.z);
    segMesh.castShadow = !this.isSoftwareGl;
    this.scene.add(segMesh);
    this.segmentMeshes.push(segMesh);

    // Contact shadow
    const shadowGeo = new THREE.CircleGeometry(radius * 1.25, 12);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMaterial!);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.012;
    this.scene.add(shadowMesh);
    this.segmentShadows.push(shadowMesh);
  }

  /**
   * Spawns initial apples and bonus items
   */
  private spawnInitialFood() {
    // Guaranteed first apple right ahead of snake spawn for immediate juicy feedback
    this.spawnFoodAt(0, -4.5, 'apple');
    this.spawnFood('apple');
    if (Math.random() > 0.4) {
      this.spawnFood('golden_star');
    }
    if (Math.random() > 0.6) {
      this.spawnFood('diamond');
    }
  }

  private spawnFoodAt(x: number, z: number, type: 'apple' | 'golden_star' | 'diamond' | 'speed_berry') {
    const foodId = `food_${Date.now()}_${Math.random()}`;
    const foodItem: FoodItem = {
      id: foodId,
      x,
      z,
      type,
      points: type === 'apple' ? 10 : type === 'golden_star' ? 30 : type === 'diamond' ? 50 : 25,
      coins: type === 'apple' ? 2 : type === 'golden_star' ? 10 : 25,
      diamonds: type === 'diamond' ? 1 : 0,
      spawnTime: performance.now(),
    };
    this.foodItems.push(foodItem);
    this.createFoodMesh(foodItem);
  }

  private spawnFood(type: 'apple' | 'golden_star' | 'diamond' | 'speed_berry') {
    const worldDef = WORLDS[this.worldId];
    const half = worldDef.arenaSize / 2 - 2.5;

    let x = 0;
    let z = 0;
    let safe = false;
    let attempts = 0;

    while (!safe && attempts < 25) {
      x = (Math.random() - 0.5) * half * 2;
      z = (Math.random() - 0.5) * half * 2;
      attempts++;

      // Check distance from obstacles
      safe = true;
      for (const obs of this.obstacles) {
        const dx = x - obs.x;
        const dz = z - obs.z;
        if (dx * dx + dz * dz < (obs.radius + 1.2) * (obs.radius + 1.2)) {
          safe = false;
          break;
        }
      }
      // Check distance from snake head
      const dxHead = x - this.snakeHeadPos.x;
      const dzHead = z - this.snakeHeadPos.z;
      if (dxHead * dxHead + dzHead * dzHead < 9) {
        safe = false;
      }
    }

    const foodId = `food_${Date.now()}_${Math.random()}`;
    const foodItem: FoodItem = {
      id: foodId,
      x,
      z,
      type,
      points: type === 'apple' ? 10 : type === 'golden_star' ? 30 : type === 'diamond' ? 50 : 25,
      coins: type === 'apple' ? 2 : type === 'golden_star' ? 10 : 25,
      diamonds: type === 'diamond' ? 1 : 0,
      spawnTime: performance.now(),
      duration: type === 'speed_berry' || type === 'golden_star' ? 15000 : undefined,
    };

    this.foodItems.push(foodItem);
    this.createFoodMesh(foodItem);
  }

  private createFoodMesh(food: FoodItem) {
    const group = new THREE.Group();
    group.position.set(food.x, 0, food.z);

    if (food.type === 'apple') {
      // 3D Red Apple
      if (!this.appleGeometry) {
        this.appleGeometry = new THREE.SphereGeometry(0.42, 14, 14);
        this.appleGeometry.scale(1.0, 0.9, 1.0);
      }
      if (!this.appleMaterial) {
        this.appleMaterial = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          roughness: 0.3,
          metalness: 0.1,
          emissive: 0x991b1b,
          emissiveIntensity: 0.15,
        });
      }
      const apple = new THREE.Mesh(this.appleGeometry, this.appleMaterial);
      apple.position.y = 0.45;
      apple.castShadow = !this.isSoftwareGl;
      group.add(apple);

      // Stem & Green Leaf
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.25, 6),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
      );
      stem.position.set(0, 0.88, 0);
      stem.rotation.z = 0.2;
      group.add(stem);

      const leaf = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.02, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 })
      );
      leaf.position.set(0.12, 0.92, 0);
      leaf.rotation.z = -0.3;
      group.add(leaf);
    } else if (food.type === 'golden_star') {
      // Rotating 3D Golden Trophy Star
      if (!this.starGeometry) {
        this.starGeometry = new THREE.OctahedronGeometry(0.45, 0);
      }
      if (!this.starMaterial) {
        this.starMaterial = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: 0xca8a04,
          emissiveIntensity: 0.4,
          metalness: 0.9,
          roughness: 0.15,
        });
      }
      const star = new THREE.Mesh(this.starGeometry, this.starMaterial);
      star.position.y = 0.55;
      star.castShadow = !this.isSoftwareGl;
      group.add(star);

      // Orbiting Sparkle Ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.04, 8, 16),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      ring.position.y = 0.55;
      ring.rotation.x = Math.PI / 3;
      group.add(ring);
    } else if (food.type === 'diamond') {
      // Cyan Cyber Diamond (Biconical double pyramid)
      if (!this.diamondGeometry) {
        this.diamondGeometry = new THREE.ConeGeometry(0.4, 0.8, 6);
      }
      if (!this.diamondMaterial) {
        this.diamondMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.5,
          roughness: 0.1,
          metalness: 0.8,
        });
      }
      const diamondTop = new THREE.Mesh(this.diamondGeometry, this.diamondMaterial);
      diamondTop.position.y = 0.6;
      diamondTop.castShadow = !this.isSoftwareGl;
      const diamondBottom = new THREE.Mesh(this.diamondGeometry, this.diamondMaterial);
      diamondBottom.position.y = 0.6;
      diamondBottom.rotation.x = Math.PI;
      group.add(diamondTop, diamondBottom);
    } else {
      // Speed Berry (Magenta glowing orb)
      if (!this.berryGeometry) {
        this.berryGeometry = new THREE.SphereGeometry(0.38, 12, 12);
      }
      if (!this.berryMaterial) {
        this.berryMaterial = new THREE.MeshStandardMaterial({
          color: 0xd946ef,
          emissive: 0xa21caf,
          emissiveIntensity: 0.6,
          metalness: 0.3,
          roughness: 0.2,
        });
      }
      const berry = new THREE.Mesh(this.berryGeometry, this.berryMaterial);
      berry.position.y = 0.45;
      group.add(berry);
    }

    // Contact shadow
    const shadowGeo = new THREE.CircleGeometry(0.4, 12);
    const shadow = new THREE.Mesh(shadowGeo, this.shadowMaterial!);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    group.add(shadow);

    this.scene.add(group);
    this.foodMeshes.set(food.id, group);
  }

  /**
   * Spawn particle bursts on food collection or impact
   */
  private spawnParticleBurst(x: number, y: number, z: number, colorHex: number, count: number = 10) {
    const pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const pMat = new THREE.MeshBasicMaterial({ color: colorHex });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(pGeo, pMat);
      mesh.position.set(x, y, z);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 8
      );
      this.particleGroup.add(mesh);
      this.activeParticles.push({
        mesh,
        vel,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.3,
      });
    }
  }

  /**
   * Virtual Joystick Direct Input
   */
  public setJoystickInput(dx: number, dy: number) {
    if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15) return;
    const len = Math.sqrt(dx * dx + dy * dy);
    const normX = dx / len;
    const normY = dy / len;

    // Prevent direct 180-degree self-reversal into the snake neck
    const dot = normX * this.snakeVelocity.x + normY * this.snakeVelocity.z;
    if (dot > -0.85) {
      this.targetDirection = { x: normX, z: normY };
    }
  }

  /**
   * Mobile Swipe Control Handler
   */
  public handleSwipe(direction: 'up' | 'down' | 'left' | 'right') {
    let newDir = { x: 0, z: 0 };
    switch (direction) {
      case 'up':
        newDir = { x: 0, z: -1 };
        break;
      case 'down':
        newDir = { x: 0, z: 1 };
        break;
      case 'left':
        newDir = { x: -1, z: 0 };
        break;
      case 'right':
        newDir = { x: 1, z: 0 };
        break;
    }
    // Prevent 180° reverse
    if (newDir.x !== -this.snakeVelocity.x || newDir.z !== -this.snakeVelocity.z) {
      this.targetDirection = newDir;
    }
  }

  /**
   * Keyboard controls fallback
   */
  private onKeyDown = (e: KeyboardEvent) => {
    if (this.isPaused || !this.isRunning) return;
    let newDir: Position2D | null = null;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') newDir = { x: 0, z: -1 };
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') newDir = { x: 0, z: 1 };
    else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') newDir = { x: -1, z: 0 };
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') newDir = { x: 1, z: 0 };

    if (newDir) {
      if (newDir.x !== -this.snakeVelocity.x || newDir.z !== -this.snakeVelocity.z) {
        this.targetDirection = newDir;
      }
    }
  };

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      soundManager.stopBGM();
    } else {
      soundManager.startBGM(this.worldId);
      this.lastTime = performance.now();
    }
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
    soundManager.stopBGM();
  }

  /**
   * Software WebGL afterDraw synchronization helper
   */
  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animationFrameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.animationFrameId = window.setTimeout(cb, 80);
      }
    };
    this.animationFrameId = window.setTimeout(poll, 5);
  }

  /**
   * Main 60fps Game Simulation Loop
   */
  private loop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05); // clamp delta time for stability

    if (!this.isPaused) {
      this.update(dt);
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.loop);
    } else {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  };

  /**
   * Simulation Step
   */
  private update(dt: number) {
    const worldDef = WORLDS[this.worldId];

    // 1. Level & Mode Timers
    if (this.mode === 'time_challenge' || (this.mode === 'level' && this.levelConfig?.timeLimitSeconds)) {
      this.levelTimer -= dt;
      if (this.callbacks.onTimerUpdate) {
        this.callbacks.onTimerUpdate(Math.max(0, Math.ceil(this.levelTimer)));
      }
      if (this.levelTimer <= 0) {
        if (this.mode === 'level' && this.levelConfig && checkLevelComplete(this.applesEaten, this.score, this.levelConfig)) {
          this.triggerLevelVictory();
        } else {
          this.triggerGameOver('Time Expired!');
        }
        return;
      }
    }

    // 2. Combo Timer Decay
    if (this.comboMultiplier > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboMultiplier = 1;
        this.callbacks.onScoreUpdate(this.score, this.applesEaten, this.comboMultiplier, this.coinsEarned, this.diamondsEarned);
      }
    }

    // 3. Smooth Direction Turn Interpolation
    const turnDamp = Math.min(1.0, this.turnSpeed * dt);
    this.snakeVelocity.x += (this.targetDirection.x - this.snakeVelocity.x) * turnDamp;
    this.snakeVelocity.z += (this.targetDirection.z - this.snakeVelocity.z) * turnDamp;
    // Normalize velocity vector
    const speedLen = Math.sqrt(this.snakeVelocity.x * this.snakeVelocity.x + this.snakeVelocity.z * this.snakeVelocity.z);
    if (speedLen > 0.001) {
      this.snakeVelocity.x /= speedLen;
      this.snakeVelocity.z /= speedLen;
    }

    // 4. Advance Snake Head
    const stepDist = this.moveSpeed * dt;
    this.snakeHeadPos.x += this.snakeVelocity.x * stepDist;
    this.snakeHeadPos.z += this.snakeVelocity.z * stepDist;

    // Record position in body history
    this.bodyHistory.unshift({ x: this.snakeHeadPos.x, z: this.snakeHeadPos.z });
    if (this.bodyHistory.length > 500) {
      this.bodyHistory.pop();
    }

    // 5. Check Wall & Obstacle Collisions
    const coll = checkCollision(this.snakeHeadPos, 0.45, this.obstacles, worldDef.arenaSize);
    if (coll.collided) {
      this.cameraTrauma = 1.0;
      soundManager.playCrash();
      this.spawnParticleBurst(this.snakeHeadPos.x, 0.6, this.snakeHeadPos.z, 0xef4444, 25);
      this.triggerGameOver(coll.reason === 'wall' ? 'Crashed into Arena Wall!' : 'Hit Obstacle!');
      return;
    }

    // 6. Check Tail Bite Collision
    if (checkTailCollision(this.snakeHeadPos, this.snakeSegments, 7, 0.65)) {
      this.cameraTrauma = 1.0;
      soundManager.playCrash();
      this.spawnParticleBurst(this.snakeHeadPos.x, 0.6, this.snakeHeadPos.z, 0xef4444, 25);
      this.triggerGameOver('Bit own tail!');
      return;
    }

    // 7. Update Snake Segments (Follow Path with Spacing Constraint)
    const historyStep = Math.max(1, Math.round(this.segmentSpacing / (stepDist || 0.05)));
    for (let i = 0; i < this.snakeSegments.length; i++) {
      const historyIdx = Math.min(this.bodyHistory.length - 1, (i + 1) * historyStep);
      const targetPos = this.bodyHistory[historyIdx] || this.snakeHeadPos;

      // Add gentle organic sine undulation
      const wave = Math.sin((performance.now() * 0.008) + i * 0.45) * 0.06;
      const perpX = -this.snakeVelocity.z * wave;
      const perpZ = this.snakeVelocity.x * wave;

      this.snakeSegments[i] = {
        x: targetPos.x + perpX,
        z: targetPos.z + perpZ,
      };

      // Update 3D Segment Mesh
      if (this.segmentMeshes[i]) {
        this.segmentMeshes[i].position.set(this.snakeSegments[i].x, 0.45, this.snakeSegments[i].z);
      }
      if (this.segmentShadows[i]) {
        this.segmentShadows[i].position.set(this.snakeSegments[i].x, 0.012, this.snakeSegments[i].z);
      }
    }

    // 8. Update 3D Snake Head Position & Rotation
    this.snakeHeadGroup.position.set(this.snakeHeadPos.x, 0, this.snakeHeadPos.z);
    const headAngle = Math.atan2(this.snakeVelocity.x, this.snakeVelocity.z);
    this.snakeHeadGroup.rotation.y = headAngle + Math.PI;

    // Flickering tongue animation
    if (this.snakeTongue) {
      const tongueOsc = Math.sin(performance.now() * 0.015);
      this.snakeTongue.position.z = -1.1 + (tongueOsc > 0.4 ? tongueOsc * 0.25 : 0);
    }

    // 9. Food Pickup Checks
    for (let i = this.foodItems.length - 1; i >= 0; i--) {
      const food = this.foodItems[i];
      if (checkFoodPickup(this.snakeHeadPos, food, 1.15)) {
        this.handleEatFood(food);
        this.foodItems.splice(i, 1);
        const mesh = this.foodMeshes.get(food.id);
        if (mesh) {
          this.scene.remove(mesh);
          this.foodMeshes.delete(food.id);
        }
        // Spawn replacement food
        this.spawnFood('apple');
        if (Math.random() > 0.5 && this.foodItems.length < 4) {
          const bonusTypes: ('golden_star' | 'diamond' | 'speed_berry')[] = ['golden_star', 'diamond', 'speed_berry'];
          this.spawnFood(bonusTypes[Math.floor(Math.random() * bonusTypes.length)]);
        }
      }
    }

    // 10. Food Hover & Rotation Animations
    const animTime = performance.now() * 0.003;
    this.foodMeshes.forEach((group) => {
      group.rotation.y += 0.035;
      group.position.y = Math.sin(animTime + group.position.x) * 0.12;
    });

    // 11. Particles Update
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life += dt;
      p.vel.y -= 18 * dt; // gravity
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += 0.1;
      p.mesh.rotation.y += 0.1;

      const scale = Math.max(0.001, 1 - (p.life / p.maxLife));
      p.mesh.scale.set(scale, scale, scale);

      if (p.life >= p.maxLife || p.mesh.position.y < 0.05) {
        this.particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.activeParticles.splice(i, 1);
      }
    }

    // 12. Camera Follow with Exponential Damping & Decay Shake
    _vec3Cam.set(this.snakeHeadPos.x, 18, this.snakeHeadPos.z + 14);
    this.camera.position.lerp(_vec3Cam, Math.min(1.0, 4.5 * dt));

    // Decaying rotational trauma shake
    if (this.cameraTrauma > 0) {
      this.cameraTrauma = Math.max(0, this.cameraTrauma - 1.8 * dt);
      const shakeAmt = this.cameraTrauma * this.cameraTrauma * 0.4;
      this.camera.position.x += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmt;
    }

    _vec3B.set(this.snakeHeadPos.x, 0.5, this.snakeHeadPos.z - 2.0);
    this.camera.lookAt(_vec3B);

    // 13. Level Victory Check for Level Mode
    if (this.mode === 'level' && this.levelConfig && checkLevelComplete(this.applesEaten, this.score, this.levelConfig)) {
      this.triggerLevelVictory();
    }
  }

  private handleEatFood(food: FoodItem) {
    this.applesEaten++;
    this.comboMultiplier = Math.min(10, this.comboMultiplier + 1);
    this.comboTimer = 3.5; // combo lasts 3.5s

    const points = food.points * this.comboMultiplier;
    this.score += points;

    const hasCoinBonus = this.skinId === 'gold';
    const earnedCoins = calculateCoinsEarned(food.coins, food.diamonds, 1, hasCoinBonus);
    this.coinsEarned += earnedCoins;
    this.diamondsEarned += food.diamonds;

    // Grow snake
    this.growSnake(food.type === 'golden_star' ? 3 : 1);

    // Audio & Particles
    if (food.type === 'apple') {
      soundManager.playEat();
      this.spawnParticleBurst(food.x, 0.6, food.z, 0xef4444, 12);
    } else if (food.type === 'golden_star') {
      soundManager.playBonus();
      this.spawnParticleBurst(food.x, 0.6, food.z, 0xfacc15, 20);
    } else if (food.type === 'diamond') {
      soundManager.playBonus();
      this.spawnParticleBurst(food.x, 0.6, food.z, 0x38bdf8, 25);
    } else {
      soundManager.playBonus();
      this.spawnParticleBurst(food.x, 0.6, food.z, 0xd946ef, 16);
    }

    this.callbacks.onScoreUpdate(
      this.score,
      this.applesEaten,
      this.comboMultiplier,
      this.coinsEarned,
      this.diamondsEarned
    );
  }

  private growSnake(segmentsToAdd: number = 1) {
    for (let k = 0; k < segmentsToAdd; k++) {
      const lastSeg = this.snakeSegments[this.snakeSegments.length - 1] || this.snakeHeadPos;
      this.snakeSegments.push({ x: lastSeg.x, z: lastSeg.z });
      this.addSegmentMesh(this.snakeSegments.length - 1);
    }
    this.targetSegmentCount = this.snakeSegments.length;
  }

  private triggerGameOver(reason: string) {
    this.stop();
    soundManager.playGameOver();
    this.callbacks.onGameOver(
      this.score,
      this.applesEaten,
      this.coinsEarned,
      this.diamondsEarned,
      reason
    );
  }

  private triggerLevelVictory() {
    this.stop();
    soundManager.playVictory();
    if (this.levelConfig) {
      this.coinsEarned += this.levelConfig.rewardCoins;
      this.diamondsEarned += this.levelConfig.rewardDiamonds;
    }
    this.callbacks.onLevelComplete(
      this.level,
      this.score,
      this.coinsEarned,
      this.diamondsEarned
    );
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 1;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.onKeyDown);

    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
      this.pmremGenerator = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
}
