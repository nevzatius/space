import { useAstroState } from '../../hooks/useAstroState';
import { useSatellites } from '../../hooks/useSatellites';
import { useAppStore } from '../../state/appStore';
import { azimuthToCompass } from '../../lib/coords';
import { useTranslation } from '../../i18n/useTranslation';
import './SatellitesPanel.css';

export function SatellitesPanel() {
  const { bodyPositions } = useAstroState();
  const sunAltitude = bodyPositions.find((b) => b.body === 'Sun')?.altitude ?? -90;
  const { positions, catalogState } = useSatellites(sunAltitude);
  const showSatellites = useAppStore((s) => s.showSatellites);
  const setShowSatellites = useAppStore((s) => s.setShowSatellites);
  const { t, language } = useTranslation();

  const sourceLabel: Record<string, string> = {
    network: t.satellites.sourceNetwork,
    cache: t.satellites.sourceCache,
    'stale-cache': t.satellites.sourceStaleCache,
    fallback: t.satellites.sourceFallback,
  };

  const visible = positions.filter((p) => p.currentlyVisible).sort((a, b) => b.altitude - a.altitude);

  return (
    <div className="satellites-panel">
      <div className="satellites-panel__header">
        <h3>{t.satellites.title}</h3>
        <label className="satellites-panel__toggle">
          <input type="checkbox" checked={showSatellites} onChange={(e) => setShowSatellites(e.target.checked)} />
          {t.satellites.show}
        </label>
      </div>

      {catalogState.status === 'loading' && <p className="satellites-panel__status">{t.satellites.loading}</p>}
      {catalogState.status === 'error' && (
        <p className="satellites-panel__status satellites-panel__status--error">{t.satellites.error}</p>
      )}
      {catalogState.status === 'ready' && (
        <p className="satellites-panel__status">
          {t.satellites.tracking(catalogState.count, sourceLabel[catalogState.source])}
        </p>
      )}

      {catalogState.status === 'ready' && visible.length === 0 && (
        <p className="satellites-panel__empty">{t.satellites.empty}</p>
      )}

      <ul className="satellites-panel__list">
        {visible.map((s) => (
          <li key={s.noradId}>
            <span className="satellites-panel__visible-badge" title={t.satellites.visibleNow}>
              👁
            </span>
            <strong>{s.name}</strong>
            <span className="satellites-panel__dir">
              {' '}
              — {azimuthToCompass(s.azimuth, language)}, {Math.round(s.altitude)}° {t.satellites.altitude}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
