import type { WeatherInfo } from '../../types/itinerary';
import { getWeatherEmoji } from '../../services/weather';
import { useSettingsStore, formatTemp } from '../../store/useSettingsStore';

interface WeatherBadgeProps {
  weather: WeatherInfo;
  compact?: boolean;
}

export default function WeatherBadge({ weather, compact = false }: WeatherBadgeProps) {
  const emoji = getWeatherEmoji(weather.conditionCode);
  const useFahrenheit = useSettingsStore((s) => s.useFahrenheit);

  if (compact) {
    return (
      <span className="text-xs flex items-center gap-0.5">
        <span>{emoji}</span>
        <span>{formatTemp(weather.tempHighC, useFahrenheit)}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2 text-sm">
      <span className="text-2xl">{emoji}</span>
      <div>
        <div className="font-medium text-slate-700 dark:text-slate-300">
          {formatTemp(weather.tempHighC, useFahrenheit)} / {formatTemp(weather.tempLowC, useFahrenheit)}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {weather.conditionText}
          {weather.precipitationMm > 0 && ` · ${weather.precipitationMm}mm`}
        </div>
      </div>
    </div>
  );
}
