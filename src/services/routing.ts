import type { TravelInfo } from '../types/itinerary';

export async function fetchRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<TravelInfo | null> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const route = data.routes[0];
    const distanceKm = route.distance / 1000;
    const durationMinutes = Math.round(route.duration / 60);

    const coords: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]] // GeoJSON is [lng, lat], Leaflet wants [lat, lng]
    );

    return {
      durationMinutes,
      distanceKm: Math.round(distanceKm * 10) / 10,
      mode: distanceKm < 2 ? 'walking' : 'driving',
      routeGeometry: coords,
    };
  } catch {
    return null;
  }
}
