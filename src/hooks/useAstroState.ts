import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import { useAppStore } from '../state/appStore';
import {
  TRACKED_BODIES,
  getConstellationLinesHorizontal,
  getDayRiseSet,
  getGalacticPlaneHorizontal,
  getMoonPhase,
  getMoonSunDirectionRender,
  getBodyHorizontal,
  getStarsHorizontal,
  getUpcomingPath,
  getVisibleConstellations,
  makeObserver,
} from '../lib/astro';
import { getLocalDayStartUtc } from '../lib/timezone';
import { getBortleClass } from '../lib/lightPollution';
import { constellations, stars } from '../lib/starCatalog';
import type { BodyPosition, ConstellationSegment, HorizontalCoords } from '../types/astronomy';

export interface ConstellationRenderData {
  code: string;
  nameLatin: string;
  nameTr: string;
  linesHorizontal: ConstellationSegment[];
}

function useComputedAstroState() {
  const location = useAppStore((s) => s.location);
  const timeZone = useAppStore((s) => s.timeZone);
  const dateTimeUtc = useAppStore((s) => s.dateTimeUtc);

  const observer = useMemo(() => makeObserver(location), [location.lat, location.lon]);

  const lightPollution = useMemo(() => getBortleClass(location.lat, location.lon), [location.lat, location.lon]);

  const moonPhase = useMemo(() => getMoonPhase(dateTimeUtc), [dateTimeUtc]);

  const moonSunDirection = useMemo(
    () => getMoonSunDirectionRender(dateTimeUtc, observer),
    [dateTimeUtc, observer],
  );

  const bodyPositions = useMemo(
    () => TRACKED_BODIES.map((body) => getBodyHorizontal(body, dateTimeUtc, observer)),
    [dateTimeUtc, observer],
  );

  const starsHorizontal = useMemo(() => getStarsHorizontal(dateTimeUtc, observer, stars), [dateTimeUtc, observer]);

  const galacticPlane = useMemo(() => getGalacticPlaneHorizontal(dateTimeUtc, observer), [dateTimeUtc, observer]);

  const constellationLines: ConstellationRenderData[] = useMemo(
    () =>
      constellations.map((c) => ({
        code: c.code,
        nameLatin: c.nameLatin,
        nameTr: c.nameTr,
        linesHorizontal: getConstellationLinesHorizontal(c, dateTimeUtc, observer),
      })),
    [dateTimeUtc, observer],
  );

  const visibleConstellations = useMemo(
    () => getVisibleConstellations(starsHorizontal, constellations, 0.4, lightPollution.limitingMagnitude),
    [starsHorizontal, lightPollution.limitingMagnitude],
  );

  const recommendedBodies: BodyPosition[] = useMemo(
    () =>
      bodyPositions
        .filter((b) => b.altitude > 0 && b.magnitude <= lightPollution.limitingMagnitude)
        .sort((a, b) => a.magnitude - b.magnitude),
    [bodyPositions, lightPollution.limitingMagnitude],
  );

  const dayStartMs = getLocalDayStartUtc(dateTimeUtc, timeZone).getTime();
  const riseSet = useMemo(() => {
    const dayStartUtc = new Date(dayStartMs);
    return TRACKED_BODIES.map((body) => getDayRiseSet(body, dayStartUtc, observer));
  }, [dayStartMs, observer]);

  // Where the Moon and Sun are headed: sampled positions for the next 24h, used to
  // draw their upcoming paths across the sky dome.
  const pathTimeMs = Math.floor(dateTimeUtc.getTime() / 300_000) * 300_000;
  const moonPath: HorizontalCoords[] = useMemo(
    () => getUpcomingPath('Moon', new Date(pathTimeMs), observer),
    [pathTimeMs, observer],
  );

  const sunPath: HorizontalCoords[] = useMemo(
    () => getUpcomingPath('Sun', new Date(pathTimeMs), observer),
    [pathTimeMs, observer],
  );

  return {
    observer,
    lightPollution,
    moonPhase,
    moonSunDirection,
    bodyPositions,
    starsHorizontal,
    galacticPlane,
    constellationLines,
    visibleConstellations,
    recommendedBodies,
    riseSet,
    moonPath,
    sunPath,
  };
}

const AstroContext = createContext<ReturnType<typeof useComputedAstroState> | null>(null);

export function AstroProvider({ children }: { children: ReactNode }) {
  return createElement(AstroContext.Provider, { value: useComputedAstroState() }, children);
}

export function useAstroState() {
  const state = useContext(AstroContext);
  if (!state) throw new Error('useAstroState requires AstroProvider');
  return state;
}
