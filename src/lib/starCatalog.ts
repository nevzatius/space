import starsData from '../data/stars.json';
import constellationsData from '../data/constellations.json';
import type { StarCatalog, ConstellationDef } from '../types/astronomy';

export const stars: StarCatalog = starsData as StarCatalog;
export const constellations: ConstellationDef[] = constellationsData as ConstellationDef[];

/** Indexes of stars.* arrays grouped by 3-letter IAU constellation code. */
export const starIndexByConstellation: Map<string, number[]> = (() => {
  const map = new Map<string, number[]>();
  for (let i = 0; i < stars.con.length; i++) {
    const code = stars.con[i];
    if (!code) continue;
    const arr = map.get(code);
    if (arr) arr.push(i);
    else map.set(code, [i]);
  }
  return map;
})();

export const constellationByCode: Map<string, ConstellationDef> = new Map(
  constellations.map((c) => [c.code, c]),
);
