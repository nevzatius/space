import { useMemo } from 'react';
import { altAzToCartesian } from '../../lib/coords';
import type { HorizontalCoords } from '../../types/astronomy';

const DOME_RADIUS = 100;
const BELOW_HORIZON_MARGIN = 5;

/** Renders a body's upcoming (next 24h) track across the dome as a dashed arc. */
export function SkyPath({ points, color }: { points: HorizontalCoords[]; color: string }) {
  const positions = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      // Skip every third segment for a lightweight dashed look without a dash shader.
      if (i % 3 === 2) continue;
      const a = points[i];
      const b = points[i + 1];
      if (a.altitude < -BELOW_HORIZON_MARGIN && b.altitude < -BELOW_HORIZON_MARGIN) continue;
      arr.push(...altAzToCartesian(a.altitude, a.azimuth, DOME_RADIUS), ...altAzToCartesian(b.altitude, b.azimuth, DOME_RADIUS));
    }
    return arr.length > 0 ? new Float32Array(arr) : null;
  }, [points]);

  if (!positions) return null;

  return (
    <lineSegments raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.45} />
    </lineSegments>
  );
}
