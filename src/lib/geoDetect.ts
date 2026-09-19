import type { GeoLocation } from '../types/astronomy';
import type { Language } from '../i18n/language';

async function reverseGeocodeLabel(lat: number, lon: number, language: Language): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=${language}&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('reverse geocode failed');
    const data: { display_name?: string } = await res.json();
    return data.display_name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

/** Requests the device's GPS/network location via the browser Geolocation API and reverse-geocodes it to a label. */
export function detectDeviceLocation(language: Language): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error(language === 'tr' ? 'Bu tarayıcı konum tespitini desteklemiyor.' : 'This browser does not support location detection.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lon = Math.round(pos.coords.longitude * 10000) / 10000;
        const label = await reverseGeocodeLabel(lat, lon, language);
        resolve({ lat, lon, label, source: 'gps' });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error(language === 'tr' ? 'Konum izni reddedildi.' : 'Location permission denied.'));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error(language === 'tr' ? 'Konum isteği zaman aşımına uğradı.' : 'Location request timed out.'));
        } else {
          reject(new Error(language === 'tr' ? 'Cihaz konumu alınamadı.' : 'Could not get device location.'));
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}

interface IpApiResponse {
  latitude?: number;
  longitude?: number;
  city?: string;
  country_name?: string;
  error?: boolean;
  reason?: string;
}

/** Estimates location from the visitor's IP address via a keyless, CORS-open geolocation service (city-level accuracy). */
export async function detectIpLocation(language: Language): Promise<GeoLocation> {
  let res: Response;
  try {
    res = await fetch('https://ipapi.co/json/');
  } catch {
    throw new Error(language === 'tr' ? 'İnternet konumu alınamadı, bağlantınızı kontrol edin.' : 'Could not get internet location, check your connection.');
  }
  if (!res.ok) throw new Error(language === 'tr' ? 'İnternet konumu alınamadı.' : 'Could not get internet location.');
  const data: IpApiResponse = await res.json();
  if (data.error || data.latitude === undefined || data.longitude === undefined) {
    throw new Error(data.reason ?? (language === 'tr' ? 'İnternet konumu tespit edilemedi.' : 'Could not detect internet location.'));
  }
  const label = [data.city, data.country_name].filter(Boolean).join(', ') || `${data.latitude}, ${data.longitude}`;
  return { lat: data.latitude, lon: data.longitude, label, source: 'ip' };
}
