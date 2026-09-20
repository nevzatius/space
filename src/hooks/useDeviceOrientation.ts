import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { altAzToCartesian, degToRad, radToDeg } from '../lib/coords';
import { useTranslation } from '../i18n/useTranslation';

const SENSOR_TIMEOUT_MS = 2000;

// Reorients the device's own axes (alpha/beta/gamma, Z pointing out of the
// screen) so that "forward" points out of the *back* of the phone — the
// direction a user aims when holding it up like a window onto the sky.
// Same construction as three.js's DeviceOrientationControls example.
const BACK_FACING_CORRECTION = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const WORLD_UP = new THREE.Vector3(0, 0, 1);
const FORWARD = new THREE.Vector3(0, 0, -1);

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

function getScreenAngleDeg(): number {
  if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.angle === 'number') {
    return screen.orientation.angle;
  }
  const legacy = (window as unknown as { orientation?: number }).orientation;
  return typeof legacy === 'number' ? legacy : 0;
}

/** Converts a raw device-orientation sample into a world-space look direction, using the app's alt/az convention. */
function sampleToDirection(alphaDeg: number, betaDeg: number, gammaDeg: number, screenAngleDeg: number, compassHeadingDeg?: number): THREE.Vector3 {
  const euler = new THREE.Euler(degToRad(betaDeg), degToRad(alphaDeg), -degToRad(gammaDeg), 'YXZ');
  const q = new THREE.Quaternion().setFromEuler(euler);
  q.multiply(BACK_FACING_CORRECTION);
  q.multiply(new THREE.Quaternion().setFromAxisAngle(WORLD_UP, -degToRad(screenAngleDeg)));

  const dir = FORWARD.clone().applyQuaternion(q);
  const altitudeDeg = radToDeg(Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)));
  const headingDeg =
    compassHeadingDeg !== undefined
      ? compassHeadingDeg
      : ((radToDeg(Math.atan2(dir.x, -dir.z)) % 360) + 360) % 360;

  return new THREE.Vector3(...altAzToCartesian(altitudeDeg, headingDeg, 1));
}

/**
 * Reads the device's compass heading + tilt (via DeviceOrientationEvent) and
 * exposes it as a live world-space look-direction vector, so a consumer can
 * point the sky-viewer camera at whatever the phone is physically aimed at.
 */
export function useDeviceOrientation() {
  const { t } = useTranslation();
  const supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  const [active, setActive] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const directionRef = useRef(new THREE.Vector3(0, 0, -1));
  const usingAbsoluteRef = useRef(false);
  const watchdogRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const disable = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (watchdogRef.current !== null) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
    usingAbsoluteRef.current = false;
    setActive(false);
    setRequesting(false);
  }, []);

  useEffect(() => disable, [disable]);

  const enable = useCallback(async () => {
    if (!supported) {
      setError(t.compassMode.unsupported);
      return;
    }
    setError(null);
    setRequesting(true);

    const ctor = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> };
    if (typeof ctor.requestPermission === 'function') {
      try {
        const result = await ctor.requestPermission();
        if (result !== 'granted') {
          setError(t.compassMode.permissionDenied);
          setRequesting(false);
          return;
        }
      } catch {
        setError(t.compassMode.permissionDenied);
        setRequesting(false);
        return;
      }
    }

    const armWatchdog = () => {
      if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
      watchdogRef.current = window.setTimeout(() => {
        setError(t.compassMode.sensorUnavailable);
        disable();
      }, SENSOR_TIMEOUT_MS);
    };

    const handleSample = (event: DeviceOrientationEventiOS, isAbsolute: boolean) => {
      if (isAbsolute) usingAbsoluteRef.current = true;
      else if (usingAbsoluteRef.current) return; // prefer the absolute stream once it's proven available

      if (event.alpha === null || event.beta === null || event.gamma === null) return;

      const screenAngleDeg = getScreenAngleDeg();
      const compassHeadingDeg = typeof event.webkitCompassHeading === 'number' ? event.webkitCompassHeading : undefined;
      directionRef.current.copy(sampleToDirection(event.alpha, event.beta, event.gamma, screenAngleDeg, compassHeadingDeg));

      if (watchdogRef.current !== null) {
        window.clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      setRequesting(false);
      setActive(true);
    };

    const onAbsolute = (event: Event) => handleSample(event as DeviceOrientationEventiOS, true);
    const onRelative = (event: Event) => handleSample(event as DeviceOrientationEventiOS, false);

    window.addEventListener('deviceorientationabsolute', onAbsolute as EventListener);
    window.addEventListener('deviceorientation', onRelative);
    cleanupRef.current = () => {
      window.removeEventListener('deviceorientationabsolute', onAbsolute as EventListener);
      window.removeEventListener('deviceorientation', onRelative);
    };
    armWatchdog();
  }, [supported, t, disable]);

  return { supported, active, requesting, error, directionRef, enable, disable };
}
