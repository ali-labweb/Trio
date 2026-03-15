import { useState } from 'react';
import type { Activity, ActivityCategory } from '../../types/itinerary';
import { geocodeLocation } from '../../services/geocoding';

const CATEGORIES: { value: ActivityCategory; label: string; icon: string }[] = [
  { value: 'flight', label: 'Flight', icon: '✈️' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'sightseeing', label: 'Sightseeing', icon: '📸' },
  { value: 'activity', label: 'Activity', icon: '🎯' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'other', label: 'Other', icon: '📌' },
];

interface ActivityFormProps {
  initial?: Activity;
  onSave: (data: Omit<Activity, 'id' | 'completed'>) => void;
  onCancel: () => void;
}

export default function ActivityForm({ initial, onSave, onCancel }: ActivityFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [startTime, setStartTime] = useState(initial?.startTime || '');
  const [endTime, setEndTime] = useState(initial?.endTime || '');
  const [category, setCategory] = useState<ActivityCategory>(initial?.category || 'activity');
  const [locationName, setLocationName] = useState(initial?.location?.name || '');
  const [location, setLocation] = useState(initial?.location || undefined);
  const [geocoding, setGeocoding] = useState(false);

  const handleLocationBlur = async () => {
    if (!locationName.trim() || locationName === location?.name) return;
    setGeocoding(true);
    const result = await geocodeLocation(locationName);
    if (result) setLocation(result);
    setGeocoding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      category,
      location: location || undefined,
      travelFromPrevious: initial?.travelFromPrevious,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Visit Eiffel Tower"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Category
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-colors ${
                category === cat.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Start time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            End time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Location
        </label>
        <div className="relative">
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            onBlur={handleLocationBlur}
            placeholder="e.g., Eiffel Tower, Paris"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {geocoding && (
            <span className="absolute right-3 top-3 text-xs text-slate-400">Locating...</span>
          )}
        </div>
        {location && (
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            📍 {location.name}{location.address ? `, ${location.address}` : ''} ({location.lat.toFixed(2)}, {location.lng.toFixed(2)})
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Notes
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details..."
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {initial ? 'Update' : 'Add Activity'}
        </button>
      </div>
    </form>
  );
}
