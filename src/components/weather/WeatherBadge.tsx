import type { WeatherInfo } from '../../types/itinerary';
import { getWeatherEmoji } from '../../services/weather';

interface WeatherBadgeProps {
  weather: WeatherInfo;
  compact?: boolean;
}

export default function WeatherBadge({ weather, compact = false }: WeatherBadgeProps) {
  const emoji = getWeatherEmoji(weather.conditionCode);

  if (compact) {
    return (
      <span className="text-xs flex items-center gap-0.5">
        <span>{emoji}</span>
        <span>{weather.tempHighC}°</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg px-3 py-2 text-sm">
      <span className="text-2xl">{emoji}</span>
      <div>
        <div className="font-medium text-slate-700 dark:text-slate-300">
          {weather.tempHighC}° / {weather.tempLowC}°
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {weather.conditionText}
          {weather.precipitationMm > 0 && ` · ${weather.precipitationMm}mm`}
        </div>
      </div>
    </div>
  );
}
