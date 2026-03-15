import type { ActivityCategory } from '../types/itinerary';

export interface CategoryStyle {
  color: string;       // text/border color
  bg: string;          // light background
  darkBg: string;      // dark mode background
  dotColor: string;    // timeline dot color
  label: string;
  icon: string;        // SVG path data (24x24 viewBox)
}

const styles: Record<ActivityCategory, CategoryStyle> = {
  flight: {
    color: '#6366f1',
    bg: '#eef2ff',
    darkBg: 'rgba(99,102,241,0.15)',
    dotColor: '#6366f1',
    label: 'Flight',
    icon: 'M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z',
  },
  transport: {
    color: '#3b82f6',
    bg: '#eff6ff',
    darkBg: 'rgba(59,130,246,0.15)',
    dotColor: '#3b82f6',
    label: 'Transport',
    icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-7.5 0v-.088c0-1.107.617-2.122 1.6-2.633l.8-.4c.685-.342 1.174-.979 1.174-1.73V3.75a.75.75 0 0 1 .75-.75h2.78c.77 0 1.48.394 1.89 1.044l1.478 2.347c.382.607.924 1.11 1.564 1.43l.38.19c.95.476 1.756 1.227 2.302 2.13',
  },
  hotel: {
    color: '#8b5cf6',
    bg: '#f5f3ff',
    darkBg: 'rgba(139,92,246,0.15)',
    dotColor: '#8b5cf6',
    label: 'Hotel',
    icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5Z',
  },
  restaurant: {
    color: '#f59e0b',
    bg: '#fffbeb',
    darkBg: 'rgba(245,158,11,0.15)',
    dotColor: '#f59e0b',
    label: 'Dining',
    icon: 'M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12',
  },
  sightseeing: {
    color: '#ef4444',
    bg: '#fef2f2',
    darkBg: 'rgba(239,68,68,0.15)',
    dotColor: '#ef4444',
    label: 'Sightseeing',
    icon: 'M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a.75.75 0 0 0 .75.75h.008a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 1 4.5 0 .75.75 0 0 0 .75.75h5.985a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 1 4.5 0 .75.75 0 0 0 .75.75h.008a.75.75 0 0 0 .75-.75V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316ZM16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM12.75 12a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z',
  },
  activity: {
    color: '#10b981',
    bg: '#ecfdf5',
    darkBg: 'rgba(16,185,129,0.15)',
    dotColor: '#10b981',
    label: 'Activity',
    icon: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z',
  },
  shopping: {
    color: '#ec4899',
    bg: '#fdf2f8',
    darkBg: 'rgba(236,72,153,0.15)',
    dotColor: '#ec4899',
    label: 'Shopping',
    icon: 'M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
  },
  other: {
    color: '#64748b',
    bg: '#f8fafc',
    darkBg: 'rgba(100,116,139,0.15)',
    dotColor: '#64748b',
    label: 'Other',
    icon: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
  },
};

export function getCategoryStyle(category: ActivityCategory): CategoryStyle {
  return styles[category] || styles.other;
}

export function CategoryIcon({ category, size = 20 }: { category: ActivityCategory; size?: number }) {
  const style = getCategoryStyle(category);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={style.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={style.icon} />
    </svg>
  );
}
