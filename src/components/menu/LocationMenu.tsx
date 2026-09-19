import { useMemo, useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { getBortleClass } from '../../lib/lightPollution';
import { detectDeviceLocation, detectIpLocation } from '../../lib/geoDetect';
import { LocationPicker } from '../map/LocationPicker';
import './LocationMenu.css';

type Tab = 'device' | 'ip' | 'map';

const SOURCE_LABEL: Record<string, string> = {
  gps: 'Cihaz konumu',
  ip: 'İnternet konumu (yaklaşık)',
  manual: 'Elle seçildi',
};

export function LocationMenu({ onClose }: { onClose: () => void }) {
  const location = useAppStore((s) => s.location);
  const locationSource = useAppStore((s) => s.locationSource);
  const setLocation = useAppStore((s) => s.setLocation);
  const [tab, setTab] = useState<Tab>('map');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bortle = useMemo(() => getBortleClass(location.lat, location.lon), [location.lat, location.lon]);

  async function handleAuto(kind: 'device' | 'ip') {
    setTab(kind);
    setBusy(true);
    setError(null);
    try {
      const result = await (kind === 'device' ? detectDeviceLocation() : detectIpLocation());
      setLocation(result, kind === 'device' ? 'gps' : 'ip');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konum tespit edilemedi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="location-menu">
      <div className="location-menu__tabs">
        <button type="button" className={tab === 'device' ? 'is-active' : ''} onClick={() => handleAuto('device')}>
          📍 Cihaz Konumu
        </button>
        <button type="button" className={tab === 'ip' ? 'is-active' : ''} onClick={() => handleAuto('ip')}>
          🌐 İnternet Konumu
        </button>
        <button type="button" className={tab === 'map' ? 'is-active' : ''} onClick={() => setTab('map')}>
          🗺️ Harita / Arama
        </button>
      </div>

      {busy && <p className="location-menu__status">Konum tespit ediliyor…</p>}
      {error && <p className="location-menu__error">{error}</p>}

      {tab === 'map' && (
        <div className="location-menu__map">
          <LocationPicker />
        </div>
      )}

      <div className="location-menu__summary">
        <div>
          <strong>{location.label}</strong>
          <span className="location-menu__source"> — {SOURCE_LABEL[locationSource]}</span>
        </div>
        <div className="location-menu__bortle">
          Bortle {bortle.bortle} · sınır kadir ~{bortle.limitingMagnitude.toFixed(1)}
        </div>
      </div>

      <p className="location-menu__note">
        Işık kirliliği tahmini, yakındaki yerleşim yerlerinin nüfusuna dayalı kaba bir yaklaşımdır; gerçek ölçüm verisi değildir.
      </p>

      <button type="button" className="location-menu__close" onClick={onClose}>
        Kapat
      </button>
    </div>
  );
}
