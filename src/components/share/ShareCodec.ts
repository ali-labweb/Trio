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
