import { useAstroState } from '../../hooks/useAstroState';
import { useAppStore } from '../../state/appStore';
import { azimuthToCompassTr } from '../../lib/coords';
import './ConstellationsPanel.css';

export function ConstellationsPanel() {
  const { visibleConstellations, lightPollution } = useAstroState();
  const selectedConstellation = useAppStore((s) => s.selectedConstellation);
  const setSelectedConstellation = useAppStore((s) => s.setSelectedConstellation);

  return (
    <div className="constellations-panel">
      <h3>Şu an görünen takımyıldızlar</h3>
      <p className="constellations-panel__subtitle">
        Bortle {lightPollution.bortle} ışık kirliliğinde, ~{lightPollution.limitingMagnitude.toFixed(1)} kadre kadar çıplak gözle
        görülebilecekler
      </p>
      {visibleConstellations.length === 0 && (
        <p className="constellations-panel__empty">Şu an ufkun üzerinde belirgin bir takımyıldız yok.</p>
      )}
      <ul className="constellations-panel__list">
        {visibleConstellations.map((c) => (
          <li key={c.code}>
            <button
              type="button"
              className={c.code === selectedConstellation ? 'is-selected' : ''}
              onClick={() => setSelectedConstellation(c.code === selectedConstellation ? null : c.code)}
            >
              <strong>{c.nameTr}</strong>
              <span className="constellations-panel__dir">
                {' '}
                — {azimuthToCompassTr(c.averageAzimuth)}, {Math.round(c.averageAltitude)}° yükseklik
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
