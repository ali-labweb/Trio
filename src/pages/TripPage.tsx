import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import DayTab from '../components/trip/DayTab';
import ActivityCard from '../components/activity/ActivityCard';
import ActivityForm from '../components/activity/ActivityForm';
// TravelSegment info is now shown inline in ActivityCard
import DayMap from '../components/map/DayMap';
import WeatherCard from '../components/weather/WeatherCard';
import ShareButton from '../components/share/ShareButton';
import { useItineraryStore } from '../store/useItineraryStore';
import { useSettingsStore, formatDist } from '../store/useSettingsStore';
import { fetchWeather } from '../services/weather';
import { fetchRoute } from '../services/routing';
import { formatDateLong, toISODate } from '../utils/dates';
import type { Activity, Day } from '../types/itinerary';

/** Compute now/next highlight for today's activities */
function computeHighlights(activities: Activity[], isToday: boolean): Map<string, 'now' | 'next'> {
  const map = new Map<string, 'now' | 'next'>();
  if (!isToday) return map;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let foundNow = false;
  const sorted = [...activities]
    .filter((a) => !a.completed && a.startTime)
    .sort((a, b) => a.startTime!.localeCompare(b.startTime!));

  for (const act of sorted) {
    const [h, m] = act.startTime!.split(':').map(Number);
    const startMin = h * 60 + m;
    let endMin = startMin + 60; // default 1hr
    if (act.endTime) {
      const [eh, em] = act.endTime.split(':').map(Number);
      endMin = eh * 60 + em;
    }

    if (currentMinutes >= startMin && currentMinutes < endMin) {
      map.set(act.id, 'now');
      foundNow = true;
    } else if (currentMinutes < startMin && !map.has(act.id)) {
      map.set(act.id, foundNow ? 'next' : 'next');
      break; // only mark the first upcoming
    }
  }

  // If no "now" found, find the first upcoming
  if (!foundNow && map.size === 0) {
    for (const act of sorted) {
      const [h, m] = act.startTime!.split(':').map(Number);
      if (h * 60 + m > currentMinutes) {
        map.set(act.id, 'next');
        break;
      }
    }
  }

  return map;
}

/** Sub-component: Day activities list with collapsible completed + travel segments */
function DayActivities({
  selectedDay,
  today,
  useMiles,
  showForm,
  tripId,
  selectedDayId,
  toggleComplete,
  onEdit,
  onDelete,
}: {
  selectedDay: Day;
  today: string;
  useMiles: boolean;
  showForm: boolean;
  tripId: string;
  selectedDayId: string;
  toggleComplete: (tripId: string, dayId: string, activityId: string) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
}) {
  const isToday = selectedDay.date === today;
  const sorted = useMemo(
    () =>
      [...selectedDay.activities].sort((a, b) => {
        if (!a.startTime && !b.startTime) return 0;
        if (!a.startTime) return -1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      }),
    [selectedDay.activities]
  );

  const completed = sorted.filter((a) => a.completed);
  const upcoming = sorted.filter((a) => !a.completed);
  const highlights = useMemo(() => computeHighlights(sorted, isToday), [sorted, isToday]);

  if (selectedDay.activities.length === 0 && !showForm) {
    return (
      <div className="px-4 pb-4">
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">No activities for this day</p>
        </div>
      </div>
    );
  }

  const renderActivity = (activity: Activity, idx: number, arr: Activity[]) => (
    <div key={activity.id}>
      {/* Travel segment between cards */}
      {activity.travelFromPrevious && (
        <div className="flex items-center gap-2 pl-[76px] py-1.5">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {activity.travelFromPrevious.mode === 'walking' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H18.75a1.125 1.125 0 0 0 1.125-1.125V11.25" />
            )}
          </svg>
          <span className="text-xs text-slate-400">
            {activity.travelFromPrevious.durationMinutes} min · {formatDist(activity.travelFromPrevious.distanceKm, useMiles)}
          </span>
        </div>
      )}
      <ActivityCard
        activity={activity}
        isLast={idx === arr.length - 1}
        highlight={highlights.get(activity.id)}
        onToggle={() => toggleComplete(tripId, selectedDayId, activity.id)}
        onEdit={() => onEdit(activity)}
        onDelete={() => onDelete(activity.id)}
      />
    </div>
  );

  return (
    <div className="px-4 space-y-1 pb-4">
      {/* Collapsible completed section */}
      {completed.length > 0 && upcoming.length > 0 && (
        <details className="mb-2">
          <summary className="text-xs text-slate-400 dark:text-slate-500 cursor-pointer py-2 flex items-center gap-1.5 select-none">
            <span className="text-green-500">✓</span>
            <span>{completed.length} completed</span>
          </summary>
          <div className="opacity-50">
            {completed.map((act, idx) => renderActivity(act, idx, completed))}
          </div>
        </details>
      )}

      {/* If all completed (nothing upcoming), show them all normally */}
      {upcoming.length === 0 && completed.length > 0 && (
        completed.map((act, idx) => renderActivity(act, idx, completed))
      )}

      {/* Upcoming activities */}
      {upcoming.map((act, idx) => renderActivity(act, idx, upcoming))}
    </div>
  );
}

