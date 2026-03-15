import { useNavigate } from 'react-router-dom';
import type { Trip } from '../../types/itinerary';
import { formatDate } from '../../utils/dates';

interface TripCardProps {
  trip: Trip;
  onDelete: () => void;
}

export default function TripCard({ trip, onDelete }: TripCardProps) {
  const navigate = useNavigate();
  const totalActivities = trip.days.reduce((sum, d) => sum + d.activities.length, 0);
  const completedActivities = trip.days.reduce(
    (sum, d) => sum + d.activities.filter((a) => a.completed).length,
    0
  );
  const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

  return (
    <button
      onClick={() => navigate(`/trip/${trip.id}`)}
      className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200 truncate">
            {trip.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {trip.days.length} days · {totalActivities} activities
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
          aria-label="Delete trip"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      {totalActivities > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {completedActivities}/{totalActivities} completed
          </p>
        </div>
      )}
    </button>
  );
}
