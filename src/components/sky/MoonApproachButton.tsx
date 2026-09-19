import { useTranslation } from '../../i18n/useTranslation';
import './MoonApproachButton.css';

export function MoonApproachButton({
  active,
  disabled,
  onToggle,
}: {
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="moon-approach">
      <button type="button" className="moon-approach__btn" disabled={disabled} onClick={onToggle}>
        {active ? `↩ ${t.moonApproach.back}` : `🌙 ${t.moonApproach.approach}`}
      </button>
    </div>
  );
}
