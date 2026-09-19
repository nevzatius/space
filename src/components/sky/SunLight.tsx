import { useMemo } from 'react';
import * as THREE from 'three';
import { getSunLightColor, getSunLightIntensity } from '../../lib/skyPhysics';

const LIGHT_DISTANCE = 60;

/** Directional light standing in for the Sun: intensity/color follow its real altitude,
 * so the ground and any lit meshes actually brighten and warm/cool through the day. */
export function SunLight({ direction, altitude }: { direction: [number, number, number]; altitude: number }) {
  const target = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const position: [number, number, number] = [
    direction[0] * LIGHT_DISTANCE,
    direction[1] * LIGHT_DISTANCE,
    direction[2] * LIGHT_DISTANCE,
  ];
  const intensity = getSunLightIntensity(altitude);
  getSunLightColor(altitude, color);

  if (intensity <= 0.001) return null;

  return (
    <>
      <primitive object={target} position={[0, 0, 0]} />
      <directionalLight position={position} target={target} intensity={intensity} color={color} />
    </>
  );
}
