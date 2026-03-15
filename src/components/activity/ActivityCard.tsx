import type { Activity } from '../../types/itinerary';
import { formatTime } from '../../utils/dates';

const CATEGORY_ICONS: Record<string, string> = {
  flight: '✈️',
  transport: '🚗',
  hotel: '🏨',
  restaurant: '🍽️',
  activity: '🎯',
  sightseeing: '📸',
  shopping: '🛍️',
  other: '📌',
};

interface ActivityCardProps {
  activity: Activity;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ActivityCard({ activity, onToggle, onEdit, onDelete }: ActivityCardProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all ${
        activity.completed ? 'opacity-60' : ''
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`mt-0.5 w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          activity.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
        }`}
        aria-label={activity.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {activity.completed && (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <button onClick={onEdit} className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{CATEGORY_ICONS[activity.category] || '📌'}</span>
          <span
            className={`font-medium text-sm truncate ${
              activity.completed ? 'activity-done' : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {activity.title}
          </span>
        </div>
        {(activity.startTime || activity.location) && (
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
            {activity.startTime && (
              <span>
                🕐 {formatTime(activity.startTime)}
                {activity.endTime && ` - ${formatTime(activity.endTime)}`}
              </span>
            )}
            {activity.location && <span className="truncate">📍 {activity.location.name}</span>}
          </div>
        )}
        {activity.description && (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 line-clamp-2">
            {activity.description}
          </p>
        )}
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
        aria-label="Delete activity"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
