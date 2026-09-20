import { DateTime } from 'luxon';
import { getBodyHorizontal, makeObserver, TRACKED_BODIES } from './astro';
import type { BodyName, GeoLocation } from '../types/astronomy';

export interface ObservationWindow { start: number; end: number }
export interface ObservationTarget {
  body: BodyName;
  windows: ObservationWindow[];
  bestTime: number;
  altitude: number;
  azimuth: number;
  score: number;
}

// A night belongs to the local noon preceding it, including its morning hours.
export function observingNightStart(date: Date, zone: string): number {
  const local = DateTime.fromJSDate(date).setZone(zone);
  return (local.hour < 12 ? local.minus({ days: 1 }) : local).startOf('day').set({ hour: 12 }).toMillis();
}

function appendWindow(windows: ObservationWindow[], start: number, end: number) {
  const previous = windows.at(-1);
  if (previous?.end === start) previous.end = end;
  else windows.push({ start, end });
}

export function buildObservationPlan(start: number, zone: string, location: Pick<GeoLocation, 'lat' | 'lon'>, limitingMagnitude: number) {
  const end = DateTime.fromMillis(start, { zone }).plus({ days: 1 }).toMillis();
  const observer = makeObserver(location);
  const darkness: ObservationWindow[] = [];
  const moonUp: ObservationWindow[] = [];
  const targets: ObservationTarget[] = TRACKED_BODIES.filter((body) => body !== 'Sun').map((body) => ({
    body, windows: [], bestTime: start, altitude: 0, azimuth: 0, score: 0,
  }));
  const step = 15 * 60_000;
  for (let t = start; t < end; t += step) {
    const until = Math.min(t + step, end);
    const midpoint = (t + until) / 2;
    const date = new Date(midpoint);
    const sun = getBodyHorizontal('Sun', date, observer);
    const moon = getBodyHorizontal('Moon', date, observer);
    if (sun.altitude < -18) appendWindow(darkness, t, until);
    if (moon.altitude > 0) appendWindow(moonUp, t, until);
    for (const target of targets) {
      const position = target.body === 'Moon' ? moon : getBodyHorizontal(target.body, date, observer);
      if (sun.altitude >= -6 || position.altitude < 10 || position.magnitude > limitingMagnitude) continue;
      appendWindow(target.windows, t, until);
      // Heuristic suitability, not a probability: elevation, twilight and brightness.
      const score = Math.round(60 * Math.sin(position.altitude * Math.PI / 180)
        + 25 * Math.min(1, Math.max(0, (-sun.altitude - 6) / 12))
        + 15 * Math.min(1, Math.max(0, (limitingMagnitude - position.magnitude) / 6)));
      if (score > target.score) Object.assign(target, {
        bestTime: midpoint, altitude: position.altitude, azimuth: position.azimuth, score,
      });
    }
  }
  return { start, end, darkness, moonUp, targets: targets.filter((target) => target.windows.length).sort((a, b) => b.score - a.score) };
}
