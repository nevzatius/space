import { DateTime } from 'luxon';
import { useAstroState } from '../../hooks/useAstroState';
import { useAppStore } from '../../state/appStore';
import { getBodyName } from '../../lib/bodyNamesTr';
import { azimuthToCompass } from '../../lib/coords';
import './Observation.css';

export function ObservationPanel() {
  const { observationPlan: plan } = useAstroState();
  const language = useAppStore((s) => s.language);
  const zone = useAppStore((s) => s.timeZone);
  const tr = language === 'tr';
  const night = DateTime.fromMillis(plan.start, { zone }).setLocale(language);
  return <section className="observation-panel">
    <h3>{tr ? 'Bu gece ne izlemeli?' : 'What to watch tonight?'}</h3>
    <p className="observation-note">{night.toFormat('dd LLL')} → {night.plus({ days: 1 }).toFormat('dd LLL')} · {tr ? 'Seçili konum ve tarih' : 'Selected location and date'}</p>
    {plan.targets.length === 0 && <p>{tr ? 'Bu gece ölçütlere uyan Ay veya gezegen yok.' : 'No Moon or planets meet the criteria for this night.'}</p>}
    <ul className="observation-list">{plan.targets.slice(0, 4).map((target) => <li key={target.body}>
      <div><strong>{getBodyName(target.body, language)}</strong><span className="observation-score">{target.score}/100</span></div>
      <p>{DateTime.fromMillis(target.bestTime, { zone }).toFormat('HH:mm')} · {Math.round(target.altitude)}° · {azimuthToCompass(target.azimuth, language)}</p>
      <small>{tr ? 'Ufuktan yüksekliği, karanlık ve parlaklığına göre.' : 'Based on elevation, darkness and brightness.'}</small>
      <button type="button" onClick={() => {
        useAppStore.getState().setDateTimeUtc(new Date(target.bestTime));
        useAppStore.getState().focusObject(target.altitude, target.azimuth);
      }}>{tr ? 'Bu saatte gökyüzünde bul' : 'Find in sky at this time'} ↗</button>
    </li>)}</ul>
    <p className="observation-note">{tr ? '15 dk örneklemeli tahmin. Bulutlar ve yerel engeller hesaba katılmaz.' : 'Estimated at 15 min intervals. Clouds and local obstructions are not included.'}</p>
  </section>;
}
