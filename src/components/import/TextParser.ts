import type { Trip, Day, Activity, ActivityCategory } from '../../types/itinerary';
import { generateId } from '../../utils/id';
import { getDaysBetween } from '../../utils/dates';

const DATE_PATTERNS = [
  /(\d{4})-(\d{2})-(\d{2})/,                              // 2026-04-01
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/,                         // 4/1/2026 or 04/01/2026
  /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i,                        // April 1, 2026
  /(\d{1,2})\s+(\w+)\s+(\d{4})/i,                          // 1 April 2026
];

const TIME_PATTERN = /(\d{1,2}):(\d{2})\s*(am|pm)?/i;

const CATEGORY_KEYWORDS: Record<ActivityCategory, string[]> = {
  flight: ['flight', 'fly', 'airline', 'airport', 'boarding', 'terminal', 'gate'],
  transport: ['taxi', 'uber', 'lyft', 'bus', 'train', 'metro', 'subway', 'transfer', 'drive', 'car rental'],
  hotel: ['hotel', 'hostel', 'airbnb', 'check-in', 'check-out', 'checkout', 'checkin', 'accommodation', 'lodge', 'resort', 'stay'],
  restaurant: ['restaurant', 'lunch', 'dinner', 'breakfast', 'brunch', 'café', 'cafe', 'eat', 'dining', 'food'],
  sightseeing: ['visit', 'tour', 'museum', 'temple', 'church', 'palace', 'castle', 'monument', 'landmark', 'explore'],
  shopping: ['shop', 'shopping', 'market', 'mall', 'store', 'souvenir'],
  activity: ['hike', 'swim', 'dive', 'surf', 'ski', 'climb', 'kayak', 'snorkel', 'yoga', 'spa', 'massage', 'show', 'concert'],
  other: [],
};

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;

    if (pattern === DATE_PATTERNS[0]) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    if (pattern === DATE_PATTERNS[1]) {
      const m = match[1].padStart(2, '0');
      const d = match[2].padStart(2, '0');
      return `${match[3]}-${m}-${d}`;
    }
    if (pattern === DATE_PATTERNS[2]) {
      const monthNum = MONTHS[match[1].toLowerCase()];
      if (monthNum === undefined) continue;
      const m = String(monthNum + 1).padStart(2, '0');
      const d = match[2].padStart(2, '0');
      return `${match[3]}-${m}-${d}`;
    }
    if (pattern === DATE_PATTERNS[3]) {
      const monthNum = MONTHS[match[2].toLowerCase()];
      if (monthNum === undefined) continue;
      const m = String(monthNum + 1).padStart(2, '0');
      const d = match[1].padStart(2, '0');
      return `${match[3]}-${m}-${d}`;
    }
  }
  return null;
}

function parseTime(text: string): string | null {
  const match = text.match(TIME_PATTERN);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const ampm = match[3]?.toLowerCase();
  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function classifyActivity(text: string): ActivityCategory {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'other') continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return cat as ActivityCategory;
    }
  }
  return 'other';
}

export function parseItineraryText(text: string, tripName: string = 'Imported Trip'): Trip {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const dayGroups: { date: string; lines: string[] }[] = [];
  let currentDate: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const date = parseDate(line);
    if (date) {
      if (currentDate) {
        dayGroups.push({ date: currentDate, lines: currentLines });
      }
      currentDate = date;
      currentLines = [];
      // Check if there's more content on the date line
      const afterDate = line.replace(DATE_PATTERNS[0], '').replace(DATE_PATTERNS[1], '').replace(DATE_PATTERNS[2], '').replace(DATE_PATTERNS[3], '').trim();
      if (afterDate && afterDate.length > 3) {
        currentLines.push(afterDate);
      }
    } else if (currentDate) {
      currentLines.push(line);
    } else {
      // Lines before any date, try to capture them under a synthetic date
      currentLines.push(line);
    }
  }
  if (currentDate) {
    dayGroups.push({ date: currentDate, lines: currentLines });
  }

  // If no dates found, create a single day with all activities
  if (dayGroups.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    dayGroups.push({ date: today, lines: lines });
  }

  const allDates = dayGroups.map((g) => g.date).sort();
  const startDate = allDates[0];
  const endDate = allDates[allDates.length - 1];
  const allDays = getDaysBetween(startDate, endDate);

  const dayMap = new Map<string, string[]>();
  for (const g of dayGroups) {
    dayMap.set(g.date, g.lines);
  }

  const days: Day[] = allDays.map((date, i) => {
    const groupLines = dayMap.get(date) || [];
    const activities: Activity[] = groupLines
      .filter((line) => line.length > 2)
      .map((line) => {
        const time = parseTime(line);
        const title = line
          .replace(TIME_PATTERN, '')
          .replace(/^[-•*·]\s*/, '')
          .replace(/^\d+\.\s*/, '')
          .trim();

        return {
          id: generateId(),
          title: title || line,
          startTime: time || undefined,
          category: classifyActivity(line),
          completed: false,
        };
      });

    return {
      id: generateId(),
      date,
      label: `Day ${i + 1}`,
      activities,
    };
  });

  return {
    id: generateId(),
    name: tripName,
    startDate,
    endDate,
    days,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
