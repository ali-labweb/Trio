import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trip, Activity, Day } from '../types/itinerary';
import { generateId } from '../utils/id';
import { getDaysBetween } from '../utils/dates';

interface ItineraryState {
  trips: Trip[];
  addTrip: (name: string, startDate: string, endDate: string) => string;
  importTrip: (trip: Trip) => void;
  updateTrip: (id: string, updates: Partial<Pick<Trip, 'name' | 'startDate' | 'endDate'>>) => void;
  deleteTrip: (id: string) => void;
  addActivity: (tripId: string, dayId: string, activity: Omit<Activity, 'id'>) => void;
  updateActivity: (tripId: string, dayId: string, activityId: string, updates: Partial<Activity>) => void;
  removeActivity: (tripId: string, dayId: string, activityId: string) => void;
  toggleComplete: (tripId: string, dayId: string, activityId: string) => void;
  reorderActivities: (tripId: string, dayId: string, orderedIds: string[]) => void;
  updateDayWeather: (tripId: string, dayId: string, weather: Day['weather']) => void;
  updateActivityTravel: (tripId: string, dayId: string, activityId: string, travel: Activity['travelFromPrevious']) => void;
}

export const useItineraryStore = create<ItineraryState>()(
  persist(
    (set) => ({
      trips: [],

      addTrip: (name, startDate, endDate) => {
        const id = generateId();
        const dates = getDaysBetween(startDate, endDate);
        const days: Day[] = dates.map((date, i) => ({
          id: generateId(),
          date,
          label: `Day ${i + 1}`,
          activities: [],
        }));
        const now = new Date().toISOString();
        const trip: Trip = {
          id,
          name,
          startDate,
          endDate,
          days,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ trips: [...state.trips, trip] }));
        return id;
      },

      importTrip: (trip) => {
        set((state) => ({ trips: [...state.trips, trip] }));
      },

      updateTrip: (id, updates) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      deleteTrip: (id) => {
        set((state) => ({ trips: state.trips.filter((t) => t.id !== id) }));
      },

      addActivity: (tripId, dayId, activity) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  days: t.days.map((d) =>
                    d.id === dayId
                      ? { ...d, activities: [...d.activities, { ...activity, id: generateId() }] }
                      : d
                  ),
                }
              : t
          ),
        }));
      },

      updateActivity: (tripId, dayId, activityId, updates) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  days: t.days.map((d) =>
                    d.id === dayId
                      ? {
                          ...d,
                          activities: d.activities.map((a) =>
                            a.id === activityId ? { ...a, ...updates } : a
                          ),
                        }
                      : d
                  ),
                }
              : t
          ),
        }));
      },

      removeActivity: (tripId, dayId, activityId) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  days: t.days.map((d) =>
                    d.id === dayId
                      ? { ...d, activities: d.activities.filter((a) => a.id !== activityId) }
                      : d
                  ),
                }
              : t
          ),
        }));
      },

      toggleComplete: (tripId, dayId, activityId) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  days: t.days.map((d) =>
                    d.id === dayId
                      ? {
                          ...d,
                          activities: d.activities.map((a) =>
                            a.id === activityId ? { ...a, completed: !a.completed } : a
                          ),
                        }
                      : d
                  ),
                }
              : t
          ),
        }));
      },

      reorderActivities: (tripId, dayId, orderedIds) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  days: t.days.map((d) => {
                    if (d.id !== dayId) return d;
                    const actMap = new Map(d.activities.map((a) => [a.id, a]));
                    return {
                      ...d,
                      activities: orderedIds.map((id) => actMap.get(id)!).filter(Boolean),
                    };
                  }),
                }
              : t
          ),
        }));
      },

      updateDayWeather: (tripId, dayId, weather) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  days: t.days.map((d) => (d.id === dayId ? { ...d, weather } : d)),
                }
              : t
          ),
        }));
      },

      updateActivityTravel: (tripId, dayId, activityId, travel) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  days: t.days.map((d) =>
                    d.id === dayId
                      ? {
                          ...d,
                          activities: d.activities.map((a) =>
                            a.id === activityId ? { ...a, travelFromPrevious: travel } : a
                          ),
                        }
                      : d
                  ),
                }
              : t
          ),
        }));
      },
    }),
    {
      name: 'travel-companion-storage',
    }
  )
);
