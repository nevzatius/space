/**
 * Builds an SVG path (in a 0..100 viewBox) for the lit region of a moon-phase
 * icon, from an illuminated fraction (0..1) and whether the Moon is waxing.
 * Classic two-arc construction: an elliptical terminator arc (rx shrinks to 0
 * at quarter phases) combined with a circular limb-half arc.
 */
export function buildMoonIconPath(illumination: number, waxing: boolean): string {
  const R = 50;
  const k = Math.min(Math.max(illumination, 0), 1);
  const rx = Math.abs(1 - 2 * k) * R;
  const gibbous = k > 0.5;
  const sweep1 = waxing ? (gibbous ? 1 : 0) : gibbous ? 0 : 1;
  const sweep2 = waxing ? 1 : 0;
  return `M 50,0 A ${rx},${R} 0 0,${sweep1} 50,100 A ${R},${R} 0 0,${sweep2} 50,0`;
}
