import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Activity, Location } from '../../types/itinerary';

// Fix default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createNumberedIcon(num: number) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:#3b82f6;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [map, positions]);
  return null;
}

interface DayMapProps {
  activities: Activity[];
  tripLocation?: Location;
  hotelName?: string;
}

export default function DayMap({ activities, tripLocation, hotelName }: DayMapProps) {
  const [expanded, setExpanded] = useState(false);
  const locatedActivities = activities.filter((a) => a.location);

  const hasTripFallback = locatedActivities.length === 0 && tripLocation;
  if (locatedActivities.length === 0 && !tripLocation) return null;

  const positions: [number, number][] = locatedActivities.length > 0
    ? locatedActivities.map((a) => [a.location!.lat, a.location!.lng])
    : [[tripLocation!.lat, tripLocation!.lng]];
  const center = positions[0];

  // Collect route geometries
  const routeLines: [number, number][][] = [];
  for (const act of activities) {
    if (act.travelFromPrevious?.routeGeometry) {
      routeLines.push(act.travelFromPrevious.routeGeometry);
    }
  }

  return (
    <div className="px-4 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-400 mb-2"
      >
        <span>🗺️ Map ({locatedActivities.length || 1} {locatedActivities.length === 0 ? 'location' : 'locations'})</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <MapContainer center={center} zoom={12} className="h-full w-full" zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds positions={positions} />
            {hasTripFallback && tripLocation && (
              <Marker
                position={[tripLocation.lat, tripLocation.lng]}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: `<div style="background:#f97316;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">📍</div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{hotelName || tripLocation.name}</strong>
                    {tripLocation.address && <><br />{tripLocation.address}</>}
                  </div>
                </Popup>
              </Marker>
            )}
            {locatedActivities.map((activity, i) => (
              <Marker
                key={activity.id}
                position={[activity.location!.lat, activity.location!.lng]}
                icon={createNumberedIcon(i + 1)}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{activity.title}</strong>
                    <br />
                    📍 {activity.location!.name}
                  </div>
                </Popup>
              </Marker>
            ))}
            {routeLines.map((coords, i) => (
              <Polyline key={i} positions={coords} color="#3b82f6" weight={3} opacity={0.7} />
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
