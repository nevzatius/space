// Annual meteor showers have no year-dependent almanac in astronomy-engine
// (they're a fixed calendar-date phenomenon tied to Earth crossing a debris
// stream, not a body position search), so this is a small static table,
// following the same "precompute static data, ship as JSON" convention as
// constellations.json.
import showers from '../data/meteorShowers.json';
import type { CelestialEvent } from '../types/astronomy';

interface MeteorShowerDef {
  id: string;
  nameTr: string;
  nameLatin: string;
  radiantTr: string;
  peakMonth: number;
  peakDay: number;
  zhr: number;
}

function nextOccurrence(now: Date, month: number, day: number): Date {
  const year = now.getUTCFullYear();
  let candidate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  if (candidate.getTime() < now.getTime()) {
    candidate = new Date(Date.UTC(year + 1, month - 1, day, 0, 0, 0));
  }
  return candidate;
}

export function getUpcomingMeteorShowers(now: Date, count = 3): CelestialEvent[] {
  const events: CelestialEvent[] = (showers as MeteorShowerDef[]).map((shower) => {
    const date = nextOccurrence(now, shower.peakMonth, shower.peakDay);
    return {
      id: `meteor-${shower.id}-${date.getFullYear()}`,
      type: 'meteor-shower',
      date,
      icon: '☄️',
      title: `${shower.nameTr} Meteor Yağmuru`,
      detail: `Radyant: ${shower.radiantTr} · Tepe saatte ~${shower.zhr} meteor (ideal koşullarda).`,
    };
  });

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events.slice(0, count);
}
