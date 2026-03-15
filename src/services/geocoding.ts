import type { Location } from '../types/itinerary';

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export async function geocodeLocation(query: string): Promise<Location | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en`
    );
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    const r: GeoResult = data.results[0];
    return {
      name: r.name,
      address: [r.admin1, r.country].filter(Boolean).join(', '),
      lat: r.latitude,
      lng: r.longitude,
    };
  } catch {
    return null;
  }
}
