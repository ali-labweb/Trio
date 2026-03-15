import type { Trip, Day, Activity, ActivityCategory } from '../../types/itinerary';
import { generateId } from '../../utils/id';
import { getDaysBetween } from '../../utils/dates';

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const DAYS_OF_WEEK = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const CATEGORY_KEYWORDS: Record<ActivityCategory, string[]> = {
  flight: ['flight', 'fly', 'airline', 'airport', 'boarding', 'terminal', 'gate', 'kona airport'],
  transport: ['taxi', 'uber', 'lyft', 'bus', 'train', 'metro', 'subway', 'transfer', 'drive', 'car rental', 'check out', 'checkout'],
  hotel: ['hotel', 'hostel', 'airbnb', 'check-in', 'check in', 'checkin', 'accommodation', 'lodge', 'resort', 'stay', 'mauna lani'],
  restaurant: ['restaurant', 'lunch', 'dinner', 'breakfast', 'brunch', 'café', 'cafe', 'eat', 'dining', 'food', 'canoe', 'halani', 'hālani', 'grille', 'surf shack'],
  sightseeing: ['visit', 'tour', 'museum', 'temple', 'church', 'palace', 'castle', 'monument', 'landmark', 'explore', 'valley', 'lookout', 'fishpond', 'historic', 'walk'],
  shopping: ['shop', 'shopping', 'market', 'mall', 'store', 'souvenir'],
  activity: ['hike', 'swim', 'dive', 'surf', 'ski', 'climb', 'kayak', 'snorkel', 'yoga', 'spa', 'massage', 'show', 'concert', 'golf', 'tee time', 'pool', 'paddleboard', 'outrigger', 'canoe', 'luau', 'manta', 'night dive', 'beach', 'fitness', 'hula', 'lei making'],
  other: [],
};

const TIME_PATTERN = /(\d{1,2}):(\d{2})\s*(am|pm)?/i;

