import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { altAzToCartesian } from '../../lib/coords';
import { getExtinctionFactor, getExtinctionTint } from '../../lib/skyPhysics';
import { getBodyName } from '../../lib/bodyNamesTr';
import { useTranslation } from '../../i18n/useTranslation';

export const MOON_DISTANCE = 40; // closer than the star dome so it reads as a visible disc
const MOON_RADIUS = 1.6;
const LIGHT_DISTANCE = 20;

// Real lunar albedo map (NASA Clementine-derived mosaic, public domain), sourced
// from three.js's own example assets — see public/textures/NOTICE.md.
const MOON_TEXTURE_URL = '/textures/moon-albedo.jpg';
// Higher-resolution map (Solar System Scope, CC BY 4.0) swapped in for the
// close-orbit "Aya Yaklaş" mode, where the low-res map would look blurry.
const MOON_TEXTURE_HIRES_URL = '/textures/moon-albedo-hires.jpg';

export function MoonMesh({
  azimuth,
  altitude,
  sunDirection,
  highDetail = false,
  onHover,
  onHoverEnd,
  onClick,
}: {
  azimuth: number;
  altitude: number;
  sunDirection: [number, number, number];
  highDetail?: boolean;
  onHover?: (label: string, offsetX: number, offsetY: number) => void;
  onHoverEnd?: () => void;
  onClick?: () => void;
}) {
  const { language } = useTranslation();
  const position = useMemo<[number, number, number]>(
    () => altAzToCartesian(altitude, azimuth, MOON_DISTANCE),
    [altitude, azimuth],
  );

  // Stable Object3D so the DirectionalLight's target has a real scene-graph
  // node whose matrixWorld updates every frame (a plain position prop on the
  // light itself is not enough — three.js directional lights aim at `target`).
  const lightTarget = useMemo(() => new THREE.Object3D(), []);

  const lightPosition = useMemo<[number, number, number]>(
    () => [
      position[0] + sunDirection[0] * LIGHT_DISTANCE,
      position[1] + sunDirection[1] * LIGHT_DISTANCE,
      position[2] + sunDirection[2] * LIGHT_DISTANCE,
    ],
    [position, sunDirection],
  );

  // Loaded eagerly (both, unconditionally) so switching into close-orbit mode
  // never shows a load-triggered pop/suspense flash.
  const [albedoMap, hiresMap] = useLoader(THREE.TextureLoader, [MOON_TEXTURE_URL, MOON_TEXTURE_HIRES_URL]);
  const tint = useMemo(() => getExtinctionTint(altitude), [altitude]);

  if (altitude < -5) return null;

  // Atmospheric extinction: the Moon dims and reddens near the horizon, and so
  // does the light it's throwing (a rising/setting Moon lights the scene less).
  const extinction = getExtinctionFactor(altitude);
  const segments = highDetail ? 96 : 32;

  return (
    <group>
      <primitive object={lightTarget} position={position} />
      <directionalLight position={lightPosition} target={lightTarget} intensity={0.8 * extinction} color={tint} />
      <mesh
        position={position}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover?.(getBodyName('Moon', language), e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHoverEnd?.();
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <sphereGeometry args={[MOON_RADIUS, segments, segments]} />
        <meshStandardMaterial map={highDetail ? hiresMap : albedoMap} color={tint} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
