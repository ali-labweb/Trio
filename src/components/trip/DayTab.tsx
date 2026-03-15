import type { Day } from '../../types/itinerary';
import { formatDate, getDayNumber } from '../../utils/dates';
import WeatherBadge from '../weather/WeatherBadge';

interface DayTabProps {
  days: Day[];
  selectedDayId: string;
  tripStartDate: string;
  onSelect: (dayId: string) => void;
}

export default function DayTab({ days, selectedDayId, tripStartDate, onSelect }: DayTabProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
      {days.map((day) => {
        const active = day.id === selectedDayId;
        const dayNum = getDayNumber(tripStartDate, day.date);
        const completed = day.activities.filter((a) => a.completed).length;
        const total = day.activities.length;

        return (
          <button
            key={day.id}
            onClick={() => onSelect(day.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl border transition-colors min-w-[72px] ${
              active
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-xs font-medium">Day {dayNum}</span>
            <span className="text-[10px]">{formatDate(day.date)}</span>
            {day.weather && <WeatherBadge weather={day.weather} compact />}
            {total > 0 && (
              <span className="text-[10px] text-slate-400">
                {completed}/{total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
