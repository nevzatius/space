import { useAstroState } from '../../hooks/useAstroState';
import { useAppStore } from '../../state/appStore';
import { BODY_NAME_TR } from '../../lib/bodyNamesTr';
import { azimuthToCompassTr } from '../../lib/coords';
import { formatLocalTime } from '../../lib/timezone';
import './BodyEventsPanel.css';

export function BodyEventsPanel() {
  const { riseSet, recommendedBodies } = useAstroState();
  const timeZone = useAppStore((s) => s.timeZone);
  const recommendedBodyNames = new Set(recommendedBodies.map((b) => b.body));

  return (
    <div className="body-events">
      <h3>Doğuş / Batış</h3>
      <table className="body-events__table">
        <thead>
          <tr>
            <th>Cisim</th>
            <th>Doğuş</th>
            <th>Batış</th>
            <th>Tepe noktası</th>
          </tr>
        </thead>
        <tbody>
          {riseSet.map((r) => (
            <tr key={r.body}>
              <td>
                {BODY_NAME_TR[r.body]}
                {recommendedBodyNames.has(r.body) && (
                  <span className="body-events__visible-badge" title="Şu an bu ışık kirliliğinde görünür">
                    {' '}
                    👁
                  </span>
                )}
              </td>
              <td>
                {formatLocalTime(r.riseTime, timeZone)}
                {r.riseAzimuth !== null && <span className="body-events__dir"> ({azimuthToCompassTr(r.riseAzimuth)})</span>}
              </td>
              <td>
                {formatLocalTime(r.setTime, timeZone)}
                {r.setAzimuth !== null && <span className="body-events__dir"> ({azimuthToCompassTr(r.setAzimuth)})</span>}
              </td>
              <td>{formatLocalTime(r.transitTime, timeZone)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
