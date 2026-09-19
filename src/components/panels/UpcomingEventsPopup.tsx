import { useAppStore } from '../../state/appStore';
import { useCelestialEvents } from '../../hooks/useCelestialEvents';
import { formatLocalDateTime } from '../../lib/timezone';
import { useTranslation } from '../../i18n/useTranslation';
import './UpcomingEventsPopup.css';

export function UpcomingEventsPopup({ onClose }: { onClose: () => void }) {
  const timeZone = useAppStore((s) => s.timeZone);
  const { events, loading } = useCelestialEvents(true);
  const { t, language } = useTranslation();

  return (
    <div className="upcoming-events">
      <h3>{t.upcomingEvents.title}</h3>

      {loading && <p className="upcoming-events__status">{t.upcomingEvents.calculating}</p>}
      {!loading && events.length === 0 && <p className="upcoming-events__status">{t.upcomingEvents.empty}</p>}

      {!loading && events.length > 0 && (
        <ul className="upcoming-events__list">
          {events.map((event) => (
            <li key={event.id}>
              <span className="upcoming-events__icon">{event.icon}</span>
              <div className="upcoming-events__body">
                <div className="upcoming-events__title">{event.title}</div>
                <div className="upcoming-events__date">
                  {formatLocalDateTime(event.date, timeZone, language === 'tr' ? 'tr' : 'en')}
                </div>
                {event.detail && <div className="upcoming-events__detail">{event.detail}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="upcoming-events__close" onClick={onClose}>
        {t.upcomingEvents.close}
      </button>
    </div>
  );
}
