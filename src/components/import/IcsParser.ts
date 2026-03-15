import type { Trip, Day, Activity } from '../../types/itinerary';
import { generateId } from '../../utils/id';
import { getDaysBetween } from '../../utils/dates';

interface IcsEvent {
  summary: string;
  description?: string;
  dtstart?: string;
  dtend?: string;
  location?: string;
}

function parseIcsDate(icsDate: string): { date: string; time?: string } {
  // Handle formats: 20260401T090000Z or 20260401
  const cleaned = icsDate.replace(/[^\dT]/g, '');
  const year = cleaned.substring(0, 4);
  const month = cleaned.substring(4, 6);
  const day = cleaned.substring(6, 8);
  const date = `${year}-${month}-${day}`;

  if (cleaned.includes('T') && cleaned.length >= 13) {
    const hour = cleaned.substring(9, 11);
    const minute = cleaned.substring(11, 13);
    return { date, time: `${hour}:${minute}` };
  }
  return { date };
}

function parseIcs(text: string): IcsEvent[] {
  const events: IcsEvent[] = [];
  const eventBlocks = text.split('BEGIN:VEVENT');

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split('END:VEVENT')[0];
    const event: IcsEvent = { summary: '' };

    const lines = block.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('SUMMARY:')) {
        event.summary = trimmed.substring(8);
      } else if (trimmed.startsWith('DESCRIPTION:')) {
        event.description = trimmed.substring(12).replace(/\\n/g, '\n');
      } else if (trimmed.startsWith('DTSTART')) {
        const val = trimmed.split(':').pop() || '';
        event.dtstart = val;
      } else if (trimmed.startsWith('DTEND')) {
        const val = trimmed.split(':').pop() || '';
        event.dtend = val;
      } else if (trimmed.startsWith('LOCATION:')) {
        event.location = trimmed.substring(9);
      }
    }

    if (event.summary) events.push(event);
  }

  return events;
}

export function parseIcsItinerary(icsText: string, tripName: string = 'Imported Trip'): Trip {
  const events = parseIcs(icsText);

  const dayMap = new Map<string, Activity[]>();

  for (const event of events) {
    const start = event.dtstart ? parseIcsDate(event.dtstart) : null;
    const end = event.dtend ? parseIcsDate(event.dtend) : null;
    const date = start?.date || new Date().toISOString().split('T')[0];

    const activity: Activity = {
      id: generateId(),
      title: event.summary,
      description: event.description || undefined,
      startTime: start?.time,
      endTime: end?.time,
      category: classifyIcsEvent(event.summary),
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

function classifyIcsEvent(summary: string): Activity['category'] {
  const lower = summary.toLowerCase();
  if (lower.includes('flight') || lower.includes('airline')) return 'flight';
  if (lower.includes('hotel') || lower.includes('check')) return 'hotel';
  if (lower.includes('restaurant') || lower.includes('dinner') || lower.includes('lunch')) return 'restaurant';
  if (lower.includes('tour') || lower.includes('visit') || lower.includes('museum')) return 'sightseeing';
  if (lower.includes('taxi') || lower.includes('train') || lower.includes('bus')) return 'transport';
  return 'activity';
}
