import lightPollutionGrid from '../data/lightPollution.json';
import type { LightPollutionInfo } from '../types/astronomy';

/**
 * lightPollution.json is produced by scripts/build-light-pollution.mjs: a
 * coarse equirectangular grid where each cell holds an estimated Bortle
 * class (1-9). The estimate is a population/distance heuristic (see the
 * build script), NOT measured satellite sky-brightness data — treat it as a
 * rough approximation, not a survey-grade reading.
 */
interface LightPollutionGrid {
  cols: number;
  rows: number;
  cellSizeDeg: number;
  bortle: number[];
}

const grid = lightPollutionGrid as LightPollutionGrid;

// Standard naked-eye limiting-magnitude reference per Bortle class (Bortle 2001).
const BORTLE_TO_LIMITING_MAG: Record<number, number> = {
  1: 7.8,
  2: 7.3,
  3: 6.8,
  4: 6.3,
  5: 5.8,
  6: 5.2,
  7: 4.8,
  8: 4.2,
  9: 4.0,
};

function cellIndex(lat: number, lon: number): number {
  const col = Math.min(grid.cols - 1, Math.max(0, Math.floor((lon + 180) / grid.cellSizeDeg)));
  const row = Math.min(grid.rows - 1, Math.max(0, Math.floor((90 - lat) / grid.cellSizeDeg)));
  return row * grid.cols + col;
}

/** Looks up the estimated Bortle class and naked-eye limiting magnitude for a lat/lon. */
export function getBortleClass(lat: number, lon: number): LightPollutionInfo {
  const bortle = grid.bortle[cellIndex(lat, lon)] ?? 5;
  return { bortle, limitingMagnitude: BORTLE_TO_LIMITING_MAG[bortle] ?? 5.8 };
}

/**
 * Maps a Bortle class to a horizon sky-glow color for the 3D sky dome: a faint
 * cool tint under a pristine (Bortle 1) sky, warming into an amber sodium-vapor
 * glow under heavy city light pollution (Bortle 9).
 */
export function getBortleGlowColor(bortle: number): string {
  const t = Math.min(1, Math.max(0, (bortle - 1) / 8));
  const dark = { r: 8, g: 14, b: 28 };
  const city = { r: 92, g: 62, b: 22 };
  const r = Math.round(dark.r + (city.r - dark.r) * t);
  const g = Math.round(dark.g + (city.g - dark.g) * t);
  const b = Math.round(dark.b + (city.b - dark.b) * t);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
