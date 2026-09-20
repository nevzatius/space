import { DateTime } from 'luxon';
import { useAppStore } from '../../state/appStore';
import { useAstroState } from '../../hooks/useAstroState';
import './Timeline.css';

const NIGHT_COLOR = '#0b0f19';
const DAY_COLOR = '#2c3a63';
const TWILIGHT_PAD = 1.4;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function Timeline() {
  const date = useAppStore((s) => s.dateTimeUtc);
  const zone = useAppStore((s) => s.timeZone);
  const language = useAppStore((s) => s.language);
  const playing = useAppStore((s) => s.playing);
  const rate = useAppStore((s) => s.playbackRate);
  const live = useAppStore((s) => s.useLiveNow);
  const setDate = useAppStore((s) => s.setDateTimeUtc);
  const setPlaying = useAppStore((s) => s.setPlaying);
  const setRate = useAppStore((s) => s.setPlaybackRate);
  const setLive = useAppStore((s) => s.setUseLiveNow);
  const { riseSet } = useAstroState();
  const tr = language === 'tr';
  const local = DateTime.fromJSDate(date).setZone(zone).setLocale(language);
  const start = local.startOf('day');
  const end = start.plus({ days: 1 });
  const duration = end.toMillis() - start.toMillis();
  const offset = date.getTime() - start.toMillis();
  const seek = (milliseconds: number) => setDate(new Date(milliseconds));
  const label = (turkish: string, english: string) => tr ? turkish : english;

  const sun = riseSet.find((r) => r.body === 'Sun');
  const fracOf = (t: Date | null | undefined) =>
    t ? clamp01((t.getTime() - start.toMillis()) / duration) : null;
  const riseFrac = fracOf(sun?.riseTime);
  const setFrac = fracOf(sun?.setTime);
  const dayNightGradient = buildDayNightGradient(riseFrac, setFrac, sun?.transitAltitude ?? null);

  return (
    <section className="timeline" aria-label={label('Zaman kontrolü', 'Time controls')}>
      <div className="timeline__header">
        <div className="timeline__title">
          <span className={`timeline__indicator ${live ? 'is-live' : playing ? 'is-active' : ''}`} />
          {label('ZAMAN AKIŞI', 'TIME FLOW')}
          <span className={`timeline__status ${live ? 'is-live' : playing ? 'is-playing' : ''}`}>
            {live ? label('Canlı', 'Live') : playing ? label('Oynatılıyor', 'Playing') : label('Duraklatıldı', 'Paused')}
          </span>
        </div>
        <time dateTime={date.toISOString()}>{local.toFormat('dd LLL yyyy · HH:mm:ss')} <small>{zone}</small></time>
      </div>

      <div className="timeline__track">
        <div className="timeline__rangewrap">
          <input
            type="range" min={0} max={Math.max(0, duration - 1000)} step={1000} value={offset}
            aria-label={label('Günün saatini değiştir', 'Change time of day')}
            aria-valuetext={local.toFormat('HH:mm:ss')}
            onChange={(event) => seek(start.toMillis() + Number(event.target.value))}
            style={{ background: dayNightGradient }}
          />
          <div className="timeline__markers" aria-hidden="true">
            {riseFrac !== null && (
              <span
                className="timeline__mark timeline__mark--rise"
                style={{ left: `${riseFrac * 100}%` }}
                title={`${label('Gün doğumu', 'Sunrise')} · ${DateTime.fromJSDate(sun!.riseTime!).setZone(zone).toFormat('HH:mm')}`}
              />
            )}
            {setFrac !== null && (
              <span
                className="timeline__mark timeline__mark--set"
                style={{ left: `${setFrac * 100}%` }}
                title={`${label('Gün batımı', 'Sunset')} · ${DateTime.fromJSDate(sun!.setTime!).setZone(zone).toFormat('HH:mm')}`}
              />
            )}
          </div>
        </div>
        <div className="timeline__ticks" aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => <span key={fraction}>
            {fraction === 1 ? '24:00' : start.plus({ milliseconds: duration * fraction }).toFormat('HH:mm')}
          </span>)}
        </div>
      </div>

      <div className="timeline__controls">
        <div className="timeline__group timeline__group--transport">
          <button type="button" onClick={() => seek(local.minus({ days: 1 }).toMillis())}
            aria-label={label('Önceki gün', 'Previous day')} title={label('Önceki gün', 'Previous day')}>−1{tr ? 'g' : 'd'}</button>
          <button type="button" aria-pressed={rate < 0} onClick={() => setRate(-rate)}
            title={label('Zaman yönünü değiştir', 'Reverse time')} aria-label={label('Zamanı geriye oynat', 'Play time backwards')}>↶</button>
          <button type="button" className="timeline__play" onClick={() => setPlaying(!playing)}
            aria-label={playing ? label('Duraklat', 'Pause') : label('Oynat', 'Play')}>
            {playing ? 'Ⅱ' : rate < 0 ? '◀' : '▶'}
          </button>
          <button type="button" onClick={() => seek(local.plus({ days: 1 }).toMillis())}
            aria-label={label('Sonraki gün', 'Next day')} title={label('Sonraki gün', 'Next day')}>+1{tr ? 'g' : 'd'}</button>
        </div>
        <div className="timeline__group timeline__group--speed">
          <label className="timeline__speed">
            {label('Hız', 'Speed')}
            <select value={Math.abs(rate)} onChange={(event) => setRate(Number(event.target.value) * Math.sign(rate))}>
              {[60, 300, 600, 1800, 3600].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
            </select>
          </label>
          <span className="timeline__hint">{rate < 0 ? '← ' : ''}{label('1 sn', '1 sec')} = {Math.abs(rate) / 60} {label('dk', 'min')}</span>
        </div>
        <button
          type="button"
          className={`timeline__now ${live ? 'is-live' : ''}`}
          disabled={live}
          onClick={() => setLive(true)}
          aria-label={live ? label('Şu anda canlı zamanı gösteriyor', 'Currently showing live time') : label('Şimdiye dön', 'Back to now')}
        >
          <span className="timeline__now-dot" />
          {live ? label('Canlı', 'Live') : label('Şimdiye dön', 'Back to now')}
        </button>
      </div>
    </section>
  );
}

