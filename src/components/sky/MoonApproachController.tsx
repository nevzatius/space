import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const APPROACH_DISTANCE_FROM_MOON = 6; // ~3.75 Moon radii (MOON_RADIUS=1.6 in MoonMesh)
const TRANSITION_MS = 1400;
const ORIGIN_POSITION = new THREE.Vector3(0, 0, 0.01);
const ORIGIN_TARGET = new THREE.Vector3(0, 0, 0);

type Phase = 'idle' | 'in' | 'docked' | 'out';

/**
 * Drives the "Aya Yaklaş" close-orbit camera dolly. Mutates the camera and
 * OrbitControls' target directly, so it must run its useFrame callback before
 * OrbitControls' own internal update — in this file's usage it's mounted
 * earlier in SkyViewer's JSX than <OrbitControls>, which is what R3F's
 * default per-frame subscription order relies on (not a documented
 * guarantee, verified by running the app: no visible one-frame jitter).
 *
 * Deliberately does NOT hide stars/other bodies while docked: the sky-dome
 * scene already isn't distance-realistic (DOME_RADIUS=100 vs MOON_DISTANCE=40
 * is nowhere near the real ~400:1 ratio), so the extra parallax from moving
 * off-origin is a continuation of that existing compromise, not a new one —
 * and keeping the star field visible sells "near the Moon in space" far
 * better than an empty void would.
 */
export function MoonApproachController({
  active,
  moonPosition,
  controlsRef,
  cancelToken = 0,
}: {
  active: boolean;
  moonPosition: [number, number, number] | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  cancelToken?: number;
}) {
  const { camera } = useThree();
  const phase = useRef<Phase>('idle');
  const elapsed = useRef(0);
  const fromPos = useRef(new THREE.Vector3());
  const fromTarget = useRef(new THREE.Vector3());
  const lastMoonPos = useRef(new THREE.Vector3());
  const lastCancelToken = useRef(cancelToken);

  useEffect(() => {
    if (lastCancelToken.current !== cancelToken) {
      lastCancelToken.current = cancelToken;
      phase.current = 'idle';
      return;
    }
    const controls = controlsRef.current;
    if (!controls) return;
    if (active && phase.current !== 'in' && phase.current !== 'docked') {
      fromPos.current.copy(camera.position);
      fromTarget.current.copy(controls.target);
      elapsed.current = 0;
      phase.current = 'in';
    } else if (!active && phase.current !== 'out' && phase.current !== 'idle') {
      fromPos.current.copy(camera.position);
      fromTarget.current.copy(controls.target);
      elapsed.current = 0;
      phase.current = 'out';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, cancelToken]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls || phase.current === 'idle' || !moonPosition) return;
    const moonVec = new THREE.Vector3(...moonPosition);

    if (phase.current === 'docked') {
      // Shift camera+target by the Moon's frame-to-frame drift rather than
      // re-deriving a fixed pose, so it doesn't fight whatever orbit angle
      // the user has already dragged the view to.
      const delta3 = moonVec.clone().sub(lastMoonPos.current);
      camera.position.add(delta3);
      controls.target.add(delta3);
      lastMoonPos.current.copy(moonVec);
      controls.update();
      return;
    }

    elapsed.current += delta * 1000;
    const t = THREE.MathUtils.clamp(elapsed.current / TRANSITION_MS, 0, 1);
    const eased = THREE.MathUtils.smoothstep(t, 0, 1);

    if (phase.current === 'in') {
      const dir = moonVec.clone().normalize();
      const destPos = dir.multiplyScalar(moonVec.length() - APPROACH_DISTANCE_FROM_MOON);
      camera.position.lerpVectors(fromPos.current, destPos, eased);
      controls.target.lerpVectors(fromTarget.current, moonVec, eased);
      controls.update();
      if (t >= 1) {
        phase.current = 'docked';
        lastMoonPos.current.copy(moonVec);
      }
    } else if (phase.current === 'out') {
      camera.position.lerpVectors(fromPos.current, ORIGIN_POSITION, eased);
      controls.target.lerpVectors(fromTarget.current, ORIGIN_TARGET, eased);
      controls.update();
      if (t >= 1) phase.current = 'idle';
    }
  });

  return null;
}
