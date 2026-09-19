import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { altAzToCartesian } from '../../lib/coords';
import { getBortleGlowColor } from '../../lib/lightPollution';
import { getGlowSpriteTexture, getStarSpriteTexture } from '../../lib/textures';
import { mulberry32 } from '../../lib/random';
import { DAY_START_ALT, NIGHT_END_ALT, TWILIGHT_DAY_EDGE_ALT, TWILIGHT_NIGHT_EDGE_ALT, getStarVisibility } from '../../lib/skyPhysics';
import type { HorizontalCoords, LightPollutionInfo } from '../../types/astronomy';

const SKY_RADIUS = 160;
const BG_STAR_RADIUS = 150;
const BG_STAR_COUNT = 3000;
const MILKY_WAY_RADIUS = 130;

const ZENITH_COLOR = new THREE.Color('#02030a');

// Day/twilight endpoint colors, shared between the "horizon" and "zenith" ends of
// the gradient. Kept here (not just in the shader) so HorizonGround can compute the
// exact same horizon-side color and the two meshes meet without a visible seam.
const DAY_HORIZON = new THREE.Color(0.62, 0.74, 0.88);
const DAY_ZENITH = new THREE.Color(0.16, 0.42, 0.82);
const TWILIGHT_HORIZON = new THREE.Color(0.92, 0.52, 0.28);
const TWILIGHT_ZENITH = new THREE.Color(0.1, 0.09, 0.24);

const skyVertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Blends three sky regimes by sun altitude: the original static night gradient
// (Bortle horizon glow -> deep zenith), a blue-sky day gradient, and a warm
// sunrise/sunset gradient in between - plus a soft Mie-ish glow disc around the sun.
// This intentionally stays a cheap analytic approximation (no multi-scatter
// integral) rather than a full physically-based atmosphere model.
const skyFragmentShader = `
  uniform vec3 uZenithColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uSunDirection;
  uniform float uSunAltitude;
  varying vec3 vWorldPosition;

  void main() {
    vec3 dir = normalize(vWorldPosition);
    float h = clamp(dir.y, -1.0, 1.0);
    float t = smoothstep(-0.08, 0.6, h);

    vec3 nightColor = mix(uHorizonColor, uZenithColor, t);

    vec3 dayHorizon = vec3(${DAY_HORIZON.r.toFixed(3)}, ${DAY_HORIZON.g.toFixed(3)}, ${DAY_HORIZON.b.toFixed(3)});
    vec3 dayZenith = vec3(${DAY_ZENITH.r.toFixed(3)}, ${DAY_ZENITH.g.toFixed(3)}, ${DAY_ZENITH.b.toFixed(3)});
    vec3 dayColor = mix(dayHorizon, dayZenith, t);

    vec3 twilightHorizon = vec3(${TWILIGHT_HORIZON.r.toFixed(3)}, ${TWILIGHT_HORIZON.g.toFixed(3)}, ${TWILIGHT_HORIZON.b.toFixed(3)});
    vec3 twilightZenith = vec3(${TWILIGHT_ZENITH.r.toFixed(3)}, ${TWILIGHT_ZENITH.g.toFixed(3)}, ${TWILIGHT_ZENITH.b.toFixed(3)});
    vec3 twilightColor = mix(twilightHorizon, twilightZenith, t);

    float nightWeight = 1.0 - smoothstep(${NIGHT_END_ALT.toFixed(1)}, ${TWILIGHT_NIGHT_EDGE_ALT.toFixed(1)}, uSunAltitude);
    float dayWeight = smoothstep(${TWILIGHT_DAY_EDGE_ALT.toFixed(1)}, ${DAY_START_ALT.toFixed(1)}, uSunAltitude);
    float twilightWeight = max(0.0, 1.0 - nightWeight - dayWeight);

    vec3 color = nightColor * nightWeight + dayColor * dayWeight + twilightColor * twilightWeight;

    // Warm glow hugging the horizon on the sun's side of the sky during twilight.
    vec3 sunDir = normalize(uSunDirection);
    vec2 dirH = length(dir.xz) > 0.0001 ? normalize(dir.xz) : vec2(0.0);
    vec2 sunH = length(sunDir.xz) > 0.0001 ? normalize(sunDir.xz) : vec2(0.0);
    float azCloseness = max(dot(dirH, sunH), 0.0);
    float lowness = 1.0 - smoothstep(-0.05, 0.4, h);
    color = mix(color, twilightHorizon, twilightWeight * azCloseness * lowness * 0.5);

    // Sun disc glow / halo (Mie-ish forward scattering), warmer at twilight.
    float sunDot = max(dot(dir, sunDir), 0.0);
    vec3 glowColor = mix(vec3(1.0, 0.85, 0.6), vec3(1.0, 0.55, 0.25), twilightWeight);
    float glow = pow(sunDot, 128.0) * (dayWeight + twilightWeight) * 0.6
      + pow(sunDot, 6.0) * (dayWeight + twilightWeight) * 0.08;
    color += glowColor * glow;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function randomPointsOnSphere(count: number, radius: number, seed: number): Float32Array {
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rand();
    const v = rand();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const sinPhi = Math.sin(phi);
    positions[i * 3] = radius * sinPhi * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * sinPhi * Math.sin(theta);
  }
  return positions;
}

interface MilkyWayPuff {
  position: [number, number, number];
  scale: number;
  opacity: number;
}

/** Turns the galactic-equator sample points into overlapping soft glow sprites forming a band. */
function buildMilkyWayPuffs(points: HorizontalCoords[]): MilkyWayPuff[] {
  return points.map((p, i) => {
    // Brighter toward the galactic center/anticenter axis (l=0/180 in the sample
    // ordering), fainter toward the sides - a coarse stand-in for the real
    // brightness variation along the band.
    const l = (i / points.length) * Math.PI * 2;
    const density = 0.4 + 0.6 * Math.pow((1 + Math.cos(l)) / 2, 1.5);
    return {
      position: altAzToCartesian(p.altitude, p.azimuth, MILKY_WAY_RADIUS),
      scale: 34 + density * 30,
      opacity: 0.035 + density * 0.05,
    };
  });
}

/** Gradient sky background (sun-altitude-driven day/twilight/night) + deep-sky stars + real-position Milky Way band. */
export function SkyDome({
  lightPollution,
  sunDirection,
  sunAltitude,
  milkyWay,
}: {
  lightPollution: LightPollutionInfo;
  sunDirection: [number, number, number];
  sunAltitude: number;
  milkyWay: HorizontalCoords[];
}) {
  const starTexture = useMemo(() => getStarSpriteTexture(), []);
  const glowTexture = useMemo(() => getGlowSpriteTexture(), []);
  const bgStarPositions = useMemo(() => randomPointsOnSphere(BG_STAR_COUNT, BG_STAR_RADIUS, 99001), []);
  const milkyWayPuffs = useMemo(() => buildMilkyWayPuffs(milkyWay), [milkyWay]);

  const [uniforms] = useState(() => ({
    uZenithColor: { value: ZENITH_COLOR.clone() },
    uHorizonColor: { value: new THREE.Color(getBortleGlowColor(lightPollution.bortle)) },
    uSunDirection: { value: new THREE.Vector3(...sunDirection) },
    uSunAltitude: { value: sunAltitude },
  }));

  // react-three-fiber copies the `uniforms` prop into the material's own uniforms
  // object on mount (see its "ShaderMaterial uniforms must keep a stable target
  // reference" handling) rather than keeping our object as the live reference, and
  // it never re-syncs afterward since that prop's own identity never changes. So
  // updates have to go through the mounted material via a ref, not through the
  // `uniforms` object above (which only seeds the initial values).
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    const material = materialRef.current;
    if (material) material.uniforms.uHorizonColor.value.set(getBortleGlowColor(lightPollution.bortle));
  }, [lightPollution.bortle]);

  useFrame(() => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uSunDirection.value.set(sunDirection[0], sunDirection[1], sunDirection[2]);
    material.uniforms.uSunAltitude.value = sunAltitude;
  });

  const dayFade = getStarVisibility(sunAltitude);

  return (
    <>
      <mesh raycast={() => null}>
        <sphereGeometry args={[SKY_RADIUS, 32, 24]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <points raycast={() => null} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bgStarPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={starTexture}
          color="#cfd8ff"
          size={0.6}
          sizeAttenuation
          transparent
          opacity={0.5 * dayFade}
          depthWrite={false}
        />
      </points>

      {milkyWayPuffs.map((p, i) => (
        <sprite key={i} raycast={() => null} position={p.position} scale={[p.scale, p.scale, p.scale]}>
          <spriteMaterial
            map={glowTexture}
            color="#c9d6ef"
            transparent
            opacity={p.opacity * dayFade}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </>
  );
}
