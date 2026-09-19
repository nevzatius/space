import { create } from 'zustand';
import type { GeoLocation, LocationSource } from '../types/astronomy';
import { resolveTimeZone } from '../lib/timezone';

interface AppState {
  location: GeoLocation;
  locationSource: LocationSource;
  timeZone: string;
  tzManuallySet: boolean;
  dateTimeUtc: Date;
  useLiveNow: boolean;
  selectedConstellation: string | null;
  showSatellites: boolean;
  setLocation: (location: GeoLocation, source?: LocationSource) => void;
  setTimeZone: (zone: string) => void;
  setDateTimeUtc: (date: Date) => void;
  setUseLiveNow: (value: boolean) => void;
  setSelectedConstellation: (code: string | null) => void;
  setShowSatellites: (value: boolean) => void;
}

const defaultLocation: GeoLocation = { lat: 41.0082, lon: 28.9784, label: 'İstanbul, Türkiye' };

export const useAppStore = create<AppState>((set) => ({
  location: defaultLocation,
  locationSource: 'manual',
  timeZone: resolveTimeZone(defaultLocation.lat, defaultLocation.lon),
  tzManuallySet: false,
  dateTimeUtc: new Date(),
  useLiveNow: true,
  selectedConstellation: null,
  showSatellites: true,
  setLocation: (location, source = 'manual') =>
    set((state) => ({
      location,
      locationSource: source,
      timeZone: state.tzManuallySet ? state.timeZone : resolveTimeZone(location.lat, location.lon),
    })),
  setTimeZone: (zone) => set({ timeZone: zone, tzManuallySet: true }),
  setDateTimeUtc: (date) => set({ dateTimeUtc: date, useLiveNow: false }),
  setUseLiveNow: (value) => set({ useLiveNow: value, ...(value ? { dateTimeUtc: new Date() } : {}) }),
  setSelectedConstellation: (code) => set({ selectedConstellation: code }),
  setShowSatellites: (value) => set({ showSatellites: value }),
}));
