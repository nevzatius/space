import { useMemo, useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { getBortleClass } from '../../lib/lightPollution';
import { detectDeviceLocation, detectIpLocation } from '../../lib/geoDetect';
import { useTranslation } from '../../i18n/useTranslation';
import { LocationPicker } from '../map/LocationPicker';
import './LocationMenu.css';

type Tab = 'device' | 'ip' | 'map';

export function LocationMenu({ onClose }: { onClose: () => void }) {
  const location = useAppStore((s) => s.location);
  const locationSource = useAppStore((s) => s.locationSource);
  const setLocation = useAppStore((s) => s.setLocation);
  const { t, language } = useTranslation();
  const [tab, setTab] = useState<Tab>('map');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bortle = useMemo(() => getBortleClass(location.lat, location.lon), [location.lat, location.lon]);

  const sourceLabel: Record<string, string> = {
    gps: t.locationMenu.sourceGps,
    ip: t.locationMenu.sourceIp,
    manual: t.locationMenu.sourceManual,
  };

  async function handleAuto(kind: 'device' | 'ip') {
    setTab(kind);
    setBusy(true);
    setError(null);
    try {
      const result = await (kind === 'device' ? detectDeviceLocation(language) : detectIpLocation(language));
      setLocation(result, kind === 'device' ? 'gps' : 'ip');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.locationMenu.detecting);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="location-menu">
      <div className="location-menu__tabs">
        <button type="button" className={tab === 'device' ? 'is-active' : ''} onClick={() => handleAuto('device')}>
          📍 {t.locationMenu.deviceLocation}
        </button>
        <button type="button" className={tab === 'ip' ? 'is-active' : ''} onClick={() => handleAuto('ip')}>
          🌐 {t.locationMenu.ipLocation}
        </button>
        <button type="button" className={tab === 'map' ? 'is-active' : ''} onClick={() => setTab('map')}>
          🗺️ {t.locationMenu.mapSearch}
        </button>
      </div>

      {busy && <p className="location-menu__status">{t.locationMenu.detecting}</p>}
      {error && <p className="location-menu__error">{error}</p>}

      {tab === 'map' && (
        <div className="location-menu__map">
          <LocationPicker />
        </div>
      )}

      <div className="location-menu__summary">
        <div>
          <strong>{location.label}</strong>
          <span className="location-menu__source"> — {sourceLabel[locationSource]}</span>
        </div>
        <div className="location-menu__bortle">
          Bortle {bortle.bortle} · {t.locationMenu.limitingMagnitude} ~{bortle.limitingMagnitude.toFixed(1)}
        </div>
      </div>

      <p className="location-menu__note">{t.locationMenu.lightPollutionNote}</p>

      <button type="button" className="location-menu__close" onClick={onClose}>
        {t.locationMenu.close}
      </button>
    </div>
  );
}
