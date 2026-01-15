/**
 * Distance Calculation Utilities
 * Haversine formula for calculating distances between coordinates
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers

  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);
  const deltaLat = toRadians(coord2.lat - coord1.lat);
  const deltaLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate distance in miles
 */
export function calculateDistanceMiles(coord1: Coordinates, coord2: Coordinates): number {
  const km = calculateDistance(coord1, coord2);
  return km * 0.621371; // Convert km to miles
}

/**
 * Calculate total distance for a route (array of coordinates)
 * Returns distance in kilometers
 */
export function calculateRouteDistance(coordinates: Coordinates[]): number {
  if (coordinates.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
  }

  return totalDistance;
}

/**
 * Calculate total distance for a route in miles
 */
export function calculateRouteDistanceMiles(coordinates: Coordinates[]): number {
  const km = calculateRouteDistance(coordinates);
  return km * 0.621371;
}

/**
 * Estimate travel time based on distance
 * Assumes average walking speed of 5 km/h
 * Returns time in minutes
 */
export function estimateWalkingTime(distanceKm: number): number {
  const walkingSpeedKmh = 5;
  const hours = distanceKm / walkingSpeedKmh;
  return Math.round(hours * 60);
}

/**
 * Estimate driving time based on distance
 * Assumes average city driving speed of 30 km/h
 * Returns time in minutes
 */
export function estimateDrivingTime(distanceKm: number): number {
  const drivingSpeedKmh = 30;
  const hours = distanceKm / drivingSpeedKmh;
  return Math.round(hours * 60);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number, unit: 'km' | 'mi' = 'km'): string {
  if (unit === 'mi') {
    const miles = distanceKm * 0.621371;
    if (miles < 0.1) return `${Math.round(miles * 5280)} ft`;
    return `${miles.toFixed(1)} mi`;
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${mins} min`;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the center point of multiple coordinates
 */
export function calculateCenter(coordinates: Coordinates[]): Coordinates | null {
  if (coordinates.length === 0) return null;

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  };
}

/**
 * Calculate bounds for a set of coordinates
 */
export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function calculateBounds(coordinates: Coordinates[]): Bounds | null {
  if (coordinates.length === 0) return null;

  return coordinates.reduce(
    (bounds, coord) => ({
      minLat: Math.min(bounds.minLat, coord.lat),
      maxLat: Math.max(bounds.maxLat, coord.lat),
      minLng: Math.min(bounds.minLng, coord.lng),
      maxLng: Math.max(bounds.maxLng, coord.lng),
    }),
    {
      minLat: Infinity,
      maxLat: -Infinity,
      minLng: Infinity,
      maxLng: -Infinity,
    }
  );
}
