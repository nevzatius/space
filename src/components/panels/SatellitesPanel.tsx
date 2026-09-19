import { useAstroState } from '../../hooks/useAstroState';
import { useSatellites } from '../../hooks/useSatellites';
import { useAppStore } from '../../state/appStore';
import { azimuthToCompassTr } from '../../lib/coords';
import './SatellitesPanel.css';

const SOURCE_LABEL_TR: Record<string, string> = {
  network: 'canlı veri',
  cache: 'önbellek',
  'stale-cache': 'eski önbellek (yenilenemedi)',
  fallback: 'yedek veri (çevrimdışı)',
};

export function SatellitesPanel() {
  const { bodyPositions } = useAstroState();
  const sunAltitude = bodyPositions.find((b) => b.body === 'Sun')?.altitude ?? -90;
  const { positions, catalogState } = useSatellites(sunAltitude);
  const showSatellites = useAppStore((s) => s.showSatellites);
  const setShowSatellites = useAppStore((s) => s.setShowSatellites);

  const visible = positions.filter((p) => p.currentlyVisible).sort((a, b) => b.altitude - a.altitude);

  return (
    <div className="satellites-panel">
      <div className="satellites-panel__header">
        <h3>Uydular</h3>
        <label className="satellites-panel__toggle">
          <input type="checkbox" checked={showSatellites} onChange={(e) => setShowSatellites(e.target.checked)} />
          Göster
        </label>
      </div>

      {catalogState.status === 'loading' && <p className="satellites-panel__status">Uydu verisi yükleniyor…</p>}
      {catalogState.status === 'error' && (
        <p className="satellites-panel__status satellites-panel__status--error">Uydu verisi yüklenemedi.</p>
      )}
      {catalogState.status === 'ready' && (
        <p className="satellites-panel__status">
          {catalogState.count} uydu takip ediliyor ({SOURCE_LABEL_TR[catalogState.source]})
        </p>
      )}

      {catalogState.status === 'ready' && visible.length === 0 && (
        <p className="satellites-panel__empty">Şu an çıplak gözle görülebilecek bir uydu yok.</p>
      )}

      <ul className="satellites-panel__list">
        {visible.map((s) => (
          <li key={s.noradId}>
            <span className="satellites-panel__visible-badge" title="Şu an çıplak gözle görünür">
              👁
            </span>
            <strong>{s.name}</strong>
            <span className="satellites-panel__dir">
              {' '}
              — {azimuthToCompassTr(s.azimuth)}, {Math.round(s.altitude)}° yükseklik
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
