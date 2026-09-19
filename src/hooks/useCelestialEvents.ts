import { useEffect, useState } from 'react';
import { useAppStore } from '../state/appStore';
import { makeObserver } from '../lib/astro';
import { formatLocalTime } from '../lib/timezone';
import { buildSatrecMap, loadSatelliteCatalog } from '../lib/satellites';
import { findUpcomingPasses } from '../lib/satellitePasses';
import { getUpcomingEclipses } from '../lib/eclipses';
import { getUpcomingConjunctions } from '../lib/conjunctions';
import { getUpcomingMeteorShowers } from '../lib/meteorShowers';
import { getAuroraForecast } from '../lib/aurora';
import type { CelestialEvent } from '../types/astronomy';

/**
 * Aggregates every "what's coming up in the real sky" source into one sorted
 * list. Deliberately uses the real wall-clock `now`, not the app's simulated
 * `dateTimeUtc` scrubber — this answers "when should I actually go outside",
 * independent of whatever time the rest of the app is currently previewing.
 * Only runs while `enabled` (i.e. the popup is open), since the satellite
 * pass scan is the one non-trivial cost here.
 */
export function useCelestialEvents(enabled: boolean) {
  const location = useAppStore((s) => s.location);
  const timeZone = useAppStore((s) => s.timeZone);
  const [events, setEvents] = useState<CelestialEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);

    const now = new Date();
    const astroObserver = makeObserver(location);

    const satellitePassesPromise = loadSatelliteCatalog()
      .then((result) => {
        const satrecMap = buildSatrecMap(result.entries);
        return findUpcomingPasses(satrecMap, { lat: location.lat, lon: location.lon, heightKm: 0 }, astroObserver, now);
      })
      .then((passes) =>
        passes.map(
          (p): CelestialEvent => ({
            id: `satellite-${p.noradId}-${p.startTime.getTime()}`,
            type: 'satellite',
            date: p.startTime,
            icon: '🛰️',
            title: `${p.name} Geçişi`,
            detail: `En yüksek ${p.maxElevationDeg.toFixed(0)}° (${formatLocalTime(p.endTime, timeZone)}'te bitiyor).`,
          }),
        ),
      );

    Promise.allSettled([
      satellitePassesPromise,
      Promise.resolve(getUpcomingEclipses(now, astroObserver)),
      Promise.resolve(getUpcomingConjunctions(now)),
      Promise.resolve(getUpcomingMeteorShowers(now)),
      getAuroraForecast(location).then((e) => (e ? [e] : [])),
    ]).then((results) => {
      if (cancelled) return;
      const merged: CelestialEvent[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') merged.push(...result.value);
      }
      merged.sort((a, b) => a.date.getTime() - b.date.getTime());
      setEvents(merged);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, location, timeZone]);

  return { events, loading };
}
