import type { Trip, Day, Activity, ActivityCategory } from '../../types/itinerary';
import { generateId } from '../../utils/id';
import { getDaysBetween } from '../../utils/dates';

const VALID_CATEGORIES: ActivityCategory[] = [
  'flight', 'transport', 'hotel', 'restaurant', 'activity', 'sightseeing', 'shopping', 'other',
];

interface RawLocation {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

interface RawActivity {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  category?: string;
  location?: RawLocation | string;
}

interface RawDay {
  date?: string;
  label?: string;
  activities?: RawActivity[];
}

interface RawTrip {
  name?: string;
  destination?: string;
  hotel?: string;
  startDate?: string;
  endDate?: string;
  days?: RawDay[];
}

function toCategory(raw?: string): ActivityCategory {
  if (!raw) return 'other';
  const lower = raw.toLowerCase();
  return VALID_CATEGORIES.includes(lower as ActivityCategory) ? (lower as ActivityCategory) : 'other';
}

/**
 * Extract the raw destination string from JSON text (for geocoding).
 */
export function getDestination(text: string): string | null {
  try {
    const cleaned = text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
    const raw = JSON.parse(cleaned);
    return raw?.destination || null;
  } catch {
    return null;
  }
}

/**
 * Try to parse text as JSON itinerary. Returns null if not valid JSON or missing structure.
 */
export function tryParseJson(text: string): Trip | null {
  let raw: RawTrip;
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
    raw = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (!raw || typeof raw !== 'object') return null;
  if (!raw.days || !Array.isArray(raw.days) || raw.days.length === 0) return null;

  // Extract dates from days
  const dates = raw.days
    .map((d) => d.date)
    .filter((d): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();

  if (dates.length === 0) return null;

  const startDate = raw.startDate || dates[0];
  const endDate = raw.endDate || dates[dates.length - 1];
  const allDates = getDaysBetween(startDate, endDate);

  // Build a map from date to raw day data
  const rawDayMap = new Map<string, RawDay>();
  for (const d of raw.days) {
    if (d.date) rawDayMap.set(d.date, d);
  }

  const days: Day[] = allDates.map((date, i) => {
    const rd = rawDayMap.get(date);
    const activities: Activity[] = (rd?.activities || []).map((a) => {
      // Parse location — supports object with lat/lng or plain string
      let location: Activity['location'] | undefined;
      if (a.location && typeof a.location === 'object') {
        const loc = a.location;
        if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          location = {
            name: loc.name || a.title || 'Unknown',
            address: loc.address,
            lat: loc.lat,
            lng: loc.lng,
          };
        }
      }
      return {
        id: generateId(),
        title: a.title || 'Untitled',
        description: a.description || undefined,
        startTime: a.startTime || undefined,
        endTime: a.endTime || undefined,
        category: toCategory(a.category),
        location,
        completed: false,
      };
    });

    return {
      id: generateId(),
      date,
      label: rd?.label || `Day ${i + 1}`,
      activities,
    };
  });

  const trip: Trip = {
    id: generateId(),
    name: raw.name || 'Imported Trip',
    startDate,
    endDate,
    hotelName: raw.hotel || undefined,
    days,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return trip;
}
