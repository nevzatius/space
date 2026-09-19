// Aurora visibility is driven by real-time space weather, not orbital
// mechanics, so unlike the rest of the app's astronomy this needs a live
// external feed (NOAA SWPC's public Kp-index forecast, no auth required).
// Mirrors the fetch-with-fallback shape of satellites.ts's doLoad(), except
// on failure there's no local fallback data — the aurora item is just omitted.
const KP_FORECAST_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2h — short-range forecast, no need to persist across sessions

import type { CelestialEvent } from '../types/astronomy';

interface CachedForecast {
  fetchedAt: number;
  rows: string[][];
}

let cache: CachedForecast | null = null;

/** Coarse visibility threshold by geographic latitude, used as a stand-in for geomagnetic latitude. */
function kpThresholdForLatitude(absLat: number): number {
  if (absLat >= 60) return 3;
  if (absLat >= 50) return 5;
  if (absLat >= 45) return 6;
  if (absLat >= 40) return 7;
  if (absLat >= 35) return 8;
  return 9;
}

async function fetchForecastRows(): Promise<string[][]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rows;
  }
  const res = await fetch(KP_FORECAST_URL);
  if (!res.ok) throw new Error(`NOAA SWPC HTTP ${res.status}`);
  const rows = (await res.json()) as string[][];
  cache = { fetchedAt: Date.now(), rows };
  return rows;
}

export async function getAuroraForecast(observer: { lat: number }): Promise<CelestialEvent | null> {
  try {
    const rows = await fetchForecastRows();
    // First row is the header: ["time_tag", "kp", "observed", "noaa_scale"].
    const threshold = kpThresholdForLatitude(Math.abs(observer.lat));
    const now = Date.now();

    for (const row of rows.slice(1)) {
      const [timeTag, kpStr] = row;
      const timestamp = Date.parse(`${timeTag.replace(' ', 'T')}Z`);
      if (Number.isNaN(timestamp) || timestamp < now) continue;
      const kp = Number(kpStr);
      if (Number.isNaN(kp) || kp < threshold) continue;

      return {
        id: `aurora-${timestamp}`,
        type: 'aurora',
        date: new Date(timestamp),
        icon: '🌌',
        title: 'Olası Aurora (Kutup Işığı)',
        detail: `NOAA tahminine göre Kp≈${kp} bekleniyor; bulunduğunuz enlemde görülme ihtimali var. 3 günlük kısa vadeli tahmin, kesin değildir.`,
      };
    }
    return null;
  } catch {
    return null;
  }
}
