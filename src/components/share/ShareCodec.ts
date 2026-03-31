import type { Trip } from '../../types/itinerary';
import { compressToUrl, decompressFromUrl } from '../../utils/compression';

export function encodeTrip(trip: Trip): string {
  return compressToUrl(trip);
}

export function decodeTrip(encoded: string): Trip | null {
  const data = decompressFromUrl(encoded);
  if (!data || typeof data !== 'object') return null;
  return data as Trip;
}

export function encodeAllTrips(trips: Trip[]): string {
  return compressToUrl({ _sync: true, trips });
}

export function decodeAllTrips(encoded: string): Trip[] | null {
  const data = decompressFromUrl(encoded) as { _sync?: boolean; trips?: Trip[] } | null;
  if (!data || !data._sync || !Array.isArray(data.trips)) return null;
  return data.trips;
}
