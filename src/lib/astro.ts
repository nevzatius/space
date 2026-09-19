import * as Astronomy from 'astronomy-engine';
import type {
  BodyName,
  BodyPosition,
  ConstellationDef,
  HorizontalCoords,
  MoonPhaseInfo,
  ObserverInput,
  RiseSetInfo,
  StarCatalog,
  StarHorizontal,
  VisibleConstellation,
} from '../types/astronomy';
import { altAzToCartesian, circularMeanDeg } from './coords';

export const TRACKED_BODIES: BodyName[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

export function makeObserver(input: ObserverInput): Astronomy.Observer {
  return new Astronomy.Observer(input.lat, input.lon, input.elevation ?? 0);
}

const MOON_PHASE_NAMES_TR: Array<{ max: number; name: string }> = [
  { max: 22.5, name: 'Yeni Ay' },
  { max: 67.5, name: 'Hilal (Büyüyen)' },
  { max: 112.5, name: 'İlk Dördün' },
  { max: 157.5, name: 'Şişkin Ay (Büyüyen)' },
  { max: 202.5, name: 'Dolunay' },
  { max: 247.5, name: 'Şişkin Ay (Küçülen)' },
  { max: 292.5, name: 'Son Dördün' },
  { max: 337.5, name: 'Hilal (Küçülen)' },
  { max: 360.01, name: 'Yeni Ay' },
];

export function getMoonPhase(date: Date): MoonPhaseInfo {
  const phaseAngle = Astronomy.MoonPhase(date);
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);
  const entry = MOON_PHASE_NAMES_TR.find((e) => phaseAngle < e.max) ?? MOON_PHASE_NAMES_TR[MOON_PHASE_NAMES_TR.length - 1];
  return {
    phaseAngle,
    illumination: illum.phase_fraction,
    nameTr: entry.name,
    waxing: phaseAngle < 180,
  };
}

export function getBodyHorizontal(body: BodyName, date: Date, observer: Astronomy.Observer): BodyPosition {
  const astroBody = body as Astronomy.Body;
  const equ = Astronomy.Equator(astroBody, date, observer, true, true);
  const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, 'normal');
  const illum = Astronomy.Illumination(astroBody, date);
  return { body, azimuth: hor.azimuth, altitude: hor.altitude, magnitude: illum.mag };
}

/**
 * Rise/set/transit for one body across the local calendar day that starts at
 * `dayStartUtc` (caller resolves that from the observer's IANA time zone).
 */
export function getDayRiseSet(body: BodyName, dayStartUtc: Date, observer: Astronomy.Observer): RiseSetInfo {
  const astroBody = body as Astronomy.Body;
  const riseTime = Astronomy.SearchRiseSet(astroBody, observer, +1, dayStartUtc, 1);
  const setTime = Astronomy.SearchRiseSet(astroBody, observer, -1, dayStartUtc, 1);
  let transitTime: Date | null = null;
  let transitAltitude: number | null = null;
  try {
    const hourAngleEvent = Astronomy.SearchHourAngle(astroBody, observer, 0, dayStartUtc);
    transitTime = hourAngleEvent.time.date;
    transitAltitude = hourAngleEvent.hor.altitude;
  } catch {
    // body may not culminate within a reasonable search window; leave null
  }

  return {
    body,
    riseTime: riseTime ? riseTime.date : null,
    riseAzimuth: riseTime ? getBodyHorizontal(body, riseTime.date, observer).azimuth : null,
    setTime: setTime ? setTime.date : null,
    setAzimuth: setTime ? getBodyHorizontal(body, setTime.date, observer).azimuth : null,
    transitTime,
    transitAltitude,
  };
}

/** Samples a body's Alt/Az track across the next `hours` (default 24h) at `stepMinutes` resolution. */
export function getUpcomingPath(
  body: BodyName,
  date: Date,
  observer: Astronomy.Observer,
  stepMinutes = 15,
  hours = 24,
): HorizontalCoords[] {
  const steps = (hours * 60) / stepMinutes;
  const points: HorizontalCoords[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = new Date(date.getTime() + i * stepMinutes * 60_000);
    const { azimuth, altitude } = getBodyHorizontal(body, t, observer);
    points.push({ azimuth, altitude });
  }
  return points;
}

