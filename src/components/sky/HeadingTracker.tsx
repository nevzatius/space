import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const UPDATE_THRESHOLD_DEG = 0.15;

/**
 * Reads the camera's current look direction every frame and reports it as a
 * compass heading (degrees, 0=north/clockwise, matching altAzToCartesian).
 * Renders nothing; lives inside the Canvas purely to access the R3F camera.
 */
export function HeadingTracker({ onChange }: { onChange: (headingDeg: number) => void }) {
  const { camera } = useThree();
  const lastHeading = useRef(0);
  const direction = useRef(new THREE.Vector3());

  useFrame(() => {
    camera.getWorldDirection(direction.current);
    const headingRad = Math.atan2(direction.current.x, -direction.current.z);
    const headingDeg = ((headingRad * 180) / Math.PI + 360) % 360;
    const rawDiff = Math.abs(headingDeg - lastHeading.current);
    const circularDiff = rawDiff > 180 ? 360 - rawDiff : rawDiff;
    if (circularDiff > UPDATE_THRESHOLD_DEG) {
      lastHeading.current = headingDeg;
      onChange(headingDeg);
    }
  });

  return null;
}
