import type { Activity } from '../../types/itinerary';
import { formatTime } from '../../utils/dates';
import { getCategoryStyle, CategoryIcon } from '../../utils/categoryStyles';

interface ActivityCardProps {
  activity: Activity;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isLast?: boolean;
}

export default function ActivityCard({ activity, onToggle, onEdit, onDelete, isLast = false }: ActivityCardProps) {
  const style = getCategoryStyle(activity.category);

  const duration = activity.startTime && activity.endTime
    ? (() => {
        const [sh, sm] = activity.startTime.split(':').map(Number);
        const [eh, em] = activity.endTime.split(':').map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins <= 0) return null;
        if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
        return `${mins} mins`;
      })()
    : null;

  return (
    <div className="flex gap-3">
      {/* Left: Time + timeline dot */}
      <div className="flex flex-col items-center w-16 flex-shrink-0 pt-1">
        {activity.startTime ? (
          <div className="text-right w-full">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formatTime(activity.startTime).split(' ')[0]}
            </span>
            <br />
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {formatTime(activity.startTime).split(' ')[1]}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>

      {/* Timeline line + dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-2"
          style={{ borderColor: style.dotColor, backgroundColor: activity.completed ? style.dotColor : 'transparent' }}
        />
        {!isLast && (
          <div className="w-0.5 flex-1 min-h-[40px]" style={{ backgroundColor: style.dotColor, opacity: 0.3 }} />
        )}
      </div>

      {/* Right: Activity card */}
      <div className={`flex-1 mb-3 ${isLast ? '' : ''}`}>
        <button
          onClick={onEdit}
          className={`w-full text-left rounded-2xl border p-3.5 transition-all ${
            activity.completed
              ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Category icon circle */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: activity.completed ? '#e2e8f0' : style.bg }}
            >
              <CategoryIcon category={activity.category} size={20} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-semibold ${
                activity.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-800 dark:text-slate-200'
              }`}>
                {activity.title}
              </h4>
              {(duration || activity.travelFromPrevious) && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {duration || (activity.travelFromPrevious && `${activity.travelFromPrevious.durationMinutes} min drive`)}
                </p>
              )}
              {activity.description && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                  {activity.description}
                </p>
              )}
              {activity.location && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  📍 {activity.location.name}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  activity.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
                }`}
              >
                {activity.completed && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
