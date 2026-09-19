// Solar/lunar eclipse lookahead. astronomy-engine already implements the
// search itself (SearchLocalSolarEclipse / SearchLunarEclipse) — this file
// just wraps it into the app's CelestialEvent shape, matching how astro.ts
// wraps the rest of astronomy-engine.
import * as Astronomy from 'astronomy-engine';
import { getBodyHorizontal } from './astro';
import type { CelestialEvent } from '../types/astronomy';
import type { Language } from '../i18n/language';

const ECLIPSE_KIND_TR: Record<Astronomy.EclipseKind, string> = {
  [Astronomy.EclipseKind.Penumbral]: 'yarı gölge',
  [Astronomy.EclipseKind.Partial]: 'parçalı',
  [Astronomy.EclipseKind.Annular]: 'halkalı',
  [Astronomy.EclipseKind.Total]: 'tam',
};

const ECLIPSE_KIND_EN: Record<Astronomy.EclipseKind, string> = {
  [Astronomy.EclipseKind.Penumbral]: 'penumbral',
  [Astronomy.EclipseKind.Partial]: 'partial',
  [Astronomy.EclipseKind.Annular]: 'annular',
  [Astronomy.EclipseKind.Total]: 'total',
};

export function getUpcomingEclipses(now: Date, observer: Astronomy.Observer, language: Language): CelestialEvent[] {
  const events: CelestialEvent[] = [];
  const kindLabel = (kind: Astronomy.EclipseKind) => (language === 'tr' ? ECLIPSE_KIND_TR : ECLIPSE_KIND_EN)[kind];

  try {
    const local = Astronomy.SearchLocalSolarEclipse(now, observer);
    events.push({
      id: `solar-eclipse-local-${local.peak.time.date.getTime()}`,
      type: 'solar-eclipse',
      date: local.peak.time.date,
      icon: '🌑',
      title:
        language === 'tr' ? `Güneş Tutulması (${kindLabel(local.kind)})` : `Solar Eclipse (${kindLabel(local.kind)})`,
      detail: language === 'tr' ? 'Bulunduğunuz konumdan görünür.' : 'Visible from your location.',
    });

    const global = Astronomy.SearchGlobalSolarEclipse(now);
    if (global.peak.date.getTime() !== local.peak.time.date.getTime()) {
      events.push({
        id: `solar-eclipse-global-${global.peak.date.getTime()}`,
        type: 'solar-eclipse',
        date: global.peak.date,
        icon: '🌑',
        title:
          language === 'tr'
            ? `Güneş Tutulması (${kindLabel(global.kind)})`
            : `Solar Eclipse (${kindLabel(global.kind)})`,
        detail:
          language === 'tr'
            ? 'Dünyanın başka bir bölgesinden görünür; bu konumdan görünmeyebilir.'
            : 'Visible from another part of the world; may not be visible from this location.',
      });
    }
  } catch {
    // No eclipse found in astronomy-engine's search window — skip.
  }

  try {
    const lunar = Astronomy.SearchLunarEclipse(now);
    const moonAltitude = getBodyHorizontal('Moon', lunar.peak.date, observer).altitude;
    const visible = moonAltitude > 0;
    events.push({
      id: `lunar-eclipse-${lunar.peak.date.getTime()}`,
      type: 'lunar-eclipse',
      date: lunar.peak.date,
      icon: '🌕',
      title: language === 'tr' ? `Ay Tutulması (${kindLabel(lunar.kind)})` : `Lunar Eclipse (${kindLabel(lunar.kind)})`,
      detail:
        language === 'tr'
          ? visible
            ? 'Bulunduğunuz konumdan görünür (Ay ufkun üzerinde).'
            : 'Bu saatte Ay ufkun altında; bu konumdan görünmez.'
          : visible
            ? 'Visible from your location (the Moon is above the horizon).'
            : 'The Moon is below the horizon at this time; not visible from this location.',
    });
  } catch {
    // No lunar eclipse found — skip.
  }

  return events;
}
