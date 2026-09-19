import { Header } from './components/layout/Header';
import { ResponsiveLayout } from './components/layout/ResponsiveLayout';
import { DateTimePicker } from './components/datetime/DateTimePicker';
import { MoonPhaseWidget } from './components/panels/MoonPhaseWidget';
import { BodyEventsPanel } from './components/panels/BodyEventsPanel';
import { ConstellationsPanel } from './components/panels/ConstellationsPanel';
import { SatellitesPanel } from './components/panels/SatellitesPanel';
import { SkyViewer } from './components/sky/SkyViewer';
import { useNow } from './hooks/useNow';
import './App.css';

function App() {
  useNow();

  return (
    <div className="app-shell">
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
            <div className="card">
              <ConstellationsPanel />
            </div>
            <div className="card">
              <SatellitesPanel />
            </div>
          </>
        }
        main={<SkyViewer />}
      />
    </div>
  );
}

export default App;
