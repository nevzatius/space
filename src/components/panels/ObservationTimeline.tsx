import { DateTime } from 'luxon';
import { useAstroState } from '../../hooks/useAstroState';
import { useAppStore } from '../../state/appStore';
import { getBodyName } from '../../lib/bodyNamesTr';
import './Observation.css';

export function ObservationTimeline() {
  const { observationPlan: plan } = useAstroState();
  const language = useAppStore((s) => s.language);
  const zone = useAppStore((s) => s.timeZone);
  const date = useAppStore((s) => s.dateTimeUtc);
  const tr = language === 'tr';
  const duration = plan.end - plan.start;
  const time = (ms: number) => DateTime.fromMillis(ms, { zone }).toFormat('HH:mm');
  const rows = [
    { name: tr ? 'Karanlık' : 'Darkness', windows: plan.darkness, color: '#8490c8' },
    { name: tr ? 'Ay ufukta' : 'Moon up', windows: plan.moonUp, color: '#d5cdb2' },
    ...plan.targets.filter((target) => target.body !== 'Moon').map((target) => ({ name: getBodyName(target.body, language), windows: target.windows, color: '#79b4ac' })),
  ];
  return <details className="observation-timeline">
    <summary>{tr ? 'Gözlem zaman çizelgesi' : 'Observation timeline'}</summary>
    <p className="observation-note">{DateTime.fromMillis(plan.start, { zone }).setLocale(language).toFormat('dd LLL')} → {DateTime.fromMillis(plan.end, { zone }).setLocale(language).toFormat('dd LLL')} · {tr ? 'Aralığa tıkla, o saate git.' : 'Click a window to jump to that time.'}</p>
    <div className="observation-axis"><span /> <div>{[0, .25, .5, .75, 1].map((fraction) => <span key={fraction}>{time(plan.start + fraction * duration)}</span>)}</div></div>
    {rows.map((row) => <div className="observation-row" key={row.name}>
      <span>{row.name}</span><div className="observation-lane">
        {row.windows.map((window) => <button type="button" key={window.start}
          aria-label={`${row.name}: ${time(window.start)}–${time(window.end)}`}
          title={`${row.name}: ${time(window.start)}–${time(window.end)}`}
          style={{ left: `${(window.start - plan.start) / duration * 100}%`, width: `${(window.end - window.start) / duration * 100}%`, background: row.color }}
          onClick={() => useAppStore.getState().setDateTimeUtc(new Date((window.start + window.end) / 2))} />)}
        {date.getTime() >= plan.start && date.getTime() < plan.end && <i style={{ left: `${(date.getTime() - plan.start) / duration * 100}%` }} />}
        {!row.windows.length && <small>—</small>}
      </div>
    </div>)}
    <p className="observation-note">{tr ? 'Karanlık: Güneş −18° altında. Gezegenler: Güneş −6° altında, yükseklik ≥10°, yerel parlaklık sınırı. Aralıklar yaklaşık (15 dk).' : 'Darkness: Sun below −18°. Planets: Sun below −6°, elevation ≥10°, local magnitude limit. Approximate windows (15 min).'}</p>
  </details>;
}
