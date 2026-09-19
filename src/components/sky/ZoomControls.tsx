import { useTranslation } from '../../i18n/useTranslation';
import './ZoomControls.css';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export function ZoomControls({ onZoomIn, onZoomOut, canZoomIn, canZoomOut }: ZoomControlsProps) {
  const { t } = useTranslation();
  return (
    <div className="zoom-controls">
      <button
        type="button"
        className="zoom-controls__btn"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        aria-label={t.zoom.zoomIn}
      >
        +
      </button>
      <button
        type="button"
        className="zoom-controls__btn"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        aria-label={t.zoom.zoomOut}
      >
        &minus;
      </button>
    </div>
  );
}
