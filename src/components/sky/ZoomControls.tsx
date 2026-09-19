import './ZoomControls.css';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export function ZoomControls({ onZoomIn, onZoomOut, canZoomIn, canZoomOut }: ZoomControlsProps) {
  return (
    <div className="zoom-controls">
      <button
        type="button"
        className="zoom-controls__btn"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        aria-label="Yakınlaştır"
      >
        +
      </button>
      <button
        type="button"
        className="zoom-controls__btn"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        aria-label="Uzaklaştır"
      >
        &minus;
      </button>
    </div>
  );
}