export default function TripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const trips = useItineraryStore((s) => s.trips);
  const addActivity = useItineraryStore((s) => s.addActivity);
  const updateActivity = useItineraryStore((s) => s.updateActivity);
  const removeActivity = useItineraryStore((s) => s.removeActivity);
  const toggleComplete = useItineraryStore((s) => s.toggleComplete);
  const updateDayWeather = useItineraryStore((s) => s.updateDayWeather);
  const updateActivityTravel = useItineraryStore((s) => s.updateActivityTravel);

  const useMiles = useSettingsStore((s) => s.useMiles);

  const trip = trips.find((t) => t.id === tripId);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();
  const today = toISODate(new Date());

  useEffect(() => {
    if (trip && !selectedDayId) {
      // Select today's day if in range, otherwise first day
      const today = new Date().toISOString().split('T')[0];
      const todayDay = trip.days.find((d) => d.date === today);
      setSelectedDayId(todayDay?.id || trip.days[0]?.id || '');
    }
  }, [trip, selectedDayId]);

  const selectedDay = trip?.days.find((d) => d.id === selectedDayId);

  // Fetch weather for selected day — use trip location (hotel) as fallback
  const loadWeather = useCallback(async () => {
    if (!trip || !selectedDay) return;
    // Skip if weather was fetched recently (6 hours)
    if (selectedDay.weather) {
      const fetchedAt = new Date(selectedDay.weather.fetchedAt).getTime();
      if (Date.now() - fetchedAt < 6 * 60 * 60 * 1000) return;
    }
    // Find location: first try activity with location, then fall back to trip location
    const locActivity = selectedDay.activities.find((a) => a.location);
    const loc = locActivity?.location || trip.location;
    if (!loc) return;
    const weather = await fetchWeather(loc.lat, loc.lng, selectedDay.date);
    if (weather) {
      weather.locationName = trip.hotelName || loc.name;
      updateDayWeather(trip.id, selectedDay.id, weather);
    }
  }, [trip, selectedDay, updateDayWeather]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  // Batch-fetch weather for all days using trip location
  useEffect(() => {
    if (!trip?.location) return;
    const loc = trip.location;
    trip.days.forEach((day) => {
      if (day.weather) return; // already fetched
      fetchWeather(loc.lat, loc.lng, day.date).then((w) => {
        if (w) {
          w.locationName = trip.hotelName || loc.name;
          updateDayWeather(trip.id, day.id, w);
        }
      });
    });
  }, [trip?.id, trip?.location, trip?.days.length, updateDayWeather]);

  // Fetch travel times between consecutive activities
  const loadRoutes = useCallback(async () => {
    if (!trip || !selectedDay) return;
    const acts = selectedDay.activities;
    for (let i = 1; i < acts.length; i++) {
      const prev = acts[i - 1];
      const curr = acts[i];
      if (prev.location && curr.location && !curr.travelFromPrevious) {
        const route = await fetchRoute(
          prev.location.lat, prev.location.lng,
          curr.location.lat, curr.location.lng
        );
        if (route) {
          updateActivityTravel(trip.id, selectedDay.id, curr.id, route);
        }
      }
    }
  }, [trip, selectedDay, updateActivityTravel]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  if (!trip) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Trip not found</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">
          Go back
        </button>
      </div>
    );
  }

  const handleAddActivity = (data: Omit<Activity, 'id' | 'completed'>) => {
    addActivity(trip.id, selectedDayId, { ...data, completed: false });
    setShowForm(false);
  };

  const handleUpdateActivity = (data: Omit<Activity, 'id' | 'completed'>) => {
    if (!editingActivity) return;
    updateActivity(trip.id, selectedDayId, editingActivity.id, data);
    setEditingActivity(undefined);
    setShowForm(false);
  };

  const handleDeleteActivity = (activityId: string) => {
    if (confirm('Delete this activity?')) {
      removeActivity(trip.id, selectedDayId, activityId);
    }
  };

  const totalActivities = trip.days.reduce((s, d) => s + d.activities.length, 0);
  const completedActivities = trip.days.reduce((s, d) => s + d.activities.filter((a) => a.completed).length, 0);

  return (
    <div>
      <Header
        title={trip.name}
        showBack
        rightAction={<ShareButton trip={trip} />}
      />

      {/* Trip location info */}
      {(trip.location || trip.hotelName) && (
        <div className="px-4 pt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          {trip.hotelName && <span className="font-medium">{trip.hotelName}</span>}
          {trip.hotelName && trip.location && <span>·</span>}
          {trip.location && <span>{trip.location.name}{trip.location.address ? `, ${trip.location.address}` : ''}</span>}
        </div>
      )}

      {/* Progress */}
      {totalActivities > 0 && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Trip Progress</span>
            <span>{completedActivities}/{totalActivities} done</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Day tabs */}
      <div className="pt-3 pb-2">
        <DayTab
          days={trip.days}
          selectedDayId={selectedDayId}
          tripStartDate={trip.startDate}
          onSelect={setSelectedDayId}
        />
      </div>

      {selectedDay && (
        <>
          {/* Day header */}
          <div className="px-4 pb-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {formatDateLong(selectedDay.date)}
            </p>
            {selectedDay.label && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{selectedDay.label}</p>
            )}
          </div>

          {/* Day progress dots */}
          {selectedDay.activities.length > 0 && (
            <div className="px-4 pb-2 flex items-center gap-2">
              <div className="flex gap-1">
                {selectedDay.activities.map((a) => (
                  <div
                    key={a.id}
                    className={`w-2 h-2 rounded-full ${a.completed ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400">
                {selectedDay.activities.filter((a) => a.completed).length}/{selectedDay.activities.length} done
              </span>
            </div>
          )}

          {/* Weather card */}
          {selectedDay.weather && (
            <div className="px-4 pb-3">
              <WeatherCard weather={selectedDay.weather} />
            </div>
          )}

          {/* Map */}
          <DayMap activities={selectedDay.activities} tripLocation={trip.location} hotelName={trip.hotelName} />

          {/* Activities timeline */}
          <DayActivities
            selectedDay={selectedDay}
            today={today}
            useMiles={useMiles}
            showForm={showForm}
            tripId={trip.id}
            selectedDayId={selectedDayId}
            toggleComplete={toggleComplete}
            onEdit={(activity) => {
              setEditingActivity(activity);
              setShowForm(true);
            }}
            onDelete={handleDeleteActivity}
          />

          {/* Add activity button */}
          {!showForm && (
            <div className="fixed bottom-20 right-4 z-30">
              <button
                onClick={() => {
                  setEditingActivity(undefined);
                  setShowForm(true);
                }}
                className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                aria-label="Add activity"
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}

          {/* Activity form modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
              <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold">{editingActivity ? 'Edit Activity' : 'Add Activity'}</h3>
                </div>
                <ActivityForm
                  initial={editingActivity}
                  onSave={editingActivity ? handleUpdateActivity : handleAddActivity}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingActivity(undefined);
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
