import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from '../../i18n/useTranslation';
import { LocationSearchBox } from './LocationSearchBox';
import './LocationPicker.css';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function ClickHandler() {
  const setLocation = useAppStore((s) => s.setLocation);
  useMapEvents({
    click(e) {
      setLocation({
        lat: Math.round(e.latlng.lat * 10000) / 10000,
        lon: Math.round(e.latlng.lng * 10000) / 10000,
        label: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
      });
    },
  });
  return null;
}

function RecenterOnLocation({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom(), { duration: 0.5 });
  }, [lat, lon, map]);
  return null;
}

export function LocationPicker() {
  const location = useAppStore((s) => s.location);
  const { t } = useTranslation();

  return (
    <div className="location-picker">
      <LocationSearchBox />
      <div className="location-picker__map">
        <MapContainer center={[location.lat, location.lon]} zoom={5} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ${t.locationPicker.attribution}`}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler />
          <RecenterOnLocation lat={location.lat} lon={location.lon} />
          <Marker position={[location.lat, location.lon]} />
        </MapContainer>
      </div>
      <p className="location-picker__hint">
        {t.locationPicker.hint} <strong>{location.label}</strong>
      </p>
    </div>
  );
}
