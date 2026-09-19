import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getBortleGlowColor } from '../../lib/lightPollution';
import { mulberry32 } from '../../lib/random';
import { DAY_START_ALT, NIGHT_END_ALT, TWILIGHT_DAY_EDGE_ALT, TWILIGHT_NIGHT_EDGE_ALT, getDayWeight } from '../../lib/skyPhysics';
import type { LightPollutionInfo } from '../../types/astronomy';

// Mirrors SkyDome's day/twilight horizon colors so the ground's horizon-side color
// converges on the same value as the sky at the seam, regardless of time of day.
const DAY_HORIZON = new THREE.Color(0.62, 0.74, 0.88);
const TWILIGHT_HORIZON = new THREE.Color(0.92, 0.52, 0.28);

const GROUND_RADIUS = 110;
const HILL_RADIUS = GROUND_RADIUS - 4;
const HILL_SEGMENTS = 96;
const GRAIN_REPEAT = 28;
const PATCH_REPEAT = 6;

// Radial/angular resolution of the terrain mesh. Matches HILL_SEGMENTS so the
// outer ring of the terrain seams cleanly with the hill silhouette below.
const TERRAIN_RINGS = 40;
const TERRAIN_SEGMENTS = HILL_SEGMENTS;
const TERRAIN_BASE_Y = -0.05;

// Rolling hills fade to flat ground near the camera (so nothing pokes through
// the near-origin viewpoint) and fade out again near the horizon ring so the
// disc's outer edge sits flush with the hill silhouette's flat base.
const FLAT_INNER_RADIUS = 2;
const RISE_INNER_RADIUS = 14;
const FALL_OUTER_RADIUS = GROUND_RADIUS - 14;
const FLAT_OUTER_RADIUS = GROUND_RADIUS - 2;
const MAX_TERRAIN_HEIGHT = 3.4;

const ROCK_COUNT = 46;

/**
 * This ground layer writes color straight to the framebuffer (toneMapped=false,
 * no output re-encoding), but three.js's ColorManagement still silently treats a
 * hex string as sRGB and decodes it to linear on the way into a THREE.Color. With
 * nothing re-encoding it back on the way out, that decode alone crushes a color
 * like '#1a1510' down to near-invisible (~3,2,1 on screen). Setting channels via
 * .setRGB() (no colorSpace arg) skips that conversion so the hex value we author
 * is the value that actually lands on screen.
 */
