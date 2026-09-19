import { useAstroState } from '../../hooks/useAstroState';
import { useAppStore } from '../../state/appStore';
import { getBodyName } from '../../lib/bodyNamesTr';
import { azimuthToCompass } from '../../lib/coords';
import { formatLocalTime } from '../../lib/timezone';
import { useTranslation } from '../../i18n/useTranslation';
import './BodyEventsPanel.css';

export function BodyEventsPanel() {
  const { riseSet, recommendedBodies } = useAstroState();
  const timeZone = useAppStore((s) => s.timeZone);
  const { t, language } = useTranslation();
  const recommendedBodyNames = new Set(recommendedBodies.map((b) => b.body));

  return (
    <div className="body-events">
      <h3>{t.bodyEvents.title}</h3>
      <table className="body-events__table">
        <thead>
          <tr>
            <th>{t.bodyEvents.body}</th>
            <th>{t.bodyEvents.rise}</th>
            <th>{t.bodyEvents.set}</th>
            <th>{t.bodyEvents.transit}</th>
          </tr>
        </thead>
        <tbody>
          {riseSet.map((r) => (
            <tr key={r.body}>
              <td>
                {getBodyName(r.body, language)}
                {recommendedBodyNames.has(r.body) && (
                  <span className="body-events__visible-badge" title={t.bodyEvents.visibleNow}>
                    {' '}
                    👁
                  </span>
                )}
              </td>
              <td>
                {formatLocalTime(r.riseTime, timeZone)}
                {r.riseAzimuth !== null && (
                  <span className="body-events__dir"> ({azimuthToCompass(r.riseAzimuth, language)})</span>
                )}
              </td>
              <td>
                {formatLocalTime(r.setTime, timeZone)}
                {r.setAzimuth !== null && (
                  <span className="body-events__dir"> ({azimuthToCompass(r.setAzimuth, language)})</span>
                )}
              </td>
              <td>{formatLocalTime(r.transitTime, timeZone)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
