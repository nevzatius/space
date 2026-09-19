import { useAppStore } from '../../state/appStore';
import { useCelestialEvents } from '../../hooks/useCelestialEvents';
import { formatLocalDateTime } from '../../lib/timezone';
import './UpcomingEventsPopup.css';

export function UpcomingEventsPopup({ onClose }: { onClose: () => void }) {
  const timeZone = useAppStore((s) => s.timeZone);
  const { events, loading } = useCelestialEvents(true);

  return (
    <div className="upcoming-events">
      <h3>Yaklaşan Gökyüzü Olayları</h3>

      {loading && <p className="upcoming-events__status">Hesaplanıyor…</p>}
      {!loading && events.length === 0 && <p className="upcoming-events__status">Yakın zamanda dikkat çekici bir olay yok.</p>}

      {!loading && events.length > 0 && (
        <ul className="upcoming-events__list">
          {events.map((event) => (
            <li key={event.id}>
              <span className="upcoming-events__icon">{event.icon}</span>
              <div className="upcoming-events__body">
                <div className="upcoming-events__title">{event.title}</div>
                <div className="upcoming-events__date">{formatLocalDateTime(event.date, timeZone)}</div>
                {event.detail && <div className="upcoming-events__detail">{event.detail}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="upcoming-events__close" onClick={onClose}>
        Kapat
      </button>
    </div>
  );
}
