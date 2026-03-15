import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import DayTab from '../components/trip/DayTab';
import ActivityCard from '../components/activity/ActivityCard';
import ActivityForm from '../components/activity/ActivityForm';
// TravelSegment info is now shown inline in ActivityCard
import DayMap from '../components/map/DayMap';
import WeatherBadge from '../components/weather/WeatherBadge';
import ShareButton from '../components/share/ShareButton';
import { useItineraryStore } from '../store/useItineraryStore';
import { fetchWeather } from '../services/weather';
import { fetchRoute } from '../services/routing';
import { formatDateLong } from '../utils/dates';
import type { Activity } from '../types/itinerary';

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

  const trip = trips.find((t) => t.id === tripId);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();

  useEffect(() => {
    if (trip && !selectedDayId) {
      // Select today's day if in range, otherwise first day
      const today = new Date().toISOString().split('T')[0];
      const todayDay = trip.days.find((d) => d.date === today);
      setSelectedDayId(todayDay?.id || trip.days[0]?.id || '');
    }
  }, [trip, selectedDayId]);

  const selectedDay = trip?.days.find((d) => d.id === selectedDayId);

  // Fetch weather for selected day
  const loadWeather = useCallback(async () => {
    if (!trip || !selectedDay) return;
    // Skip if weather was fetched recently (6 hours)
    if (selectedDay.weather) {
      const fetchedAt = new Date(selectedDay.weather.fetchedAt).getTime();
      if (Date.now() - fetchedAt < 6 * 60 * 60 * 1000) return;
    }
    // Find first activity with location
    const locActivity = selectedDay.activities.find((a) => a.location);
    if (!locActivity?.location) return;
    const weather = await fetchWeather(locActivity.location.lat, locActivity.location.lng, selectedDay.date);
    if (weather) {
      weather.locationName = locActivity.location.name;
      updateDayWeather(trip.id, selectedDay.id, weather);
    }
  }, [trip, selectedDay, updateDayWeather]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

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
          {/* Day header with weather */}
          <div className="px-4 pb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {formatDateLong(selectedDay.date)}
              </p>
              {selectedDay.label && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedDay.label}</p>
              )}
            </div>
            {selectedDay.weather && <WeatherBadge weather={selectedDay.weather} />}
          </div>

          {/* Map */}
          <DayMap activities={selectedDay.activities} />

          {/* Activities timeline */}
          <div className="px-4 space-y-1 pb-4">
            {selectedDay.activities.length === 0 && !showForm ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No activities for this day
                </p>
              </div>
            ) : (
              [...selectedDay.activities]
                .sort((a, b) => {
                  // Activities with no time go to the top
                  if (!a.startTime && !b.startTime) return 0;
                  if (!a.startTime) return -1;
                  if (!b.startTime) return -1;
                  return a.startTime.localeCompare(b.startTime);
                })
                .map((activity, idx, sorted) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isLast={idx === sorted.length - 1}
                  onToggle={() => toggleComplete(trip.id, selectedDayId, activity.id)}
                  onEdit={() => {
                    setEditingActivity(activity);
                    setShowForm(true);
                  }}
                  onDelete={() => handleDeleteActivity(activity.id)}
                />
              ))
            )}
          </div>

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
