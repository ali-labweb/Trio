import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useItineraryStore } from '../store/useItineraryStore';
import { formatTime } from '../utils/dates';

const CATEGORY_ICONS: Record<string, string> = {
  flight: '✈️', transport: '🚗', hotel: '🏨', restaurant: '🍽️',
  activity: '🎯', sightseeing: '📸', shopping: '🛍️', other: '📌',
};

export default function TodayPage() {
  const trips = useItineraryStore((s) => s.trips);
  const toggleComplete = useItineraryStore((s) => s.toggleComplete);
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const todayItems = useMemo(() => {
    const items: { tripId: string; tripName: string; dayId: string; activities: typeof trips[0]['days'][0]['activities'] }[] = [];
    for (const trip of trips) {
      for (const day of trip.days) {
        if (day.date === today && day.activities.length > 0) {
          items.push({
            tripId: trip.id,
            tripName: trip.name,
            dayId: day.id,
            activities: day.activities,
          });
        }
      }
    }
    return items;
  }, [trips, today]);

  return (
    <div>
      <Header title="Today" />
      <div className="p-4">
        {todayItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏖️</div>
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Nothing planned today</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Enjoy your free day or add activities to a trip
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayItems.map((item) => (
              <div key={item.tripId + item.dayId}>
                <button
                  onClick={() => navigate(`/trip/${item.tripId}`)}
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 hover:underline"
                >
                  {item.tripName} →
                </button>
                <div className="space-y-2">
                  {item.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <button
                        onClick={() => toggleComplete(item.tripId, item.dayId, activity.id)}
                        className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${
                          activity.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {activity.completed && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{CATEGORY_ICONS[activity.category]}</span>
                          <span className={`text-sm font-medium truncate ${activity.completed ? 'line-through text-slate-400' : ''}`}>
                            {activity.title}
                          </span>
                        </div>
                        {activity.startTime && (
                          <span className="text-xs text-slate-500">🕐 {formatTime(activity.startTime)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
