import type { Trip, Day, Activity, ActivityCategory } from '../../types/itinerary';
import { generateId } from '../../utils/id';
import { getDaysBetween } from '../../utils/dates';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvItinerary(csvText: string, tripName: string = 'Imported Trip'): Trip {
  const lines = csvText.split('\n').filter((l) => l.trim());
  if (lines.length < 2) {
    return {
      id: generateId(),
      name: tripName,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      days: [{ id: generateId(), date: new Date().toISOString().split('T')[0], label: 'Day 1', activities: [] }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const dateCol = headers.findIndex((h) => h.includes('date'));
  const timeCol = headers.findIndex((h) => h.includes('time'));
  const titleCol = headers.findIndex((h) => h.includes('title') || h.includes('activity') || h.includes('event') || h.includes('name'));
  const descCol = headers.findIndex((h) => h.includes('desc') || h.includes('note'));
  const catCol = headers.findIndex((h) => h.includes('category') || h.includes('type'));
  const _locCol = headers.findIndex((h) => h.includes('location') || h.includes('place'));
  void _locCol; // reserved for future geocoding of CSV locations

  const dayMap = new Map<string, Activity[]>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const date = dateCol >= 0 ? normalizeDate(cols[dateCol]) : new Date().toISOString().split('T')[0];
    const time = timeCol >= 0 ? cols[timeCol] : undefined;
    const title = titleCol >= 0 ? cols[titleCol] : cols[Math.max(0, dateCol === 0 ? 1 : 0)];
    const desc = descCol >= 0 ? cols[descCol] : undefined;
    const cat = catCol >= 0 ? (cols[catCol]?.toLowerCase() as ActivityCategory) : 'other';

    if (!title) continue;

    const activity: Activity = {
      id: generateId(),
      title,
      description: desc || undefined,
      startTime: time || undefined,
      category: ['flight', 'transport', 'hotel', 'restaurant', 'activity', 'sightseeing', 'shopping', 'other'].includes(cat)
        ? cat
        : 'other',
      completed: false,
    };

    const existing = dayMap.get(date) || [];
    existing.push(activity);
    dayMap.set(date, existing);
  }

  const dates = [...dayMap.keys()].sort();
  const startDate = dates[0] || new Date().toISOString().split('T')[0];
  const endDate = dates[dates.length - 1] || startDate;
  const allDays = getDaysBetween(startDate, endDate);

  const days: Day[] = allDays.map((date, i) => ({
    id: generateId(),
    date,
    label: `Day ${i + 1}`,
    activities: dayMap.get(date) || [],
  }));

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

function normalizeDate(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  // Try ISO format first
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // Try M/D/YYYY
  const mdy = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  // Fallback
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}
