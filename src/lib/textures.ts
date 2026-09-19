import * as THREE from 'three';

// Small procedurally-generated sprite textures (no external image assets, no
// licensing concerns) used by the 3D sky dome.

let starSpriteTexture: THREE.Texture | null = null;

export function getStarSpriteTexture(): THREE.Texture {
  if (starSpriteTexture) return starSpriteTexture;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  starSpriteTexture = new THREE.CanvasTexture(canvas);
  return starSpriteTexture;
}

let glowSpriteTexture: THREE.Texture | null = null;

export function getGlowSpriteTexture(): THREE.Texture {
  if (glowSpriteTexture) return glowSpriteTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,250,220,1)');
  gradient.addColorStop(0.25, 'rgba(255,235,150,0.7)');
  gradient.addColorStop(1, 'rgba(255,235,150,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  glowSpriteTexture = new THREE.CanvasTexture(canvas);
  return glowSpriteTexture;
}
