import tzLookup from 'tz-lookup';
import { DateTime } from 'luxon';

/** Resolves the IANA time zone for a lat/lon, fully client-side. */
export function resolveTimeZone(lat: number, lon: number): string {
  try {
    return tzLookup(lat, lon);
  } catch {
    return 'UTC';
  }
}

/**
 * Combines a wall-clock date + time string with an IANA time zone into a
 * single unambiguous UTC Date. This is the only representation astro.ts and
 * the rest of the app should consume.
 */
export function combineToUtcDate(isoDate: string, timeStr: string, zone: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const dt = DateTime.fromObject({ year, month, day, hour, minute }, { zone });
  return dt.isValid ? dt.toUTC().toJSDate() : new Date();
}

/** Returns the UTC instant corresponding to 00:00 local time, on the calendar day `dateUtc` falls on in `zone`. */
export function getLocalDayStartUtc(dateUtc: Date, zone: string): Date {
  return DateTime.fromJSDate(dateUtc, { zone: 'utc' }).setZone(zone).startOf('day').toUTC().toJSDate();
}

/** Formats a UTC Date as an "HH:mm" string in the given zone, or a placeholder if null. */
export function formatLocalTime(date: Date | null, zone: string): string {
  if (!date) return '—';
  return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(zone).toFormat('HH:mm');
}

/** Formats a UTC Date as a "d MMM, HH:mm" string (localized month names) in the given zone, or a placeholder if null. */
export function formatLocalDateTime(date: Date | null, zone: string, locale: string = 'tr'): string {
  if (!date) return '—';
  return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(zone).setLocale(locale).toFormat('d MMM, HH:mm');
}

/** Splits a UTC Date back into local wall-clock date/time strings for a zone. */
export function splitFromUtcDate(utcDate: Date, zone: string): { isoDate: string; timeStr: string } {
  const dt = DateTime.fromJSDate(utcDate, { zone: 'utc' }).setZone(zone);
  return {
    isoDate: dt.toFormat('yyyy-MM-dd'),
    timeStr: dt.toFormat('HH:mm'),
  };
}
