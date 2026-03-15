import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decodeTrip } from '../components/share/ShareCodec';
import { useItineraryStore } from '../store/useItineraryStore';
import { formatDate, formatDateLong, formatTime, getDayNumber } from '../utils/dates';
import WeatherBadge from '../components/weather/WeatherBadge';
import type { Trip } from '../types/itinerary';

const CATEGORY_ICONS: Record<string, string> = {
  flight: '✈️', transport: '🚗', hotel: '🏨', restaurant: '🍽️',
  activity: '🎯', sightseeing: '📸', shopping: '🛍️', other: '📌',
};

export default function SharedTripPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const importTrip = useItineraryStore((s) => s.importTrip);

  const trip: Trip | null = useMemo(() => {
    const data = searchParams.get('d');
    if (!data) return null;
    return decodeTrip(data);
  }, [searchParams]);

  if (!trip) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🔗</div>
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Invalid Share Link</h2>
        <p className="text-sm text-slate-500 mt-2">This link doesn't contain valid trip data.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline text-sm">
          Go to my trips
        </button>
      </div>
    );
  }

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
