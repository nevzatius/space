import * as THREE from 'three';

// Sun-altitude bands (degrees) used everywhere the scene blends night/twilight/day:
// sky color, ground/sun lighting, and star/planet visibility. Roughly follows civil
// (-6°) and nautical/astronomical (-8°..-18°) twilight, widened slightly for a
// smoother visual falloff. SkyDome and HorizonGround interpolate these same numbers
// directly into their GLSL source so the shader math and this module never drift apart.
export const NIGHT_END_ALT = -18;
export const TWILIGHT_NIGHT_EDGE_ALT = -8;
export const TWILIGHT_DAY_EDGE_ALT = -2;
export const DAY_START_ALT = 8;

/** 1 at full night, fading to 0 by the edge of astronomical/nautical twilight. */
export function getNightWeight(sunAltitudeDeg: number): number {
  return 1 - THREE.MathUtils.smoothstep(sunAltitudeDeg, NIGHT_END_ALT, TWILIGHT_NIGHT_EDGE_ALT);
}

/** 0 until just before sunrise/after sunset, ramping to 1 once the sun is well up. */
export function getDayWeight(sunAltitudeDeg: number): number {
  return THREE.MathUtils.smoothstep(sunAltitudeDeg, TWILIGHT_DAY_EDGE_ALT, DAY_START_ALT);
}

/** Whatever's left once night and day weights are accounted for; peaks around the horizon. */
export function getTwilightWeight(sunAltitudeDeg: number): number {
  return Math.max(0, 1 - getNightWeight(sunAltitudeDeg) - getDayWeight(sunAltitudeDeg));
}

/** Stars/planets wash out across civil twilight, well before the sky finishes turning blue. */
export function getStarVisibility(sunAltitudeDeg: number): number {
  return 1 - THREE.MathUtils.smoothstep(sunAltitudeDeg, -8, 2);
}

/** Ambient fill light: a dim night floor rising to a modest daytime base. */
export function getAmbientIntensity(sunAltitudeDeg: number): number {
  return 0.04 + 0.26 * getDayWeight(sunAltitudeDeg) + 0.1 * getTwilightWeight(sunAltitudeDeg);
}

/** Direct sunlight intensity: negligible at night, warm and soft at twilight, full by day. */
export function getSunLightIntensity(sunAltitudeDeg: number): number {
  return getDayWeight(sunAltitudeDeg) * 1.3 + getTwilightWeight(sunAltitudeDeg) * 0.5;
}

/** Sunlight color: reddens near the horizon, whitens once the sun is high. */
export function getSunLightColor(sunAltitudeDeg: number, target = new THREE.Color()): THREE.Color {
  target.setRGB(1, 0.55, 0.28);
  return target.lerp(new THREE.Color(1, 0.97, 0.92), getDayWeight(sunAltitudeDeg));
}

/**
 * Atmospheric extinction: how much of an object's brightness survives the longer
 * airmass path near the horizon, matching Stellarium's horizon-dimming cue.
 * `min` keeps very-low-altitude objects faintly visible rather than vanishing outright.
 */
export function getExtinctionFactor(altitudeDeg: number, min = 0.2): number {
  return min + (1 - min) * THREE.MathUtils.smoothstep(altitudeDeg, 0, 16);
}

/** Reddening that accompanies extinction near the horizon (the same cue that colors sunsets). */
export function getExtinctionTint(altitudeDeg: number, target = new THREE.Color()): THREE.Color {
  target.setRGB(1, 0.55, 0.3);
  return target.lerp(new THREE.Color(1, 1, 1), THREE.MathUtils.smoothstep(altitudeDeg, -2, 12));
}
