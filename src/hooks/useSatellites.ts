import { useEffect, useRef, useState } from 'react';
import type { SatRec } from 'satellite.js';
import { useAppStore } from '../state/appStore';
import { buildSatrecMap, loadSatelliteCatalog, propagateSatellite } from '../lib/satellites';
import type { SatelliteCatalogState, SatellitePosition } from '../types/astronomy';

/**
 * Live satellite positions for the current observer/time. Runs its own 1Hz
 * clock (satellites move ~1°/s near zenith) rather than piggybacking on
 * useNow's 60s cadence, which would force the whole sky to recompute far
 * more often than the rest of the app needs.
 */
export function useSatellites(sunAltitude: number) {
  const location = useAppStore((s) => s.location);
  const useLiveNow = useAppStore((s) => s.useLiveNow);
  const dateTimeUtc = useAppStore((s) => s.dateTimeUtc);

  const [catalogState, setCatalogState] = useState<SatelliteCatalogState>({ status: 'loading' });
  const satrecMapRef = useRef<Map<string, { name: string; satrec: SatRec }>>(new Map());
  const [positions, setPositions] = useState<SatellitePosition[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadSatelliteCatalog()
      .then((result) => {
        if (cancelled) return;
        satrecMapRef.current = buildSatrecMap(result.entries);
        setCatalogState({ status: 'ready', source: result.source, count: result.entries.length, fetchedAt: result.fetchedAt });
      })
      .catch((err) => {
        if (!cancelled) setCatalogState({ status: 'error', message: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (catalogState.status !== 'ready') {
      setPositions([]);
      return undefined;
    }
    const observer = { lat: location.lat, lon: location.lon, heightKm: 0 };

    const tick = () => {
      const t = useLiveNow ? new Date() : dateTimeUtc;
      const out: SatellitePosition[] = [];
      for (const [noradId, { name, satrec }] of satrecMapRef.current) {
        const pos = propagateSatellite(satrec, name, noradId, t, observer, sunAltitude);
        if (pos) out.push(pos);
      }
      setPositions(out);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [catalogState.status, location.lat, location.lon, useLiveNow, dateTimeUtc, sunAltitude]);

  return { positions, catalogState };
}
