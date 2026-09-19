import { useAstroState } from '../../hooks/useAstroState';
import { buildMoonIconPath } from '../../lib/moonIcon';
import { useTranslation } from '../../i18n/useTranslation';
import './MoonPhaseWidget.css';

export function MoonPhaseWidget() {
  const { moonPhase } = useAstroState();
  const { t, language } = useTranslation();
  const path = buildMoonIconPath(moonPhase.illumination, moonPhase.waxing);

  return (
    <div className="moon-phase-widget">
      <svg viewBox="0 0 100 100" width={64} height={64} className="moon-phase-widget__icon">
        <circle cx={50} cy={50} r={50} fill="#171a24" />
        <path d={path} fill="#f2ecd8" />
        <circle cx={50} cy={50} r={49} fill="none" stroke="#3a3f4d" strokeWidth={1} />
      </svg>
      <div className="moon-phase-widget__info">
        <strong>{language === 'tr' ? moonPhase.nameTr : moonPhase.nameEn}</strong>
        <span>
          {language === 'tr'
            ? `%${Math.round(moonPhase.illumination * 100)} ${t.moonPhase.illumination}`
            : `${Math.round(moonPhase.illumination * 100)}% ${t.moonPhase.illumination}`}
        </span>
      </div>
    </div>
  );
}
