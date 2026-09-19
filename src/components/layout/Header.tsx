import { useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { getBortleClass } from '../../lib/lightPollution';
import { useTranslation } from '../../i18n/useTranslation';
import { LocationMenu } from '../menu/LocationMenu';
import { UpcomingEventsPopup } from '../panels/UpcomingEventsPopup';
import './Header.css';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const location = useAppStore((s) => s.location);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const { t } = useTranslation();
  const bortle = getBortleClass(location.lat, location.lon);

  return (
    <header className="app-header">
      <div className="app-header__title">
        <h1>{t.header.title}</h1>
        <p>{t.header.subtitle}</p>
      </div>
      <div className="app-header__location">
        <button type="button" className="app-header__location-toggle" onClick={() => setMenuOpen((v) => !v)}>
          📍 {location.label}{' '}
          <span className="app-header__bortle">
            {t.header.bortle} {bortle.bortle}
          </span>
        </button>
        {menuOpen && <LocationMenu onClose={() => setMenuOpen(false)} />}
      </div>
      <div className="app-header__events">
        <button type="button" className="app-header__location-toggle" onClick={() => setEventsOpen((v) => !v)}>
          🔔 {t.header.upcomingEvents}
        </button>
        {eventsOpen && <UpcomingEventsPopup onClose={() => setEventsOpen(false)} />}
      </div>
      <button
        type="button"
        className="app-header__lang-toggle"
        onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
        title={t.language.switchTo}
        aria-label={t.language.switchTo}
      >
        {language === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
      </button>
    </header>
  );
}
