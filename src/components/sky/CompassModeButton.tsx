import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import './CompassModeButton.css';

export function CompassModeButton({
  supported,
  active,
  requesting,
  disabled,
  error,
  onEnable,
  onDisable,
}: {
  supported: boolean;
  active: boolean;
  requesting: boolean;
  disabled: boolean;
  error: string | null;
  onEnable: () => void;
  onDisable: () => void;
}) {
  const { t } = useTranslation();
  // Only phones/tablets have orientation sensors worth offering this for;
  // desktops with a mouse would just see the button do nothing.
  const isTouch = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);

  if (!supported || !isTouch) return null;

  return (
    <div className="compass-mode">
      <button
        type="button"
        className="compass-mode__btn"
        disabled={disabled || requesting}
        onClick={() => (active ? onDisable() : onEnable())}
      >
        {active ? `✕ ${t.compassMode.disable}` : requesting ? t.compassMode.requesting : `🧭 ${t.compassMode.enable}`}
      </button>
      {error && <p className="compass-mode__error">{error}</p>}
    </div>
  );
}