function buildDayNightGradient(riseFrac: number | null, setFrac: number | null, transitAltitude: number | null): string {
  if (riseFrac === null && setFrac === null) {
    return transitAltitude !== null && transitAltitude > 0 ? DAY_COLOR : NIGHT_COLOR;
  }
  if (riseFrac !== null && setFrac !== null) {
    return riseFrac <= setFrac
      ? gradientStops([[0, NIGHT_COLOR], [riseFrac * 100, NIGHT_COLOR, DAY_COLOR], [setFrac * 100, DAY_COLOR, NIGHT_COLOR], [100, NIGHT_COLOR]])
      : gradientStops([[0, DAY_COLOR], [setFrac * 100, DAY_COLOR, NIGHT_COLOR], [riseFrac * 100, NIGHT_COLOR, DAY_COLOR], [100, DAY_COLOR]]);
  }
  const frac = (riseFrac ?? setFrac ?? 0) * 100;
  const [before, after] = riseFrac !== null ? [NIGHT_COLOR, DAY_COLOR] : [DAY_COLOR, NIGHT_COLOR];
  return gradientStops([[0, before], [frac, before, after], [100, after]]);
}

/** Builds a CSS linear-gradient from `[position, ...colors]` waypoints, feathering each transition by `TWILIGHT_PAD`. */
function gradientStops(waypoints: [number, ...string[]][]): string {
  const stops: string[] = [];
  waypoints.forEach(([pos, ...colors], i) => {
    if (colors.length === 1 || i === 0 || i === waypoints.length - 1) {
      colors.forEach((color) => stops.push(`${color} ${clampPct(pos)}%`));
    } else {
      stops.push(`${colors[0]} ${clampPct(pos - TWILIGHT_PAD)}%`);
      stops.push(`${colors[1]} ${clampPct(pos + TWILIGHT_PAD)}%`);
    }
  });
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

const clampPct = (value: number) => Math.min(100, Math.max(0, value));
