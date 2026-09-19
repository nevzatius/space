// Shared Alt/Az -> Cartesian conversion for the 3D sky dome. Every renderer
// (stars, constellation lines, celestial bodies, horizon, compass labels)
// must use this exact convention so everything lines up in the same scene.
//
//   x = cos(alt) * sin(az)
//   y = sin(alt)
//   z = -cos(alt) * cos(az)
//
// Azimuth is measured in degrees clockwise from north (north=0, east=90,
// south=180, west=270), matching astronomy-engine's convention. Altitude is
// degrees above the horizon.

export function altAzToCartesian(altitudeDeg: number, azimuthDeg: number, radius = 1): [number, number, number] {
  const alt = (altitudeDeg * Math.PI) / 180;
  const az = (azimuthDeg * Math.PI) / 180;
  const x = radius * Math.cos(alt) * Math.sin(az);
  const y = radius * Math.sin(alt);
  const z = -radius * Math.cos(alt) * Math.cos(az);
  return [x, y, z];
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

const COMPASS_POINTS_TR = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];

/** Maps an azimuth (degrees, 0=north/clockwise) to an 8-point Turkish compass label. */
export function azimuthToCompassTr(azimuthDeg: number): string {
  const normalized = ((azimuthDeg % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return COMPASS_POINTS_TR[index];
}

/** Circular mean of a list of azimuths (degrees), avoiding the 359/1 wraparound bug. */
export function circularMeanDeg(anglesDeg: number[]): number {
  if (anglesDeg.length === 0) return 0;
  let sumSin = 0;
  let sumCos = 0;
  for (const a of anglesDeg) {
    const rad = degToRad(a);
    sumSin += Math.sin(rad);
    sumCos += Math.cos(rad);
  }
  const meanRad = Math.atan2(sumSin / anglesDeg.length, sumCos / anglesDeg.length);
  const meanDeg = radToDeg(meanRad);
  return meanDeg < 0 ? meanDeg + 360 : meanDeg;
}
