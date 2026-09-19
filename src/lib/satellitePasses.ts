// Forward-looking visible-pass prediction, layered on top of satellites.ts's
// per-instant propagateSatellite(). Restricted to a handful of well-known
// bright satellites (rather than the whole ~100-object "visual" catalog) to
// keep the coarse forward scan cheap enough to run on the main thread.
import type { SatRec } from 'satellite.js';
import * as Astronomy from 'astronomy-engine';
import { propagateSatellite } from './satellites';
import { getBodyHorizontal } from './astro';
import type { SatellitePassEvent } from '../types/astronomy';

const BRIGHT_SATELLITE_NAMES = ['ISS (ZARYA)', 'CSS (TIANHE)', 'HST'];

const COARSE_STEP_SECONDS = 60;
const FINE_STEP_SECONDS = 5;
const DEFAULT_LOOKAHEAD_DAYS = 5;
const YIELD_EVERY_N_STEPS = 2000;

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function isVisibleAt(
  satrec: SatRec,
  name: string,
  noradId: string,
  date: Date,
  observer: { lat: number; lon: number; heightKm: number },
  astroObserver: Astronomy.Observer,
): boolean {
  const sunAltitudeDeg = getBodyHorizontal('Sun', date, astroObserver).altitude;
  const pos = propagateSatellite(satrec, name, noradId, date, observer, sunAltitudeDeg);
  return pos?.currentlyVisible ?? false;
}

/** Refines a coarsely-detected visible window to its precise start/end and finds the peak elevation within it. */
function refineWindow(
  satrec: SatRec,
  name: string,
  noradId: string,
  coarseStart: Date,
  coarseEnd: Date,
  observer: { lat: number; lon: number; heightKm: number },
  astroObserver: Astronomy.Observer,
): SatellitePassEvent {
  let start = coarseStart;
  for (let t = coarseStart.getTime() - COARSE_STEP_SECONDS * 1000; t < coarseStart.getTime(); t += FINE_STEP_SECONDS * 1000) {
    const d = new Date(t);
    if (isVisibleAt(satrec, name, noradId, d, observer, astroObserver)) {
      start = d;
      break;
    }
  }

  let end = coarseEnd;
  for (let t = coarseEnd.getTime(); t <= coarseEnd.getTime() + COARSE_STEP_SECONDS * 1000; t += FINE_STEP_SECONDS * 1000) {
    const d = new Date(t);
    if (!isVisibleAt(satrec, name, noradId, d, observer, astroObserver)) {
      end = d;
      break;
    }
  }

  let maxElevationDeg = -90;
  let maxElevationAzimuthDeg = 0;
  for (let t = start.getTime(); t <= end.getTime(); t += FINE_STEP_SECONDS * 1000) {
    const d = new Date(t);
    const sunAltitudeDeg = getBodyHorizontal('Sun', d, astroObserver).altitude;
    const pos = propagateSatellite(satrec, name, noradId, d, observer, sunAltitudeDeg);
    if (pos && pos.altitude > maxElevationDeg) {
      maxElevationDeg = pos.altitude;
      maxElevationAzimuthDeg = pos.azimuth;
    }
  }

  return { noradId, name, startTime: start, endTime: end, maxElevationDeg, maxElevationAzimuthDeg };
}

/**
 * Finds the soonest upcoming visible pass for each known bright satellite
 * present in `satrecMap`, scanning forward from `fromDate` for `lookaheadDays`.
 * Runs as chunked async work (yielding periodically) since the coarse scan can
 * be tens of thousands of propagation steps.
 */
export async function findUpcomingPasses(
  satrecMap: Map<string, { name: string; satrec: SatRec }>,
  observer: { lat: number; lon: number; heightKm: number },
  astroObserver: Astronomy.Observer,
  fromDate: Date,
  lookaheadDays = DEFAULT_LOOKAHEAD_DAYS,
): Promise<SatellitePassEvent[]> {
  const targets: Array<{ noradId: string; name: string; satrec: SatRec }> = [];
  for (const [noradId, { name, satrec }] of satrecMap) {
    if (BRIGHT_SATELLITE_NAMES.some((known) => name.toUpperCase().includes(known.toUpperCase()))) {
      targets.push({ noradId, name, satrec });
    }
  }

  const results: SatellitePassEvent[] = [];
  const endTime = fromDate.getTime() + lookaheadDays * 24 * 60 * 60 * 1000;

  for (const { noradId, name, satrec } of targets) {
    let windowStart: Date | null = null;
    let stepCount = 0;

    for (let t = fromDate.getTime(); t <= endTime; t += COARSE_STEP_SECONDS * 1000) {
      const d = new Date(t);
      const visible = isVisibleAt(satrec, name, noradId, d, observer, astroObserver);

      if (visible && windowStart === null) {
        windowStart = d;
      } else if (!visible && windowStart !== null) {
        results.push(refineWindow(satrec, name, noradId, windowStart, d, observer, astroObserver));
        windowStart = null;
        break; // only the soonest pass per satellite is needed
      }

      stepCount++;
      if (stepCount % YIELD_EVERY_N_STEPS === 0) {
        await yieldToMainThread();
      }
    }
  }

  return results;
}
