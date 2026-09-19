// Planetary conjunction lookahead: finds close approaches (in apparent angular
// separation) between pairs of naked-eye planets. astronomy-engine has no
// built-in "conjunction finder", so this samples GeoVector/AngleBetween
// forward in time and looks for local minima, the same general shape as
// astro.ts's getUpcomingPath forward-sampling helper.
import * as Astronomy from 'astronomy-engine';
import { BODY_NAME_TR } from './bodyNamesTr';
import type { BodyName, CelestialEvent } from '../types/astronomy';

const NAKED_EYE_PLANETS: BodyName[] = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
const LOOKAHEAD_DAYS = 180;
const STEP_DAYS = 1;
const MAX_SEPARATION_DEG = 5;

function angularSeparationDeg(bodyA: BodyName, bodyB: BodyName, date: Date): number {
  const vecA = Astronomy.GeoVector(bodyA as Astronomy.Body, date, true);
  const vecB = Astronomy.GeoVector(bodyB as Astronomy.Body, date, true);
  return Astronomy.AngleBetween(vecA, vecB);
}

export function getUpcomingConjunctions(now: Date, count = 3): CelestialEvent[] {
  const events: CelestialEvent[] = [];

  for (let i = 0; i < NAKED_EYE_PLANETS.length; i++) {
    for (let j = i + 1; j < NAKED_EYE_PLANETS.length; j++) {
      const bodyA = NAKED_EYE_PLANETS[i];
      const bodyB = NAKED_EYE_PLANETS[j];

      let prevSeparation = angularSeparationDeg(bodyA, bodyB, now);
      let prevDate = now;

      for (let d = STEP_DAYS; d <= LOOKAHEAD_DAYS; d += STEP_DAYS) {
        const t = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
        const separation = angularSeparationDeg(bodyA, bodyB, t);

        // Local minimum: separation was shrinking, now growing again.
        if (separation > prevSeparation && prevSeparation <= MAX_SEPARATION_DEG) {
          events.push({
            id: `conjunction-${bodyA}-${bodyB}-${prevDate.getTime()}`,
            type: 'conjunction',
            date: prevDate,
            icon: '🪐',
            title: `${BODY_NAME_TR[bodyA]} – ${BODY_NAME_TR[bodyB]} Kavuşumu`,
            detail: `Gökyüzünde aralarındaki açısal mesafe ~${prevSeparation.toFixed(1)}° kadar yakınlaşıyor.`,
          });
          break; // one upcoming conjunction per pair is enough
        }

        prevSeparation = separation;
        prevDate = t;
      }
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events.slice(0, count);
}
