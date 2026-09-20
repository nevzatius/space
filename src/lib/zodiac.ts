import * as Astronomy from 'astronomy-engine';
import { constellationByCode } from './starCatalog';

export interface TropicalSign {
  nameEn: string;
  nameTr: string;
  symbol: string;
}

export interface AstronomicalZodiacResult {
  date: Date;
  constellationCode: string;
  nameLatin: string;
  nameTr: string;
  tropicalSign: TropicalSign;
  isOphiuchus: boolean;
}

// (month, day) cutoff where each tropical sign begins; the last entry whose
// cutoff is <= the input date wins, wrapping around at year end into Capricorn.
const TROPICAL_CUTOFFS: Array<[number, number, TropicalSign]> = [
  [1, 1, { nameEn: 'Capricorn', nameTr: 'Oğlak', symbol: '♑' }],
  [1, 20, { nameEn: 'Aquarius', nameTr: 'Kova', symbol: '♒' }],
  [2, 19, { nameEn: 'Pisces', nameTr: 'Balık', symbol: '♓' }],
  [3, 21, { nameEn: 'Aries', nameTr: 'Koç', symbol: '♈' }],
  [4, 20, { nameEn: 'Taurus', nameTr: 'Boğa', symbol: '♉' }],
  [5, 21, { nameEn: 'Gemini', nameTr: 'İkizler', symbol: '♊' }],
  [6, 21, { nameEn: 'Cancer', nameTr: 'Yengeç', symbol: '♋' }],
  [7, 23, { nameEn: 'Leo', nameTr: 'Aslan', symbol: '♌' }],
  [8, 23, { nameEn: 'Virgo', nameTr: 'Başak', symbol: '♍' }],
  [9, 23, { nameEn: 'Libra', nameTr: 'Terazi', symbol: '♎' }],
  [10, 23, { nameEn: 'Scorpio', nameTr: 'Akrep', symbol: '♏' }],
  [11, 22, { nameEn: 'Sagittarius', nameTr: 'Yay', symbol: '♐' }],
  [12, 22, { nameEn: 'Capricorn', nameTr: 'Oğlak', symbol: '♑' }],
];

export function getTropicalSign(month: number, day: number): TropicalSign {
  let match = TROPICAL_CUTOFFS[0][2];
  for (const [cutoffMonth, cutoffDay, sign] of TROPICAL_CUTOFFS) {
    if (month > cutoffMonth || (month === cutoffMonth && day >= cutoffDay)) match = sign;
  }
  return match;
}

/**
 * Computes the true IAU constellation the Sun occupied on a given calendar date.
 * Uses noon UTC as a fixed reference time — the Sun moves under 1°/day along the
 * ecliptic, far short of a boundary crossing within a single day, except on the
 * handful of dates each year that are themselves boundary-crossing days.
 */
export function getAstronomicalZodiac(isoDate: string): AstronomicalZodiacResult {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const sunVec = Astronomy.GeoVector(Astronomy.Body.Sun, date, true);
  const equ = Astronomy.EquatorFromVector(sunVec);
  const info = Astronomy.Constellation(equ.ra, equ.dec);
  const def = constellationByCode.get(info.symbol);
  return {
    date,
    constellationCode: info.symbol,
    nameLatin: def?.nameLatin ?? info.name,
    nameTr: def?.nameTr ?? info.name,
    tropicalSign: getTropicalSign(month, day),
    isOphiuchus: info.symbol === 'Oph',
  };
}