let cachedRotationKey: number | null = null;
let cachedRotation: Astronomy.RotationMatrix | null = null;

function rotationEqjToEqd(date: Date): Astronomy.RotationMatrix {
  const key = date.getTime();
  if (cachedRotationKey === key && cachedRotation) return cachedRotation;
  cachedRotation = Astronomy.Rotation_EQJ_EQD(date);
  cachedRotationKey = key;
  return cachedRotation;
}

function equatorialJ2000ToHorizontal(
  raDeg: number,
  decDeg: number,
  date: Date,
  observer: Astronomy.Observer,
  rotation: Astronomy.RotationMatrix,
): { azimuth: number; altitude: number } {
  const raRad = (raDeg * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;
  const vecJ2000 = new Astronomy.Vector(
    Math.cos(decRad) * Math.cos(raRad),
    Math.cos(decRad) * Math.sin(raRad),
    Math.sin(decRad),
    Astronomy.MakeTime(date),
  );
  const vecOfDate = Astronomy.RotateVector(rotation, vecJ2000);
  const equOfDate = Astronomy.EquatorFromVector(vecOfDate);
  const hor = Astronomy.Horizon(date, observer, equOfDate.ra, equOfDate.dec, 'normal');
  return { azimuth: hor.azimuth, altitude: hor.altitude };
}

/** Alt/Az for every star in the catalog at the given moment (recompute only on date/location change). */
export function getStarsHorizontal(date: Date, observer: Astronomy.Observer, catalog: StarCatalog): StarHorizontal[] {
  const rotation = rotationEqjToEqd(date);
  const out: StarHorizontal[] = new Array(catalog.count);
  for (let i = 0; i < catalog.count; i++) {
    const { azimuth, altitude } = equatorialJ2000ToHorizontal(catalog.ra[i], catalog.dec[i], date, observer, rotation);
    out[i] = { azimuth, altitude, mag: catalog.mag[i], bv: catalog.bv[i], con: catalog.con[i] };
  }
  return out;
}

/** Alt/Az for every constellation line vertex, keyed the same way as `constellation.lines`. */
export function getConstellationLinesHorizontal(
  constellation: ConstellationDef,
  date: Date,
  observer: Astronomy.Observer,
): Array<[[number, number], [number, number]]> {
  const rotation = rotationEqjToEqd(date);
  return constellation.lines.map(([p1, p2]) => {
    const a = equatorialJ2000ToHorizontal(p1[0], p1[1], date, observer, rotation);
    const b = equatorialJ2000ToHorizontal(p2[0], p2[1], date, observer, rotation);
    return [
      [a.azimuth, a.altitude],
      [b.azimuth, b.altitude],
    ] as [[number, number], [number, number]];
  });
}

/**
 * Determines which constellations are currently above the horizon, using the
 * already-computed per-star Alt/Az array (avoids recomputing star positions).
 */
export function getVisibleConstellations(
  starsHorizontal: StarHorizontal[],
  constellations: ConstellationDef[],
  visibilityThreshold = 0.4,
  maxMagnitude = 6.0,
): VisibleConstellation[] {
  const byCode = new Map<string, StarHorizontal[]>();
  for (const s of starsHorizontal) {
    if (!s.con || s.mag > maxMagnitude) continue;
    const arr = byCode.get(s.con);
    if (arr) arr.push(s);
    else byCode.set(s.con, [s]);
  }

  const results: VisibleConstellation[] = [];
  for (const constellation of constellations) {
    const members = byCode.get(constellation.code);
    if (!members || members.length === 0) continue;
    const aboveHorizon = members.filter((m) => m.altitude > 0);
    const visibleStarRatio = aboveHorizon.length / members.length;
    if (visibleStarRatio < visibilityThreshold) continue;
    results.push({
      code: constellation.code,
      nameLatin: constellation.nameLatin,
      nameTr: constellation.nameTr,
      averageAzimuth: circularMeanDeg(aboveHorizon.map((m) => m.azimuth)),
      averageAltitude: aboveHorizon.reduce((sum, m) => sum + m.altitude, 0) / aboveHorizon.length,
      visibleStarRatio,
    });
  }
  results.sort((a, b) => b.averageAltitude - a.averageAltitude);
  return results;
}

/**
 * Direction from the Moon toward the Sun, expressed as a unit vector in the
 * *render* (Alt/Az-derived) coordinate frame used by the sky dome. Feeding
 * this straight into a DirectionalLight aimed at the Moon mesh produces a
 * physically correct terminator without a hand-authored phase shader.
 */
export function getMoonSunDirectionRender(date: Date, observer: Astronomy.Observer): [number, number, number] {
  const sun = Astronomy.GeoVector(Astronomy.Body.Sun, date, true);
  const moon = Astronomy.GeoVector(Astronomy.Body.Moon, date, true);
  const dx = sun.x - moon.x;
  const dy = sun.y - moon.y;
  const dz = sun.z - moon.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

  const dirJ2000 = new Astronomy.Vector(dx / len, dy / len, dz / len, Astronomy.MakeTime(date));
  const rotation = rotationEqjToEqd(date);
  const dirOfDate = Astronomy.RotateVector(rotation, dirJ2000);
  const equ = Astronomy.EquatorFromVector(dirOfDate);
  const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, 'normal');
  return altAzToCartesian(hor.altitude, hor.azimuth, 1);
}

