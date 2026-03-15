import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '../components/layout/Header';
import { useItineraryStore } from '../store/useItineraryStore';
import { getCategoryStyle } from '../utils/categoryStyles';
import type { Activity } from '../types/itinerary';

function createCategoryIcon(category: Activity['category'], num: number) {
  const style = getCategoryStyle(category);
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${style.color};color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${num}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, positions]);
  return null;
}

export default function MapPage() {
  const trips = useItineraryStore((s) => s.trips);
  const [viewMode, setViewMode] = useState<'today' | 'full'>('today');

  const today = new Date().toISOString().split('T')[0];

  // Find current/most recent trip
  const activeTrip = useMemo(() => {
    return trips.find((t) => t.startDate <= today && t.endDate >= today)
      || trips.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      || null;
  }, [trips, today]);

  const activities = useMemo(() => {
    if (!activeTrip) return [];
    if (viewMode === 'today') {
      const todayDay = activeTrip.days.find((d) => d.date === today);
      return todayDay?.activities.filter((a) => a.location) || [];
    }
    return activeTrip.days.flatMap((d) => d.activities.filter((a) => a.location));
  }, [activeTrip, viewMode, today]);

  const positions: [number, number][] = activities.map((a) => [a.location!.lat, a.location!.lng]);
  const routeLines: [number, number][][] = activities
    .filter((a) => a.travelFromPrevious?.routeGeometry)
    .map((a) => a.travelFromPrevious!.routeGeometry!);

  const center: [number, number] = positions[0] || [20, 0];

  return (
    <div>
      <Header title={activeTrip?.name || 'Map'} />

      {/* View toggle */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={() => setViewMode('today')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            viewMode === 'today'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          Today's Route
        </button>
        <button
          onClick={() => setViewMode('full')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            viewMode === 'full'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          Full Trip
        </button>
      </div>

      {/* Map */}
      <div className="px-4 pb-4">
        {activities.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {activeTrip
                ? 'No locations added yet. Add locations to activities to see them on the map.'
                : 'No trips yet. Create a trip to see your route.'}
            </p>
          </div>
        ) : (
          <div className="h-[calc(100vh-220px)] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
            <MapContainer center={center} zoom={12} className="h-full w-full" zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds positions={positions} />
              {activities.map((activity, i) => (
                <Marker
                  key={activity.id}
                  position={[activity.location!.lat, activity.location!.lng]}
                  icon={createCategoryIcon(activity.category, i + 1)}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>{activity.title}</strong>
                      <br />
                      📍 {activity.location!.name}
                      {activity.startTime && <><br />🕐 {activity.startTime}</>}
                    </div>
                  </Popup>
                </Marker>
              ))}
              {routeLines.map((coords, i) => (
                <Polyline key={i} positions={coords} color="#f97316" weight={4} opacity={0.8} />
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}
