import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { altAzToCartesian } from '../../lib/coords';
import { getGlowSpriteTexture } from '../../lib/textures';
import { BODY_NAME_TR } from '../../lib/bodyNamesTr';
import { getExtinctionFactor, getExtinctionTint, getStarVisibility } from '../../lib/skyPhysics';
import type { BodyName } from '../../types/astronomy';

const DOME_RADIUS = 100;

const BODY_COLOR: Record<BodyName, string> = {
  Sun: '#fff3c4',
  Moon: '#c9c9c9',
  Mercury: '#b7b3ad',
  Venus: '#f7e7c3',
  Mars: '#e08a5c',
  Jupiter: '#e6c79c',
  Saturn: '#d9c48f',
};

export function CelestialBody({
  body,
  azimuth,
  altitude,
  magnitude,
  sunAltitude,
  onHover,
  onHoverEnd,
}: {
  body: BodyName;
  azimuth: number;
  altitude: number;
  magnitude: number;
  sunAltitude: number;
  onHover?: (label: string, offsetX: number, offsetY: number) => void;
  onHoverEnd?: () => void;
}) {
  const texture = useMemo(() => getGlowSpriteTexture(), []);
  const position = useMemo<[number, number, number]>(
    () => altAzToCartesian(altitude, azimuth, DOME_RADIUS),
    [altitude, azimuth],
  );

  if (altitude < -2) return null;

  const isSun = body === 'Sun';
  const scale = isSun ? 14 : THREE.MathUtils.clamp(7 - magnitude, 2, 6);

  // The Sun stays fully visible (it lights the sky itself); other bodies dim near
  // the horizon (atmospheric extinction) and wash out against a bright daytime sky.
  const opacity = isSun ? 1 : getExtinctionFactor(altitude) * getStarVisibility(sunAltitude);
  const tint = new THREE.Color(BODY_COLOR[body]).multiply(getExtinctionTint(altitude));

  return (
    <sprite
      position={position}
      scale={[scale, scale, scale]}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover?.(BODY_NAME_TR[body], e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHoverEnd?.();
      }}
    >
      <spriteMaterial map={texture} color={tint} opacity={opacity} transparent depthWrite={false} />
    </sprite>
  );
}
