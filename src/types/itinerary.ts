export type ActivityCategory =
  | 'flight'
  | 'transport'
  | 'hotel'
  | 'restaurant'
  | 'activity'
  | 'sightseeing'
  | 'shopping'
  | 'other';

export interface Location {
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

export interface WeatherInfo {
  date: string;
  locationName: string;
  tempHighC: number;
  tempLowC: number;
  conditionCode: number;
  conditionText: string;
  precipitationMm: number;
  fetchedAt: string;
}

export interface TravelInfo {
  durationMinutes: number;
  distanceKm: number;
  mode: 'driving' | 'walking';
  routeGeometry?: [number, number][];
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: Location;
  category: ActivityCategory;
  completed: boolean;
  travelFromPrevious?: TravelInfo;
}

export interface Day {
  id: string;
  date: string;
  label?: string;
  activities: Activity[];
  weather?: WeatherInfo;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  days: Day[];
  createdAt: string;
  updatedAt: string;
}
