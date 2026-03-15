import type { WeatherInfo } from '../types/itinerary';

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight showers',
  81: 'Moderate showers',
  82: 'Violent showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

export function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 65) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

export async function fetchWeather(
  lat: number,
  lng: number,
  date: string
): Promise<WeatherInfo | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&start_date=${date}&end_date=${date}&timezone=auto`
    );
    const data = await res.json();
    if (!data.daily || !data.daily.time?.length) return null;

    const code = data.daily.weathercode[0];
    return {
      date,
      locationName: '',
      tempHighC: Math.round(data.daily.temperature_2m_max[0]),
      tempLowC: Math.round(data.daily.temperature_2m_min[0]),
      conditionCode: code,
      conditionText: WMO_CODES[code] || 'Unknown',
      precipitationMm: data.daily.precipitation_sum[0],
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
