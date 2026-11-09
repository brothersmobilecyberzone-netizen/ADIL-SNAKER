/**
 * ADIL-SNAKER-PANEL - Game Types & Definitions
 * Official 3D Android Mobile Snake Game by ADIL PANEL
 */

export type GameState = 
  | 'splash'
  | 'home'
  | 'playing'
  | 'paused'
  | 'gameover'
  | 'shop'
  | 'worlds'
  | 'daily_rewards'
  | 'settings'
  | 'android_export';

export type GameMode = 'classic' | 'survival' | 'time_challenge' | 'level';

export type WorldId = 'jungle' | 'desert' | 'ice' | 'lava' | 'neon';

export type SkinId = 
  | 'green'
  | 'gold'
  | 'red'
  | 'blue'
  | 'fire'
  | 'ice'
  | 'rainbow'
  | 'diamond'
  | 'shadow'
  | 'neon'
  | 'radioactive'
  | 'amethyst'
  | 'galaxy'
  | 'solar'
  | 'mecha';

export type ControlType = 'joystick' | 'swipe';

export interface Position2D {
  x: number;
  z: number;
}

export interface FoodItem {
  id: string;
  x: number;
  z: number;
  type: 'apple' | 'golden_star' | 'diamond' | 'speed_berry';
  points: number;
  coins: number;
  diamonds: number;
  spawnTime: number;
  duration?: number; // for temporary bonus food
}

export interface Obstacle {
  id: string;
  x: number;
  z: number;
  radius: number;
  height: number;
  type: 'rock' | 'column' | 'crystal' | 'pylon';
}

export interface SkinDefinition {
  id: SkinId;
  name: string;
  description: string;
  priceCoins: number;
  priceDiamonds: number;
  primaryColor: string;
  secondaryColor: string;
  emissiveColor: string;
  roughness: number;
  metalness: number;
  pattern: 'plain' | 'striped' | 'scales' | 'cyber' | 'glowing';
  perk: string;
}

export interface WorldDefinition {
  id: WorldId;
  name: string;
  subtitle: string;
  description: string;
  arenaSize: number; // width and depth of square arena
  themeColor: string;
  groundColor: string;
  gridColor: string;
  wallColor: string;
  skyColor: string;
  fogColor: string;
  ambientIntensity: number;
  obstacleCount: number;
  unlockCostCoins: number;
}

export interface PlayerProgress {
  coins: number;
  diamonds: number;
  selectedSkin: SkinId;
  selectedWorld: WorldId;
  selectedMode: GameMode;
  unlockedSkins: SkinId[];
  unlockedWorlds: WorldId[];
  highScores: Record<GameMode, number>;
  totalApplesEaten: number;
  currentLevel: number;
  dailyStreak: number;
  lastDailyClaimTimestamp: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  controlType: ControlType;
  graphicsQuality: 'high' | 'medium' | 'low';
}

export interface LevelConfig {
  levelNumber: number;
  targetApples: number;
  targetScore: number;
  timeLimitSeconds?: number;
  obstacleCount: number;
  world: WorldId;
  rewardCoins: number;
  rewardDiamonds: number;
}
