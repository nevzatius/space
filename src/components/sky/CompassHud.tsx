import { azimuthToCompass } from '../../lib/coords';
import { useTranslation } from '../../i18n/useTranslation';
import './CompassHud.css';

const TICKS = Array.from({ length: 24 }, (_, i) => i * 15);

const CARDINALS_TR: Array<{ deg: number; label: string; major?: boolean }> = [
  { deg: 0, label: 'K', major: true },
  { deg: 45, label: 'KD' },
  { deg: 90, label: 'D', major: true },
  { deg: 135, label: 'GD' },
  { deg: 180, label: 'G', major: true },
  { deg: 225, label: 'GB' },
  { deg: 270, label: 'B', major: true },
  { deg: 315, label: 'KB' },
];

const CARDINALS_EN: Array<{ deg: number; label: string; major?: boolean }> = [
  { deg: 0, label: 'N', major: true },
  { deg: 45, label: 'NE' },
  { deg: 90, label: 'E', major: true },
  { deg: 135, label: 'SE' },
  { deg: 180, label: 'S', major: true },
  { deg: 225, label: 'SW' },
  { deg: 270, label: 'W', major: true },
  { deg: 315, label: 'NW' },
];

/**
 * HUD compass rose overlaid on the sky viewer. The ring carries the fixed
 * cardinal directions and rotates opposite the camera heading, while the
 * pointer stays fixed at top-center — so the pointer always shows exactly
 * which way the camera is currently looking.
 */
export function CompassHud({ headingDeg }: { headingDeg: number }) {
  const { language } = useTranslation();
  const point = azimuthToCompass(headingDeg, language);
  const northLabel = language === 'tr' ? 'K' : 'N';
  const CARDINALS = language === 'tr' ? CARDINALS_TR : CARDINALS_EN;

  return (
    <div className="compass-hud" aria-hidden>
      <div className="compass-hud__stage">
        <div className="compass-hud__pointer" />
        <div className="compass-hud__ring" style={{ transform: `rotate(${-headingDeg}deg)` }}>
          {TICKS.map((deg) => (
            <span
              key={deg}
              className={`compass-hud__tick${deg % 90 === 0 ? ' compass-hud__tick--major' : ''}`}
              style={{ transform: `rotate(${deg}deg) translateY(-46px)` }}
            />
          ))}
          {CARDINALS.map(({ deg, label, major }) => (
            <span
              key={label}
              className={`compass-hud__label${major ? ' compass-hud__label--major' : ''}${label === northLabel ? ' compass-hud__label--north' : ''}`}
              style={{ transform: `rotate(${deg}deg) translateY(-35px) rotate(${headingDeg - deg}deg)` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="compass-hud__readout">
        <span className="compass-hud__readout-deg">{Math.round(headingDeg).toString().padStart(3, '0')}°</span>
        <span className="compass-hud__readout-point">{point}</span>
      </div>
    </div>
  );
}