function rawHexColor(hex: string, target = new THREE.Color()): THREE.Color {
  const n = parseInt(hex.replace('#', ''), 16);
  return target.setRGB(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

// Lifted off pure black: at straight-down view angles the ground used to read
// as an indistinguishable void against the equally-black sky background.
const NADIR_COLOR = rawHexColor('#1a1510');

// Neutral rock albedo: real day/night brightness now comes from actual scene
// lights (ambient + sun + moon), not a hand-tinted material color.
const ROCK_ALBEDO = '#7a7266';

// The camera never really moves from the origin, so the ground's visible
// brightness/detail must be driven by *view angle*, not world-space UV
// position on the disc: at the camera's near-zero eye height, almost the
// entire radius maps to a razor-thin sliver of screen angle near the
// horizon, so a texture baked with a fixed-radius gradient never actually
// shows anything but its innermost pixel. Mirroring the sky dome's
// altitude-based shading keeps ground and sky continuous across the horizon.
const groundVertexShader = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const groundFragmentShader = `
  uniform vec3 uNadirColor;
  uniform vec3 uHorizonColor;
  uniform sampler2D uGrainTexture;
  uniform sampler2D uPatchTexture;
  uniform float uGrainRepeat;
  uniform float uPatchRepeat;
  uniform vec3 uSunDirection;
  uniform float uSunAltitude;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec3 dir = normalize(vWorldPosition);

    // Same day/twilight/night blend as SkyDome, applied only to the "horizon"
    // endpoint color, so the ground's horizon meets the sky's horizon color exactly.
    vec3 dayHorizon = vec3(${DAY_HORIZON.r.toFixed(3)}, ${DAY_HORIZON.g.toFixed(3)}, ${DAY_HORIZON.b.toFixed(3)});
    vec3 twilightHorizon = vec3(${TWILIGHT_HORIZON.r.toFixed(3)}, ${TWILIGHT_HORIZON.g.toFixed(3)}, ${TWILIGHT_HORIZON.b.toFixed(3)});
    float nightWeight = 1.0 - smoothstep(${NIGHT_END_ALT.toFixed(1)}, ${TWILIGHT_NIGHT_EDGE_ALT.toFixed(1)}, uSunAltitude);
    float dayWeight = smoothstep(${TWILIGHT_DAY_EDGE_ALT.toFixed(1)}, ${DAY_START_ALT.toFixed(1)}, uSunAltitude);
    float twilightWeight = max(0.0, 1.0 - nightWeight - dayWeight);
    vec3 horizonColor = uHorizonColor * nightWeight + dayHorizon * dayWeight + twilightHorizon * twilightWeight;

    float t = smoothstep(-0.55, -0.01, dir.y);
    vec3 base = mix(uNadirColor, horizonColor, t);

    // Faint sky-bounce: crests and slopes facing up catch a little ambient
    // light so the terrain reads as a lumpy surface instead of a flat void,
    // even straight down at the nadir where the horizon gradient contributes nothing.
    vec3 normal = normalize(vNormal);
    float skyBounce = clamp(normal.y * 0.5 + 0.5, 0.4, 1.0);
    base *= skyBounce;

    // Direct sunlight: a real Lambertian term so the terrain actually brightens
    // and throws shading toward the sun, instead of only responding to view angle.
    float sunFacing = max(dot(normal, normalize(uSunDirection)), 0.0);
    float sunStrength = clamp(uSunAltitude / 20.0, 0.0, 1.0);
    vec3 sunLightColor = mix(vec3(1.0, 0.65, 0.35), vec3(1.0, 0.97, 0.9), dayWeight);
    base += sunLightColor * sunFacing * sunStrength * 0.35;

    // Ground underfoot stays a touch brighter than the far distance so it
    // never dissolves into the background right below the viewer.
    float dist = length(vWorldPosition.xz);
    float nearBoost = (1.0 - smoothstep(0.0, 45.0, dist)) * 0.16;
    base += uNadirColor * nearBoost;

    float patchTex = texture2D(uPatchTexture, vUv * uPatchRepeat).r;
    float grain = texture2D(uGrainTexture, vUv * uGrainRepeat).r;
    base *= (0.55 + 0.35 * patchTex) * (0.7 + 0.5 * grain);
    gl_FragColor = vec4(base, 1.0);
  }
`;

/** Small tileable speckle texture so the ground reads as a granular surface at any zoom. */
function buildGrainTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const rand = mulberry32(71829);
  for (let i = 0; i < 900; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const shade = Math.round(rand() * 255);
    const alpha = 0.15 + rand() * 0.35;
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.6 + rand() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Coarser, larger-scale blotches (dirt/rock patches) layered under the fine grain
 * so the terrain reads as an uneven surface instead of uniform static speckle. */
function buildPatchTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const rand = mulberry32(56213);
  for (let i = 0; i < 40; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const radius = 10 + rand() * 26;
    const shade = Math.round(rand() * 255);
    const alpha = 0.2 + rand() * 0.3;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${shade}, ${shade}, ${shade}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${shade}, ${shade}, ${shade}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** A small seeded grid of random values, smoothly sampled to make cheap 2D value-noise. */
function buildNoiseGrid(seed: number, rings: number, segments: number): number[][] {
  const rand = mulberry32(seed);
  const grid: number[][] = [];
  for (let i = 0; i <= rings; i++) {
    const row: number[] = [];
    for (let j = 0; j < segments; j++) row.push(rand() * 2 - 1);
    grid.push(row);
  }
  return grid;
}

/** Bilinear sample of a noise grid; `u` is radial fraction [0,1], `v` is angular fraction [0,1). */
function sampleNoiseGrid(grid: number[][], rings: number, segments: number, u: number, v: number): number {
  const fi = Math.min(1, Math.max(0, u)) * rings;
  const i0 = Math.min(rings, Math.floor(fi));
  const i1 = Math.min(rings, i0 + 1);
  const ti = fi - i0;

  const fj = ((v % 1) + 1) % 1 * segments;
  const j0 = Math.floor(fj) % segments;
  const j1 = (j0 + 1) % segments;
  const tj = fj - Math.floor(fj);

  const a = THREE.MathUtils.lerp(grid[i0][j0], grid[i0][j1], tj);
  const b = THREE.MathUtils.lerp(grid[i1][j0], grid[i1][j1], tj);
  return THREE.MathUtils.lerp(a, b, ti);
}

/** Rolling-hill height field: flat near the camera and flat again at the horizon rim, cresting in between. */
function makeHeightField() {
  const coarse = buildNoiseGrid(5581, 8, 12);
  const fine = buildNoiseGrid(9137, 16, 32);

  return function heightAt(radius: number, angle: number): number {
    const u = radius / GROUND_RADIUS;
    const v = angle / (Math.PI * 2);
    const n1 = sampleNoiseGrid(coarse, 8, 12, u, v);
    const n2 = sampleNoiseGrid(fine, 16, 32, u, v);
    const rise = THREE.MathUtils.smoothstep(radius, FLAT_INNER_RADIUS, RISE_INNER_RADIUS);
    const fall = 1 - THREE.MathUtils.smoothstep(radius, FALL_OUTER_RADIUS, FLAT_OUTER_RADIUS);
    const envelope = rise * fall;
    return (n1 * 0.75 + n2 * 0.25) * envelope * MAX_TERRAIN_HEIGHT;
  };
}

/** Undulating terrain disc: a polar grid displaced by a rolling-hill height field. */
function buildTerrainGeometry(heightAt: (radius: number, angle: number) => number): THREE.BufferGeometry {
  const cols = TERRAIN_SEGMENTS + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= TERRAIN_RINGS; i++) {
    const radius = (i / TERRAIN_RINGS) * GROUND_RADIUS;
    for (let j = 0; j <= TERRAIN_SEGMENTS; j++) {
      const angle = (j / TERRAIN_SEGMENTS) * Math.PI * 2;
      const height = i === 0 ? 0 : heightAt(radius, angle);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push(x, TERRAIN_BASE_Y + height, z);
      uvs.push(x / GROUND_RADIUS / 2 + 0.5, z / GROUND_RADIUS / 2 + 0.5);
    }
  }

  for (let i = 0; i < TERRAIN_RINGS; i++) {
    for (let j = 0; j < TERRAIN_SEGMENTS; j++) {
      const a = i * cols + j;
      const b = i * cols + j + 1;
      const c = (i + 1) * cols + j;
      const d = (i + 1) * cols + j + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // The i=0 ring collapses every vertex onto the same point (0, baseY, 0), so its
  // triangles have zero area: computeVertexNormals sums to a zero-length vector there,
  // which normalize() in the shader turns into NaN — blacking out the whole cap of
  // ground straight underfoot. Straight up is the correct normal there anyway (flat).
  const normalAttr = geometry.getAttribute('normal');
  for (let j = 0; j < cols; j++) normalAttr.setXYZ(j, 0, 1, 0);
  normalAttr.needsUpdate = true;

  return geometry;
}

interface RockPlacement {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

/** Scatters low-poly rocks across the rolling terrain so the mid-ground reads as real land. */
function buildRockPlacements(heightAt: (radius: number, angle: number) => number): RockPlacement[] {
  const rand = mulberry32(28471);
  const rocks: RockPlacement[] = [];
  for (let i = 0; i < ROCK_COUNT; i++) {
    const radius = RISE_INNER_RADIUS + rand() * (FALL_OUTER_RADIUS - RISE_INNER_RADIUS);
    const angle = rand() * Math.PI * 2;
    const height = heightAt(radius, angle);
    const scale = 0.35 + rand() * 1.1;
    rocks.push({
      position: [Math.cos(angle) * radius, TERRAIN_BASE_Y + height + scale * 0.25, Math.sin(angle) * radius],
      rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI],
      scale,
    });
  }
  return rocks;
}

/** Closed ring wall with an undulating top edge, seen edge-on as a distant hilly skyline. */
function buildHillsGeometry(): THREE.BufferGeometry {
  const rand = mulberry32(4242);
  const harmonics = Array.from({ length: 5 }, () => ({
    freq: 1 + rand() * 7,
    amp: 0.4 + rand() * 1.1,
    phase: rand() * Math.PI * 2,
  }));
  const heightAt = (angle: number) => {
    let h = 2.2;
    for (const { freq, amp, phase } of harmonics) h += Math.sin(angle * freq + phase) * amp;
    return Math.max(0.5, h);
  };

  const baseY = -0.05;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= HILL_SEGMENTS; i++) {
    const angle = (i / HILL_SEGMENTS) * Math.PI * 2;
    const x = Math.cos(angle) * HILL_RADIUS;
    const z = Math.sin(angle) * HILL_RADIUS;
    const h = heightAt(angle);
    positions.push(x, baseY, z, x, baseY + h, z);
  }

  for (let i = 0; i < HILL_SEGMENTS; i++) {
    const b0 = i * 2;
    const t0 = i * 2 + 1;
    const b1 = (i + 1) * 2;
    const t1 = (i + 1) * 2 + 1;
    indices.push(b0, t0, b1, t0, t1, b1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Low-poly rock with per-face brightness baked into vertex colors, so each facet reads distinctly
 * instead of the whole rock rendering as one flat, void-black silhouette. */
function buildRockGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(1, 0).toNonIndexed();
  geometry.computeVertexNormals();
  const normal = geometry.getAttribute('normal');
  const colors = new Float32Array(normal.count * 3);
  for (let i = 0; i < normal.count; i++) {
    const shade = 0.55 + 0.45 * THREE.MathUtils.clamp(normal.getY(i) * 0.5 + 0.5, 0, 1);
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

/** Silhouette (dark, at night/twilight) blending toward a lighter atmospheric haze by day. */
function computeHillColor(sunAltitude: number, bortleGlowHex: string, target: THREE.Color): THREE.Color {
  const day = getDayWeight(sunAltitude);
  const silhouette = rawHexColor(bortleGlowHex, new THREE.Color()).lerp(NADIR_COLOR, 0.75);
  const haze = rawHexColor(bortleGlowHex, new THREE.Color()).lerp(new THREE.Color(1, 1, 1), 0.35);
  return target.copy(silhouette).lerp(haze, day);
}

export function HorizonGround({
  lightPollution,
  sunDirection,
  sunAltitude,
}: {
  lightPollution: LightPollutionInfo;
  sunDirection: [number, number, number];
  sunAltitude: number;
}) {
  const grainTexture = useMemo(() => buildGrainTexture(), []);
  const patchTexture = useMemo(() => buildPatchTexture(), []);
  const heightAt = useMemo(() => makeHeightField(), []);
  const terrainGeometry = useMemo(() => buildTerrainGeometry(heightAt), [heightAt]);
  const hillsGeometry = useMemo(() => buildHillsGeometry(), []);
  const rocks = useMemo(() => buildRockPlacements(heightAt), [heightAt]);
  const rockGeometry = useMemo(() => buildRockGeometry(), []);

  const [groundUniforms] = useState(() => ({
    uNadirColor: { value: NADIR_COLOR.clone() },
    uHorizonColor: { value: rawHexColor(getBortleGlowColor(lightPollution.bortle)) },
    uGrainTexture: { value: grainTexture },
    uPatchTexture: { value: patchTexture },
    uGrainRepeat: { value: GRAIN_REPEAT },
    uPatchRepeat: { value: PATCH_REPEAT },
    uSunDirection: { value: new THREE.Vector3(...sunDirection) },
    uSunAltitude: { value: sunAltitude },
  }));
  // A fresh Color instance each time inputs change (rather than mutating a stable
  // one via an effect): react-three-fiber memoizes plain material props like
  // `color` by reference, so mutating the same object in place would never be
  // picked back up.
  const hillColor = useMemo(
    () => computeHillColor(sunAltitude, getBortleGlowColor(lightPollution.bortle), new THREE.Color()),
    [sunAltitude, lightPollution.bortle],
  );

  // react-three-fiber copies the `uniforms` prop into the material's own uniforms
  // object on mount rather than keeping our object as the live reference, and never
  // re-syncs afterward since that prop's own identity never changes. So updates
  // have to go through the mounted material via a ref, not through `groundUniforms`
  // (which only seeds the initial values).
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    const material = materialRef.current;
    if (material) rawHexColor(getBortleGlowColor(lightPollution.bortle), material.uniforms.uHorizonColor.value);
  }, [lightPollution.bortle]);

  useFrame(() => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uSunDirection.value.set(sunDirection[0], sunDirection[1], sunDirection[2]);
    material.uniforms.uSunAltitude.value = sunAltitude;
  });

  return (
    <>
      <mesh geometry={terrainGeometry} raycast={() => null}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={groundVertexShader}
          fragmentShader={groundFragmentShader}
          uniforms={groundUniforms}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={hillsGeometry} raycast={() => null}>
        <meshBasicMaterial color={hillColor} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {rocks.map((rock, i) => (
        <mesh key={i} geometry={rockGeometry} position={rock.position} rotation={rock.rotation} scale={rock.scale} raycast={() => null}>
          <meshStandardMaterial color={ROCK_ALBEDO} vertexColors roughness={1} metalness={0} />
        </mesh>
      ))}
    </>
  );
}
