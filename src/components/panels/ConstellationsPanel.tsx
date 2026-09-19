import { useAstroState } from '../../hooks/useAstroState';
import { useAppStore } from '../../state/appStore';
import { azimuthToCompass } from '../../lib/coords';
import { useTranslation } from '../../i18n/useTranslation';
import './ConstellationsPanel.css';

export function ConstellationsPanel() {
  const { visibleConstellations, lightPollution } = useAstroState();
  const selectedConstellation = useAppStore((s) => s.selectedConstellation);
  const setSelectedConstellation = useAppStore((s) => s.setSelectedConstellation);
  const { t, language } = useTranslation();

  return (
    <div className="constellations-panel">
      <h3>{t.constellations.title}</h3>
      <p className="constellations-panel__subtitle">
        {t.constellations.subtitle(lightPollution.bortle, lightPollution.limitingMagnitude.toFixed(1))}
      </p>
      {visibleConstellations.length === 0 && <p className="constellations-panel__empty">{t.constellations.empty}</p>}
      <ul className="constellations-panel__list">
        {visibleConstellations.map((c) => (
          <li key={c.code}>
            <button
              type="button"
              className={c.code === selectedConstellation ? 'is-selected' : ''}
              onClick={() => setSelectedConstellation(c.code === selectedConstellation ? null : c.code)}
            >
              <strong>{language === 'tr' ? c.nameTr : c.nameLatin}</strong>
              <span className="constellations-panel__dir">
                {' '}
                — {azimuthToCompass(c.averageAzimuth, language)}, {Math.round(c.averageAltitude)}° {t.constellations.altitude}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
