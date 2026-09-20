import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3, MathUtils } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAppStore } from '../../state/appStore';
import { altAzToCartesian } from '../../lib/coords';

export function ObjectFocusController({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const transition = useRef<{ id: number; elapsed: number; from: Vector3; rotation: Quaternion } | null>(null);
  useFrame(({ camera }, delta) => {
    const request = useAppStore.getState().focusRequest;
    const controls = controlsRef.current;
    if (!request || !controls) return;
    if (transition.current?.id !== request.id) {
      const from = camera.getWorldDirection(new Vector3()).negate().normalize();
      const destination = new Vector3(...altAzToCartesian(request.altitude, request.azimuth)).negate();
      transition.current = { id: request.id, elapsed: 0, from, rotation: new Quaternion().setFromUnitVectors(from, destination) };
    }
    const state = transition.current;
    if (state.elapsed >= 1) return;
    state.elapsed = Math.min(1, state.elapsed + delta / .9);
    const rotation = new Quaternion().slerp(state.rotation, MathUtils.smoothstep(state.elapsed, 0, 1));
    camera.position.copy(state.from).applyQuaternion(rotation).multiplyScalar(.01);
    controls.target.set(0, 0, 0);
    controls.update();
  });
  return null;
}
