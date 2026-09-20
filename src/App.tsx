import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { ResponsiveLayout } from './components/layout/ResponsiveLayout';
import { DateTimePicker } from './components/datetime/DateTimePicker';
import { MoonPhaseWidget } from './components/panels/MoonPhaseWidget';
import { BodyEventsPanel } from './components/panels/BodyEventsPanel';
import { ConstellationsPanel } from './components/panels/ConstellationsPanel';
import { SatellitesPanel } from './components/panels/SatellitesPanel';
import { SkyViewer } from './components/sky/SkyViewer';
import { useNow } from './hooks/useNow';
import { AstroProvider } from './hooks/useAstroState';
import { Timeline } from './components/datetime/Timeline';
import { ObservationPanel } from './components/panels/ObservationPanel';
import { ZodiacPanel } from './components/panels/ZodiacPanel';
import { useTranslation } from './i18n/useTranslation';
import './App.css';

function App() {
  useNow();
  const { t, language } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.header.title;
  }, [language, t]);

  return (
    <AstroProvider><div className="app-shell">
      <Header />
      <ResponsiveLayout
        sidebar={
          <>
            <div className="card">
              <DateTimePicker />
            </div>
            <div className="card">
              <MoonPhaseWidget />
            </div>
            <div className="card">
              <BodyEventsPanel />
            </div>
            <div className="card"><ObservationPanel /></div>
            <div className="card"><ZodiacPanel /></div>
            <div className="card">
              <ConstellationsPanel />
            </div>
            <div className="card">
              <SatellitesPanel />
            </div>
          </>
        }
        main={<div className="sky-stage"><SkyViewer /><Timeline /></div>}
      />
    </div></AstroProvider>
  );
}

export default App;
