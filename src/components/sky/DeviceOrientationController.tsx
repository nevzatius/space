import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const CAMERA_RADIUS = 0.01; // matches <PerspectiveCamera position={[0, 0, 0.01]}> in SkyViewer
const SMOOTHING_RATE = 10; // ~100ms time constant, frame-rate independent

/**
 * While active, points the camera at whatever direction useDeviceOrientation's
 * directionRef currently reports, smoothing out raw sensor jitter with an
 * exponential lerp in Cartesian space (sidesteps the 359°/0° heading
 * wraparound a smoothed-angle approach would have to handle explicitly).
 * Mutates the camera/controls directly, mirroring MoonApproachController's
 * pattern — mounted before <OrbitControls> in SkyViewer's JSX for the same
 * per-frame subscription order reasons.
 */
export function DeviceOrientationController({
  active,
  directionRef,
  controlsRef,
}: {
  active: boolean;
  directionRef: React.RefObject<THREE.Vector3>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const smoothed = useRef(new THREE.Vector3());
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const target = directionRef.current;
    if (!active || !controls || !target) {
      wasActive.current = false;
      return;
    }
    if (!wasActive.current) {
      // Snap to the camera's current direction on (re)activation instead of
      // animating in from whatever heading was last seen.
      camera.getWorldDirection(smoothed.current);
      wasActive.current = true;
    }

    const t = 1 - Math.exp(-delta * SMOOTHING_RATE);
    smoothed.current.lerp(target, t).normalize();
    camera.position.copy(smoothed.current).multiplyScalar(-CAMERA_RADIUS);
    controls.target.set(0, 0, 0);
    controls.update();
  });

  return null;
}
