export type BodyName = 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn';

export type LocationSource = 'gps' | 'ip' | 'manual';

export interface GeoLocation {
  lat: number;
  lon: number;
  label: string;
  source?: LocationSource;
}

export interface LightPollutionInfo {
  bortle: number;
  limitingMagnitude: number;
}

export interface ObserverInput {
  lat: number;
  lon: number;
  elevation?: number;
}

export interface HorizontalCoords {
  azimuth: number;
  altitude: number;
}

export interface BodyPosition extends HorizontalCoords {
  body: BodyName;
  magnitude: number;
}

export interface RiseSetInfo {
  body: BodyName;
  riseTime: Date | null;
  riseAzimuth: number | null;
  setTime: Date | null;
  setAzimuth: number | null;
  transitTime: Date | null;
  transitAltitude: number | null;
}

export interface MoonPhaseInfo {
  phaseAngle: number;
  illumination: number;
  nameTr: string;
  waxing: boolean;
}

export interface VisibleConstellation {
  code: string;
  nameLatin: string;
  nameTr: string;
  averageAzimuth: number;
  averageAltitude: number;
  visibleStarRatio: number;
}

export interface StarCatalog {
  source: string;
  epoch: string;
  magLimit: number;
  count: number;
  hip: number[];
  ra: number[];
  dec: number[];
  mag: number[];
  bv: number[];
  con: string[];
}

export type ConstellationSegment = [[number, number], [number, number]];

export interface ConstellationDef {
  code: string;
  nameLatin: string;
  nameTr: string;
  lines: ConstellationSegment[];
}

export interface StarHorizontal {
  azimuth: number;
  altitude: number;
  mag: number;
  bv: number;
  con: string;
}

export interface SatelliteTleEntry {
  noradId: string;
  name: string;
  line1: string;
  line2: string;
}

export interface SatellitePosition {
  noradId: string;
  name: string;
  azimuth: number;
  altitude: number;
  rangeKm: number;
  sunlit: boolean;
  aboveHorizon: boolean;
  /** aboveHorizon && sunlit && observer's sky is dark enough to actually see it. */
  currentlyVisible: boolean;
}

export type SatelliteCatalogSource = 'network' | 'cache' | 'stale-cache' | 'fallback';

export type SatelliteCatalogState =
  | { status: 'loading' }
  | { status: 'ready'; source: SatelliteCatalogSource; count: number; fetchedAt: number }
  | { status: 'error'; message: string };

export interface SatellitePassEvent {
  noradId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  maxElevationDeg: number;
  maxElevationAzimuthDeg: number;
}

export type CelestialEventType = 'satellite' | 'solar-eclipse' | 'lunar-eclipse' | 'conjunction' | 'meteor-shower' | 'aurora';

export interface CelestialEvent {
  id: string;
  type: CelestialEventType;
  date: Date;
  icon: string;
  title: string;
  detail?: string;
}