// Lines to skip — these aren't activities
function isSkipLine(line: string): boolean {
  const l = line.trim();
  // Separator lines
  if (/^[━═─—\-_=]{3,}$/.test(l)) return true;
  // Weather lines
  if (/^weather:/i.test(l)) return true;
  // Warning/info lines (just advisories, not actionable)
  if (/^[⚠✅❌⛔]/.test(l) && !l.includes('dive') && !l.includes('snorkel')) return true;
  // Empty or too short
  if (l.length < 3) return true;
  // Header/title lines (all caps with no actionable content)
  if (/^[A-Z\s—\-|,.'°]+$/.test(l) && l.length < 80 && !l.includes('DIVE') && !l.includes('DINNER') && !l.includes('BREAKFAST')) return true;
  // Lines that are just URLs
  if (/^https?:\/\//.test(l) || /^\w+\.\w+\.\w+/.test(l)) return true;
  // "KEY REMINDERS" section header and similar
  if (/^(KEY REMINDERS|NOTES|TIPS|PACKING)/i.test(l)) return true;
  return false;
}

// Try to extract year from the header text (e.g., "March 15–21, 2026")
function extractYear(text: string): number | null {
  const match = text.match(/\b(20\d{2})\b/);
  return match ? parseInt(match[1]) : null;
}

// Detect date header lines like "SUN MAR 15 — ARRIVAL" or "MON MAR 16 — RECOVERY DAY"
function parseDayHeader(line: string, year: number): { date: string; label: string } | null {
  // Pattern: DAY_OF_WEEK MONTH DAY — LABEL
  const pattern = new RegExp(
    `^(?:${DAYS_OF_WEEK.join('|')})\\s+([a-z]+)\\s+(\\d{1,2})\\s*[—–\\-]\\s*(.*)$`,
    'i'
  );
  const match = line.match(pattern);
  if (match) {
    const monthNum = MONTHS[match[1].toLowerCase()];
    if (monthNum === undefined) return null;
    const m = String(monthNum + 1).padStart(2, '0');
    const d = match[2].padStart(2, '0');
    return { date: `${year}-${m}-${d}`, label: match[3].trim() };
  }

  // Pattern: "DAY MONTH DD" without separator
  const pattern2 = new RegExp(
    `^(?:${DAYS_OF_WEEK.join('|')})\\s+([a-z]+)\\s+(\\d{1,2})\\b`,
    'i'
  );
  const match2 = line.match(pattern2);
  if (match2) {
    const monthNum = MONTHS[match2[1].toLowerCase()];
    if (monthNum === undefined) return null;
    const m = String(monthNum + 1).padStart(2, '0');
    const d = match2[2].padStart(2, '0');
    return { date: `${year}-${m}-${d}`, label: '' };
  }

  return null;
}

// Also try standard date formats
function parseStandardDate(text: string): string | null {
  // YYYY-MM-DD
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // MM/DD/YYYY
  const mdy = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;

  // Month DD, YYYY (like "April 1, 2026")
  const longDate = text.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (longDate) {
    const monthNum = MONTHS[longDate[1].toLowerCase()];
    if (monthNum !== undefined) {
      return `${longDate[3]}-${String(monthNum + 1).padStart(2, '0')}-${longDate[2].padStart(2, '0')}`;
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
  // Check restaurant first since "dinner" and "breakfast" are common
  if (CATEGORY_KEYWORDS.restaurant.some((kw) => lower.includes(kw))) return 'restaurant';
  if (CATEGORY_KEYWORDS.flight.some((kw) => lower.includes(kw))) return 'flight';
  if (CATEGORY_KEYWORDS.activity.some((kw) => lower.includes(kw))) return 'activity';
  if (CATEGORY_KEYWORDS.hotel.some((kw) => lower.includes(kw))) return 'hotel';
  if (CATEGORY_KEYWORDS.sightseeing.some((kw) => lower.includes(kw))) return 'sightseeing';
  if (CATEGORY_KEYWORDS.transport.some((kw) => lower.includes(kw))) return 'transport';
  if (CATEGORY_KEYWORDS.shopping.some((kw) => lower.includes(kw))) return 'shopping';
  return 'other';
}

function cleanActivityTitle(line: string): string {
  return line
    .replace(TIME_PATTERN, '')
    .replace(/^[-•*·🤿🏨🍽️✈️📸🎯🛍️📌]\s*/g, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/^(morning|afternoon|evening|night)\s*[:\-—]\s*/i, (match) => match) // keep time-of-day prefixes
    .trim();
}

// Check if a line is part of a "reminders" or "notes" section at the end
function isEndSection(line: string): boolean {
  return /^(KEY REMINDERS|NOTES|TIPS|PACKING|IMPORTANT|CONTACTS)/i.test(line.trim());
}

export function parseItineraryText(text: string, tripName: string = 'Imported Trip'): Trip {
  const lines = text.split('\n');

  // Extract year from the full text header
  let year = extractYear(text);
  if (!year) year = new Date().getFullYear();

  // Try to extract trip name from first meaningful line if not provided
  const firstLine = lines.find((l) => l.trim().length > 5 && !/^[━═─—\-_=]+$/.test(l.trim()));
  if (tripName === 'Imported Trip' && firstLine) {
    const cleaned = firstLine.trim().replace(/[━═─—]+/g, '').trim();
    if (cleaned.length > 3 && cleaned.length < 80) {
      tripName = cleaned;
    }
  }

  const dayGroups: { date: string; label: string; lines: string[] }[] = [];
  let currentDay: { date: string; label: string } | null = null;
  let currentLines: string[] = [];
  let inEndSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Stop processing if we hit end-of-itinerary sections
    if (isEndSection(line)) {
      inEndSection = true;
      continue;
    }
    if (inEndSection) continue;

    // Try to detect day headers
    const dayHeader = parseDayHeader(line, year);
    if (dayHeader) {
      if (currentDay) {
        dayGroups.push({ date: currentDay.date, label: currentDay.label, lines: currentLines });
      }
      currentDay = dayHeader;
      currentLines = [];
      continue;
    }

    // Try standard date formats
    const stdDate = !dayHeader ? parseStandardDate(line) : null;
    if (stdDate) {
      if (currentDay) {
        dayGroups.push({ date: currentDay.date, label: currentDay.label, lines: currentLines });
      }
      currentDay = { date: stdDate, label: '' };
      currentLines = [];
      continue;
    }

    if (currentDay) {
      currentLines.push(line);
    }
  }
  // Push last day
  if (currentDay) {
    dayGroups.push({ ...currentDay, lines: currentLines });
  }

  // If no days found, fall back: try standard dates anywhere in lines
  if (dayGroups.length === 0) {
    for (const rawLine of lines) {
      const line = rawLine.trim();
      const stdDate = parseStandardDate(line);
      if (stdDate) {
        if (currentDay) {
          dayGroups.push({ ...currentDay, lines: currentLines });
        }
        currentDay = { date: stdDate, label: '' };
        currentLines = [];
      } else if (currentDay && line) {
        currentLines.push(line);
      }
    }
    if (currentDay) {
      dayGroups.push({ ...currentDay, lines: currentLines });
    }
  }

  // If still no days, create a single day
  if (dayGroups.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    const allLines = lines.map((l) => l.trim()).filter((l) => l && !isSkipLine(l));
    dayGroups.push({ date: today, label: 'Day 1', lines: allLines });
  }

  const allDates = dayGroups.map((g) => g.date).sort();
  const startDate = allDates[0];
  const endDate = allDates[allDates.length - 1];
  const allDays = getDaysBetween(startDate, endDate);

  const dayMap = new Map<string, { label: string; lines: string[] }>();
  for (const g of dayGroups) {
    dayMap.set(g.date, { label: g.label, lines: g.lines });
  }

  const days: Day[] = allDays.map((date, i) => {
    const group = dayMap.get(date);
    const groupLines = group?.lines || [];
    const dayLabel = group?.label || '';

    const activities: Activity[] = groupLines
      .filter((line) => !isSkipLine(line))
      .reduce<Activity[]>((acc, line) => {
        const time = parseTime(line);
        const title = cleanActivityTitle(line);

        if (!title || title.length < 2) return acc;

        acc.push({
          id: generateId(),
          title,
          startTime: time || undefined,
          category: classifyActivity(line),
          completed: false,
        });
        return acc;
      }, []);

    return {
      id: generateId(),
      date,
      label: dayLabel ? `Day ${i + 1} — ${dayLabel}` : `Day ${i + 1}`,
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
