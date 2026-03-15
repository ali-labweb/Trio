import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import TripCard from '../components/trip/TripCard';
import ImportModal from '../components/import/ImportModal';
import { useItineraryStore } from '../store/useItineraryStore';
import { useSettingsStore, formatTemp } from '../store/useSettingsStore';
import { fetchWeather, getWeatherEmoji } from '../services/weather';
import { geocodeLocation } from '../services/geocoding';
import { toISODate, formatDate } from '../utils/dates';
import type { WeatherInfo, Location } from '../types/itinerary';

// Generate a gradient based on trip name for the hero card
function tripGradient(name: string): string {
  const gradients = [
    'from-blue-600 via-blue-500 to-cyan-400',
    'from-orange-500 via-amber-500 to-yellow-400',
    'from-purple-600 via-violet-500 to-fuchsia-400',
    'from-emerald-600 via-teal-500 to-cyan-400',
    'from-rose-600 via-pink-500 to-fuchsia-400',
    'from-indigo-600 via-blue-500 to-sky-400',
    'from-amber-600 via-orange-500 to-red-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

export default function HomePage() {
  const trips = useItineraryStore((s) => s.trips);
  const addTrip = useItineraryStore((s) => s.addTrip);
  const deleteTrip = useItineraryStore((s) => s.deleteTrip);
  const useFahrenheit = useSettingsStore((s) => s.useFahrenheit);
  const navigate = useNavigate();

  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [endDate, setEndDate] = useState('');
  const [tripLocationName, setTripLocationName] = useState('');
  const [tripLocation, setTripLocation] = useState<Location | undefined>();
  const [hotelName, setHotelName] = useState('');
  const [geocodingTrip, setGeocodingTrip] = useState(false);
  const [heroWeather, setHeroWeather] = useState<WeatherInfo | null>(null);

  const today = toISODate(new Date());

  // Find active trip (dates overlap today) or most recent
  const activeTrip = useMemo(() => {
    return trips.find((t) => t.startDate <= today && t.endDate >= today) || null;
  }, [trips, today]);

  const otherTrips = useMemo(() => {
    return [...trips]
      .filter((t) => t.id !== activeTrip?.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [trips, activeTrip]);

  // Today's data for the active trip
  const todayDay = activeTrip?.days.find((d) => d.date === today);
  const todayStops = todayDay?.activities.length || 0;

  // Fetch weather for active trip's today — use trip location as fallback
  useEffect(() => {
    if (!activeTrip) return;
    if (todayDay?.weather) {
      setHeroWeather(todayDay.weather);
      return;
    }
    const locActivity = todayDay?.activities.find((a) => a.location);
    const loc = locActivity?.location || activeTrip.location;
    if (!loc) return;
    fetchWeather(loc.lat, loc.lng, today).then((w) => {
      if (w) {
        w.locationName = activeTrip.hotelName || loc.name;
        setHeroWeather(w);
      }
    });
  }, [todayDay, today, activeTrip]);

  const handleLocationBlur = async () => {
    if (!tripLocationName.trim() || tripLocationName === tripLocation?.name) return;
    setGeocodingTrip(true);
    const result = await geocodeLocation(tripLocationName);
    if (result) setTripLocation(result);
    setGeocodingTrip(false);
  };

  const handleCreate = () => {
    if (!tripName.trim() || !startDate || !endDate) return;
    const id = addTrip(tripName.trim(), startDate, endDate, tripLocation, hotelName.trim() || undefined);
    setShowCreate(false);
    setTripName('');
    setTripLocationName('');
    setTripLocation(undefined);
    setHotelName('');
    navigate(`/trip/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this trip?')) {
      deleteTrip(id);
    }
  };

  return (
    <div>
      <Header title="Travel Companion" />
      <div className="p-4 space-y-4">

        {/* Hero card for active trip */}
        {activeTrip && (
          <button
            onClick={() => navigate(`/trip/${activeTrip.id}`)}
            className="w-full text-left"
          >
            <div className={`relative rounded-2xl bg-gradient-to-br ${tripGradient(activeTrip.name)} p-5 pb-6 text-white overflow-hidden shadow-lg`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8" />
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-white/20 rounded-full px-3 py-1 mb-3">
                Current Trip
              </span>
              <h2 className="text-2xl font-bold leading-tight">{activeTrip.name}</h2>
              {(activeTrip.location || activeTrip.hotelName) && (
                <p className="text-sm text-white/80 mt-1 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  {activeTrip.hotelName || activeTrip.location?.name}
                </p>
              )}
              <p className="text-sm text-white/80 mt-1 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25" />
                </svg>
                {formatDate(activeTrip.startDate)} — {formatDate(activeTrip.endDate)}
              </p>
              {/* FAB */}
              <div className="absolute top-4 right-4">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreate(true);
                  }}
                  className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Info cards */}
        {activeTrip && (
          <div className="grid grid-cols-2 gap-3">
            {/* Weather card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {heroWeather ? getWeatherEmoji(heroWeather.conditionCode) : '🌤️'}
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  {heroWeather ? formatTemp(heroWeather.tempHighC, useFahrenheit) : '—'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {heroWeather?.conditionText || 'Weather unavailable'}
              </p>
            </div>

            {/* Stops card */}
            <button
              onClick={() => navigate(`/trip/${activeTrip.id}`)}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-200">{todayStops} Stops</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Today's schedule</p>
            </button>
          </div>
        )}

        {/* Map preview for active trip */}
        {activeTrip && todayDay && todayDay.activities.some((a) => a.location) && (
          <button
            onClick={() => navigate('/map')}
            className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Today's Route</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatDate(today)} — {todayDay.activities.filter((a) => a.location).length} locations
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Actions (show prominently if no active trip) */}
        {!activeTrip && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreate(true)}
              className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Trip
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="flex-1 py-3 rounded-xl border border-orange-500 text-orange-500 dark:text-orange-400 font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Import
            </button>
          </div>
        )}

        {/* Other trips / all trips */}
        {(activeTrip ? otherTrips : [...trips].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {activeTrip ? 'Other Trips' : 'Your Trips'}
              </h3>
              {activeTrip && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="text-xs text-orange-500 font-medium"
                  >
                    + New
                  </button>
                  <button
                    onClick={() => setShowImport(true)}
                    className="text-xs text-orange-500 font-medium"
                  >
                    Import
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {(activeTrip ? otherTrips : [...trips].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())).map((trip) => (
                <TripCard key={trip.id} trip={trip} onDelete={() => handleDelete(trip.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {trips.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No trips yet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Create a new trip or import an itinerary to get started
            </p>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-lg">Create New Trip</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trip Name</label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g., Hawaii Adventure 2026"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination</label>
              <div className="relative">
                <input
                  type="text"
                  value={tripLocationName}
                  onChange={(e) => setTripLocationName(e.target.value)}
                  onBlur={handleLocationBlur}
                  placeholder="e.g., Kona, Hawaii"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                />
                {geocodingTrip && (
                  <span className="absolute right-3 top-3 text-xs text-slate-400">Locating...</span>
                )}
              </div>
              {tripLocation && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  📍 {tripLocation.name}{tripLocation.address ? `, ${tripLocation.address}` : ''}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hotel / Accommodation</label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="e.g., Four Seasons Resort Hualalai"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!tripName.trim() || !startDate || !endDate}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
