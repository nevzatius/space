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
  return (
    <div className="moon-approach">
      <button type="button" className="moon-approach__btn" disabled={disabled} onClick={onToggle}>
        {active ? '↩ Geri Dön' : '🌙 Aya Yaklaş'}
      </button>
    </div>
  );
}
