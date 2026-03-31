import type { WeatherInfo } from '../../types/itinerary';
import { getWeatherEmoji } from '../../services/weather';
import { useSettingsStore, formatTemp } from '../../store/useSettingsStore';

function getWeatherTip(weather: WeatherInfo): string | null {
  if (weather.precipitationMm > 5) return 'Bring an umbrella';
  if (weather.precipitationMm > 0) return 'Light rain possible';
  if (weather.tempHighC > 32) return 'Stay hydrated';
  if (weather.tempLowC < 5) return 'Pack warm layers';
  return null;
}

interface WeatherCardProps {
  weather: WeatherInfo;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  const useFahrenheit = useSettingsStore((s) => s.useFahrenheit);
  const emoji = getWeatherEmoji(weather.conditionCode);
  const tip = getWeatherTip(weather);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-4 flex items-center justify-between gap-3">
      {/* Left: emoji + temps + condition */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-4xl flex-shrink-0">{emoji}</span>
        <div className="min-w-0">
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {formatTemp(weather.tempHighC, useFahrenheit)}{' '}
            <span className="text-slate-400 font-normal">/</span>{' '}
            {formatTemp(weather.tempLowC, useFahrenheit)}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {weather.conditionText}
          </div>
        </div>
      </div>

      {/* Right: precipitation + tip */}
      <div className="flex flex-col items-end flex-shrink-0 text-right">
        {weather.precipitationMm > 0 && (
          <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c-2.25 3-6 7.5-6 11.25a6 6 0 1 0 12 0c0-3.75-3.75-8.25-6-11.25Z" />
            </svg>
            <span>{weather.precipitationMm}mm</span>
          </div>
        )}
        {tip && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tip}
          </span>
        )}
      </div>
    </div>
  );
}
