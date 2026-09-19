import { useAppStore } from '../../state/appStore';
import { combineToUtcDate, splitFromUtcDate } from '../../lib/timezone';
import { useTranslation } from '../../i18n/useTranslation';
import './DateTimePicker.css';

export function DateTimePicker() {
  const { t } = useTranslation();
  const dateTimeUtc = useAppStore((s) => s.dateTimeUtc);
  const timeZone = useAppStore((s) => s.timeZone);
  const useLiveNow = useAppStore((s) => s.useLiveNow);
  const setDateTimeUtc = useAppStore((s) => s.setDateTimeUtc);
  const setUseLiveNow = useAppStore((s) => s.setUseLiveNow);
  const setTimeZone = useAppStore((s) => s.setTimeZone);

  const { isoDate, timeStr } = splitFromUtcDate(dateTimeUtc, timeZone);

  function onDateChange(newDate: string) {
    setDateTimeUtc(combineToUtcDate(newDate, timeStr, timeZone));
  }

  function onTimeChange(newTime: string) {
    setDateTimeUtc(combineToUtcDate(isoDate, newTime, timeZone));
  }

  return (
    <div className="datetime-picker">
      <label className="datetime-picker__live">
        <input type="checkbox" checked={useLiveNow} onChange={(e) => setUseLiveNow(e.target.checked)} />
        {t.dateTime.liveNow}
      </label>
      <div className="datetime-picker__row">
        <input type="date" value={isoDate} disabled={useLiveNow} onChange={(e) => onDateChange(e.target.value)} />
        <input type="time" value={timeStr} disabled={useLiveNow} onChange={(e) => onTimeChange(e.target.value)} />
      </div>
      <div className="datetime-picker__tz">
        <label>
          {t.dateTime.timeZone}
          <input type="text" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} />
        </label>
      </div>
    </div>
  );
}