// IAU 1958 galactic-to-J2000-equatorial rotation matrix (standard constants; see e.g.
// the ESA Hipparcos Catalogue, Vol. 1, §1.5.3). Used only to place the Milky Way band
// at its real position in the sky, independent of the star/constellation catalogs.
const GALACTIC_TO_EQJ: [[number, number, number], [number, number, number], [number, number, number]] = [
  [-0.0548755604, 0.4941094279, -0.867666149],
  [-0.8734370902, -0.44482963, -0.1980763734],
  [-0.4838350155, 0.7469822445, 0.4559837762],
];

function galacticToEquatorialJ2000(lDeg: number, bDeg: number): { raDeg: number; decDeg: number } {
  const l = (lDeg * Math.PI) / 180;
  const b = (bDeg * Math.PI) / 180;
  const xg = Math.cos(b) * Math.cos(l);
  const yg = Math.cos(b) * Math.sin(l);
  const zg = Math.sin(b);
  const [r0, r1, r2] = GALACTIC_TO_EQJ;
  const xe = r0[0] * xg + r0[1] * yg + r0[2] * zg;
  const ye = r1[0] * xg + r1[1] * yg + r1[2] * zg;
  const ze = r2[0] * xg + r2[1] * yg + r2[2] * zg;
  const raDeg = ((Math.atan2(ye, xe) * 180) / Math.PI + 360) % 360;
  const decDeg = (Math.asin(Math.min(1, Math.max(-1, ze))) * 180) / Math.PI;
  return { raDeg, decDeg };
}

/**
 * Points along the galactic equator (b=0°), converted to Alt/Az, tracing the Milky
 * Way's real position across the sky for the sky dome's galactic band.
 */
export function getGalacticPlaneHorizontal(date: Date, observer: Astronomy.Observer, samples = 48): HorizontalCoords[] {
  const rotation = rotationEqjToEqd(date);
  const out: HorizontalCoords[] = [];
  for (let i = 0; i < samples; i++) {
    const l = (i / samples) * 360;
    const { raDeg, decDeg } = galacticToEquatorialJ2000(l, 0);
    const { azimuth, altitude } = equatorialJ2000ToHorizontal(raDeg, decDeg, date, observer, rotation);
    out.push({ azimuth, altitude });
  }
  return out;
}
