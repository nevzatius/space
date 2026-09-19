import { useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { getBortleClass } from '../../lib/lightPollution';
import { LocationMenu } from '../menu/LocationMenu';
import { UpcomingEventsPopup } from '../panels/UpcomingEventsPopup';
import './Header.css';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const location = useAppStore((s) => s.location);
  const bortle = getBortleClass(location.lat, location.lon);

  return (
    <header className="app-header">
      <div className="app-header__title">
        <h1>Gece Gökyüzü Simülatörü</h1>
        <p>Konum ve tarih/saat seçerek gökyüzünü keşfedin.</p>
      </div>
      <div className="app-header__location">
        <button type="button" className="app-header__location-toggle" onClick={() => setMenuOpen((v) => !v)}>
          📍 {location.label} <span className="app-header__bortle">Bortle {bortle.bortle}</span>
        </button>
        {menuOpen && <LocationMenu onClose={() => setMenuOpen(false)} />}
      </div>
      <div className="app-header__events">
        <button type="button" className="app-header__location-toggle" onClick={() => setEventsOpen((v) => !v)}>
          🔔 Yaklaşan Olaylar
        </button>
        {eventsOpen && <UpcomingEventsPopup onClose={() => setEventsOpen(false)} />}
      </div>
    </header>
  );
}
