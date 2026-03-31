import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decodeTrip, decodeAllTrips } from '../components/share/ShareCodec';
import { useItineraryStore } from '../store/useItineraryStore';
import { formatDate, formatDateLong, formatTime, getDayNumber } from '../utils/dates';
import WeatherBadge from '../components/weather/WeatherBadge';
import type { Trip } from '../types/itinerary';

const CATEGORY_ICONS: Record<string, string> = {
  flight: '✈️', transport: '🚗', hotel: '🏨', restaurant: '🍽️',
  activity: '🎯', sightseeing: '📸', shopping: '🛍️', other: '📌',
};

function SingleTripView({ trip }: { trip: Trip }) {
  const navigate = useNavigate();
  const importTrip = useItineraryStore((s) => s.importTrip);

  const handleSave = () => {
    importTrip(trip);
    navigate(`/trip/${trip.id}`);
  };

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold truncate">{trip.name}</h1>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Save to My Trips
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {formatDate(trip.startDate)} — {formatDate(trip.endDate)} · Shared itinerary
        </p>
      </header>

      <div className="p-4 space-y-4">
        {trip.days.map((day) => (
          <div key={day.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Day {getDayNumber(trip.startDate, day.date)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateLong(day.date)}</p>
              </div>
              {day.weather && <WeatherBadge weather={day.weather} compact />}
            </div>
            {day.activities.length === 0 ? (
              <p className="p-3 text-xs text-slate-400">No activities</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {day.activities.map((activity) => (
                  <div key={activity.id} className="p-3 flex items-start gap-3">
                    <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      activity.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {activity.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{CATEGORY_ICONS[activity.category]}</span>
                        <span className={`text-sm font-medium ${activity.completed ? 'line-through text-slate-400' : ''}`}>
                          {activity.title}
                        </span>
                      </div>
                      {(activity.startTime || activity.location) && (
                        <div className="text-xs text-slate-500 mt-0.5 flex gap-2">
                          {activity.startTime && <span>🕐 {formatTime(activity.startTime)}</span>}
                          {activity.location && <span>📍 {activity.location.name}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SyncView({ trips }: { trips: Trip[] }) {
  const navigate = useNavigate();
  const mergeTrips = useItineraryStore((s) => s.mergeTrips);
  const [merged, setMerged] = useState(false);
  const [result, setResult] = useState<{ added: number; updated: number } | null>(null);

  const handleSync = () => {
    const res = mergeTrips(trips);
    setResult(res);
    setMerged(true);
  };

  const totalActivities = trips.reduce((sum, t) => sum + t.days.reduce((ds, d) => ds + d.activities.length, 0), 0);

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Sync Trips</h1>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-blue-600 dark:text-blue-400"
          >
            My Trips
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {trips.length} trip{trips.length !== 1 ? 's' : ''} · {totalActivities} activities
        </p>
      </header>

      <div className="p-4 space-y-4">
        {merged && result ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">Sync Complete</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {result.added} trip{result.added !== 1 ? 's' : ''} added, {result.updated} updated
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-3 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              View My Trips
            </button>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Someone shared their trip data with you. Review the trips below and tap "Sync to This Device" to merge them with your existing trips.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Existing trips with the same ID will be updated if the incoming version is newer.
              </p>
            </div>

            {trips.map((trip) => (
              <div key={trip.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{trip.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                    </p>
                  </div>
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    {trip.days.reduce((sum, d) => sum + d.activities.length, 0)} activities
                  </span>
                </div>
                {trip.location && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">📍 {trip.location.name}</p>
                )}
              </div>
            ))}

            <button
              onClick={handleSync}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              Sync to This Device
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SharedTripPage() {
  const [searchParams] = useSearchParams();

  const mode = searchParams.get('mode');
  const data = searchParams.get('d');

  const syncTrips = useMemo(() => {
    if (mode !== 'sync' || !data) return null;
    return decodeAllTrips(data);
  }, [mode, data]);

  const singleTrip = useMemo(() => {
    if (mode === 'sync' || !data) return null;
    return decodeTrip(data);
  }, [mode, data]);

  if (mode === 'sync' && syncTrips && syncTrips.length > 0) {
    return <SyncView trips={syncTrips} />;
  }

  if (singleTrip) {
    return <SingleTripView trip={singleTrip} />;
  }

  return (
    <div className="p-8 text-center">
      <div className="text-6xl mb-4">🔗</div>
      <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Invalid Share Link</h2>
      <p className="text-sm text-slate-500 mt-2">This link doesn't contain valid trip data.</p>
      <button onClick={() => window.location.hash = '/'} className="mt-4 text-blue-600 underline text-sm">
        Go to my trips
      </button>
    </div>
  );
}
