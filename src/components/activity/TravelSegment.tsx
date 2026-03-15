import type { TravelInfo } from '../../types/itinerary';

interface TravelSegmentProps {
  travel: TravelInfo;
}

export default function TravelSegment({ travel }: TravelSegmentProps) {
  const icon = travel.mode === 'walking' ? '🚶' : '🚗';
  const duration =
    travel.durationMinutes >= 60
      ? `${Math.floor(travel.durationMinutes / 60)}h ${travel.durationMinutes % 60}m`
      : `${travel.durationMinutes} min`;

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 ml-6">
      <div className="w-0.5 h-4 bg-slate-200 dark:bg-slate-700 rounded-full" />
      <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
        {icon} {duration} · {travel.distanceKm} km
      </span>
    </div>
  );
}
