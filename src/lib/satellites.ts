// Live satellite tracking: fetches CelesTrak's "visual" TLE group (the ~100
// satellites CelesTrak curates specifically for naked-eye visibility, ISS
// included), caches it in localStorage, and propagates positions with
// satellite.js's SGP4 implementation. This is the one file that touches
// `satellite.js`, mirroring how astro.ts centralizes `astronomy-engine`.
import {
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  gstime,
  jday,
  propagate,
  shadowFraction,
  sunPos,
  twoline2satrec,
  type SatRec,
} from 'satellite.js';
import type { SatelliteCatalogSource, SatellitePosition, SatelliteTleEntry } from '../types/astronomy';
import fallbackEntries from '../data/satellites-fallback.json';

const CELESTRAK_TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle';
const CACHE_KEY = 'gece-gokyuzu:satellite-tle-cache-v1';
const REFRESH_INTERVAL_MS = 18 * 60 * 60 * 1000; // 18h, inside the 12-24h window

const MIN_ELEVATION_DEG = 10;
const MAX_SUN_ALT_FOR_DARK_SKY = -6;

interface CacheEntry {
  fetchedAt: number;
  entries: SatelliteTleEntry[];
}

/** Splits raw 3-line-per-satellite TLE text (name, line1, line2) into structured entries. */
export function parseTleText(text: string): SatelliteTleEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const out: SatelliteTleEntry[] = [];
  for (let i = 0; i + 2 < lines.length + 1 && i < lines.length; i += 3) {
    const name = lines[i]?.trim();
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (!name || !line1?.startsWith('1 ') || !line2?.startsWith('2 ')) continue;
    const noradId = line1.slice(2, 7).trim();
    out.push({ noradId, name, line1, line2 });
  }
  return out;
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable (private browsing) — just skip caching, not fatal.
  }
}

// Module-level singleton so multiple hook instances (SkyViewer + SatellitesPanel)
// never fire two concurrent CelesTrak requests.
let inflight: Promise<{ entries: SatelliteTleEntry[]; source: SatelliteCatalogSource; fetchedAt: number }> | null = null;

export function loadSatelliteCatalog() {
  if (!inflight) {
    inflight = doLoad().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function doLoad(): Promise<{ entries: SatelliteTleEntry[]; source: SatelliteCatalogSource; fetchedAt: number }> {
  const cached = readCache();
  const cacheIsFresh = cached && Date.now() - cached.fetchedAt < REFRESH_INTERVAL_MS;
  if (cacheIsFresh && cached) {
    return { entries: cached.entries, source: 'cache', fetchedAt: cached.fetchedAt };
  }

  try {
    const res = await fetch(CELESTRAK_TLE_URL);
    if (!res.ok) throw new Error(`CelesTrak HTTP ${res.status}`);
    const text = await res.text();
    const entries = parseTleText(text);
    if (entries.length === 0) throw new Error('CelesTrak yanıtı boş/anlaşılamadı');
    const fetchedAt = Date.now();
    writeCache({ fetchedAt, entries });
    return { entries, source: 'network', fetchedAt };
  } catch {
    if (cached) {
      return { entries: cached.entries, source: 'stale-cache', fetchedAt: cached.fetchedAt };
    }
    return { entries: fallbackEntries as SatelliteTleEntry[], source: 'fallback', fetchedAt: Date.now() };
  }
}

export function buildSatrecMap(entries: SatelliteTleEntry[]): Map<string, { name: string; satrec: SatRec }> {
  const map = new Map<string, { name: string; satrec: SatRec }>();
  for (const entry of entries) {
    try {
      const satrec = twoline2satrec(entry.line1, entry.line2);
      map.set(entry.noradId, { name: entry.name, satrec });
    } catch {
      // Malformed element set — skip this satellite rather than fail the whole catalog.
    }
  }
  return map;
}

export function propagateSatellite(
  satrec: SatRec,
  name: string,
  noradId: string,
  date: Date,
  observer: { lat: number; lon: number; heightKm: number },
  sunAltitudeDeg: number,
): SatellitePosition | null {
  const pv = propagate(satrec, date);
  if (!pv || !pv.position) return null; // decayed / propagation error

  const gmst = gstime(date);
  const posEcf = eciToEcf(pv.position, gmst);
  const look = ecfToLookAngles(
    { longitude: degreesToRadians(observer.lon), latitude: degreesToRadians(observer.lat), height: observer.heightKm },
    posEcf,
  );
  const azimuth = radToDeg(look.azimuth);
  const altitude = radToDeg(look.elevation);

  // sunPos() and propagate() both work in SGP4's native ECI frame, so there's no
  // cross-frame mismatch to account for here.
  const sun = sunPos(jday(date));
  const sunlit = shadowFraction(sun.rsun, pv.position) < 1;

  const aboveHorizon = altitude > MIN_ELEVATION_DEG;
  const currentlyVisible = aboveHorizon && sunlit && sunAltitudeDeg < MAX_SUN_ALT_FOR_DARK_SKY;

  return {
    noradId,
    name,
    azimuth,
    altitude,
    rangeKm: look.rangeSat,
    sunlit,
    aboveHorizon,
    currentlyVisible,
  };
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
