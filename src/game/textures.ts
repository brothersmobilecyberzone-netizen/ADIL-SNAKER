/**
 * Procedural CanvasTextures for ADIL-SNAKER-PANEL
 * Zero external image dependencies, zero-404, high-fidelity PBR textures
 */

import * as THREE from 'three';
import { WorldId } from './types';

export function createProceduralGroundTexture(
  worldId: WorldId,
  maxAnisotropy: number = 8
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (worldId === 'jungle') {
    // Lush mossy tropical paving
    ctx.fillStyle = '#0f2918';
    ctx.fillRect(0, 0, 512, 512);

    // Stone tile outlines
    ctx.strokeStyle = '#1b4d2e';
    ctx.lineWidth = 4;
    const tileSize = 64;
    for (let x = 0; x <= 512; x += tileSize) {
      for (let y = 0; y <= 512; y += tileSize) {
        ctx.strokeRect(x, y, tileSize, tileSize);
        // Organic moss specks
        for (let i = 0; i < 5; i++) {
          const rx = x + Math.random() * tileSize;
          const ry = y + Math.random() * tileSize;
          const rRadius = 2 + Math.random() * 4;
          ctx.fillStyle = Math.random() > 0.5 ? '#166534' : '#22c55e';
          ctx.beginPath();
          ctx.arc(rx, ry, rRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (worldId === 'desert') {
    // Sunlit sand dune ripples
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 32) {
        const offset = Math.sin((x / 64) + (y / 32)) * 6;
        ctx.lineTo(x, y + offset);
      }
      ctx.stroke();
    }
    // Gold shimmer grain
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
  } else if (worldId === 'ice') {
    // Frost crystal tiles
    ctx.fillStyle = '#082f49';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, Math.random() * 512);
      ctx.lineTo(Math.random() * 512, Math.random() * 512);
      ctx.stroke();
    }
    // Hexagonal crystal snowflakes
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 15; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const angle = (a * Math.PI) / 3;
        const px = cx + Math.cos(angle) * 16;
        const py = cy + Math.sin(angle) * 16;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  } else if (worldId === 'lava') {
    // Dark cracked obsidian basalt with molten red veins
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, 512, 512);

    // Glowing magma fissures
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 12;
    for (let i = 0; i < 12; i++) {
      let curX = Math.random() * 512;
      let curY = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(curX, curY);
      for (let s = 0; s < 5; s++) {
        curX += (Math.random() - 0.5) * 80;
        curY += (Math.random() - 0.5) * 80;
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Glowing core highlights
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 10; i++) {
      ctx.strokeRect(Math.random() * 512, Math.random() * 512, 40, 40);
    }
  } else {
    // Neon Cyber Matrix Grid
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 512, 512);

    // Cyber grid lines
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    const gridStep = 32;
    for (let x = 0; x <= 512; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Glowing cyber circuit node dots
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 8;
    for (let x = 0; x <= 512; x += gridStep * 2) {
      for (let y = 0; y <= 512; y += gridStep * 2) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Procedural snake skin pattern texture
 */
export function createSnakeScalesTexture(
  primaryColor: string,
  secondaryColor: string,
  pattern: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 2;

  if (pattern === 'striped') {
    for (let y = 0; y < 128; y += 16) {
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(0, y, 128, 6);
    }
  } else if (pattern === 'cyber') {
    ctx.strokeStyle = secondaryColor;
    ctx.strokeRect(10, 10, 108, 108);
    ctx.strokeRect(24, 24, 80, 80);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(128, 128);
    ctx.moveTo(128, 0);
    ctx.lineTo(0, 128);
    ctx.stroke();
  } else if (pattern === 'glowing') {
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    grad.addColorStop(0, secondaryColor);
    grad.addColorStop(1, primaryColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  } else {
    // Scales pattern
    const scaleSize = 16;
    for (let y = 0; y < 128; y += scaleSize) {
      const offsetX = (y / scaleSize) % 2 === 0 ? 0 : scaleSize / 2;
      for (let x = -scaleSize; x < 128 + scaleSize; x += scaleSize) {
        ctx.beginPath();
        ctx.arc(x + offsetX, y, scaleSize / 2, 0, Math.PI);
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
