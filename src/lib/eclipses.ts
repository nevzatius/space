// Solar/lunar eclipse lookahead. astronomy-engine already implements the
// search itself (SearchLocalSolarEclipse / SearchLunarEclipse) — this file
// just wraps it into the app's CelestialEvent shape, matching how astro.ts
// wraps the rest of astronomy-engine.
import * as Astronomy from 'astronomy-engine';
import { getBodyHorizontal } from './astro';
import type { CelestialEvent } from '../types/astronomy';

const ECLIPSE_KIND_TR: Record<Astronomy.EclipseKind, string> = {
  [Astronomy.EclipseKind.Penumbral]: 'yarı gölge',
  [Astronomy.EclipseKind.Partial]: 'parçalı',
  [Astronomy.EclipseKind.Annular]: 'halkalı',
  [Astronomy.EclipseKind.Total]: 'tam',
};

export function getUpcomingEclipses(now: Date, observer: Astronomy.Observer): CelestialEvent[] {
  const events: CelestialEvent[] = [];

  try {
    const local = Astronomy.SearchLocalSolarEclipse(now, observer);
    const kindTr = ECLIPSE_KIND_TR[local.kind];
    events.push({
      id: `solar-eclipse-local-${local.peak.time.date.getTime()}`,
      type: 'solar-eclipse',
      date: local.peak.time.date,
      icon: '🌑',
      title: `Güneş Tutulması (${kindTr})`,
      detail: 'Bulunduğunuz konumdan görünür.',
    });

    const global = Astronomy.SearchGlobalSolarEclipse(now);
    if (global.peak.date.getTime() !== local.peak.time.date.getTime()) {
      const globalKindTr = ECLIPSE_KIND_TR[global.kind];
      events.push({
        id: `solar-eclipse-global-${global.peak.date.getTime()}`,
        type: 'solar-eclipse',
        date: global.peak.date,
        icon: '🌑',
        title: `Güneş Tutulması (${globalKindTr})`,
        detail: 'Dünyanın başka bir bölgesinden görünür; bu konumdan görünmeyebilir.',
      });
    }
  } catch {
    // No eclipse found in astronomy-engine's search window — skip.
  }

  try {
    const lunar = Astronomy.SearchLunarEclipse(now);
    const kindTr = ECLIPSE_KIND_TR[lunar.kind];
    const moonAltitude = getBodyHorizontal('Moon', lunar.peak.date, observer).altitude;
    const visible = moonAltitude > 0;
    events.push({
      id: `lunar-eclipse-${lunar.peak.date.getTime()}`,
      type: 'lunar-eclipse',
      date: lunar.peak.date,
      icon: '🌕',
      title: `Ay Tutulması (${kindTr})`,
      detail: visible ? 'Bulunduğunuz konumdan görünür (Ay ufkun üzerinde).' : 'Bu saatte Ay ufkun altında; bu konumdan görünmez.',
    });
  } catch {
    // No lunar eclipse found — skip.
  }

  return events;
}
