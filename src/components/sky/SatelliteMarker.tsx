import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { altAzToCartesian } from '../../lib/coords';
import { getStarSpriteTexture } from '../../lib/textures';
import type { SatellitePosition } from '../../types/astronomy';

const DOME_RADIUS = 100; // same convention as CelestialBody.tsx — pure angular projection

export function SatelliteMarker({
  satellite,
  onHover,
  onHoverEnd,
}: {
  satellite: SatellitePosition;
  onHover?: (label: string, offsetX: number, offsetY: number) => void;
  onHoverEnd?: () => void;
}) {
  const texture = useMemo(() => getStarSpriteTexture(), []);
  const position = useMemo<[number, number, number]>(
    () => altAzToCartesian(satellite.altitude, satellite.azimuth, DOME_RADIUS),
    [satellite.altitude, satellite.azimuth],
  );

  const scale = satellite.currentlyVisible ? 2.2 : 1.1;
  const opacity = satellite.currentlyVisible ? 1 : 0.35;
  const color = satellite.currentlyVisible ? '#fffbe0' : '#9aa4b8';

  return (
    <sprite
      position={position}
      scale={[scale, scale, scale]}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover?.(satellite.name, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHoverEnd?.();
      }}
    >
      <spriteMaterial map={texture} color={new THREE.Color(color)} opacity={opacity} transparent depthWrite={false} />
    </sprite>
  );
}
