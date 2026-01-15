/**
 * Navigation and Directions Helper Utilities
 * Generate deep links to Google Maps and Apple Maps
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DirectionsOptions {
  origin?: Coordinates;
  destination: Coordinates;
  destinationName?: string;
  travelMode?: 'driving' | 'walking' | 'transit' | 'bicycling';
}

/**
 * Generate Google Maps URL for directions
 */
export function getGoogleMapsDirectionsUrl(options: DirectionsOptions): string {
  const { origin, destination, destinationName, travelMode = 'driving' } = options;

  const params = new URLSearchParams();

  // API parameter (for Google Maps app deep linking)
  params.append('api', '1');

  // Destination
  if (destinationName) {
    params.append('destination', `${destination.lat},${destination.lng}`);
    params.append('destination_place_id', destinationName);
  } else {
    params.append('destination', `${destination.lat},${destination.lng}`);
  }

  // Origin (if provided)
  if (origin) {
    params.append('origin', `${origin.lat},${origin.lng}`);
  }

  // Travel mode
  params.append('travelmode', travelMode);

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Generate Google Maps URL for a single location
 */
export function getGoogleMapsLocationUrl(coordinates: Coordinates, placeName?: string): string {
  const params = new URLSearchParams();
  params.append('api', '1');
  params.append('query', `${coordinates.lat},${coordinates.lng}`);

  if (placeName) {
    params.append('query_place_id', placeName);
  }

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/**
 * Generate Apple Maps URL for directions
 * Works on iOS and macOS
 */
export function getAppleMapsDirectionsUrl(options: DirectionsOptions): string {
  const { origin, destination, destinationName, travelMode = 'driving' } = options;

  const params = new URLSearchParams();

  // Destination
  params.append('daddr', `${destination.lat},${destination.lng}`);

  if (destinationName) {
    params.append('dname', destinationName);
  }

  // Origin (if provided)
  if (origin) {
    params.append('saddr', `${origin.lat},${origin.lng}`);
  }

  // Travel mode
  const appleTravelMode = {
    driving: 'd',
    walking: 'w',
    transit: 'r',
    bicycling: 'w', // Apple Maps doesn't have bicycling, use walking
  }[travelMode];

  params.append('dirflg', appleTravelMode);

  return `http://maps.apple.com/?${params.toString()}`;
}

/**
 * Generate Apple Maps URL for a single location
 */
export function getAppleMapsLocationUrl(coordinates: Coordinates, placeName?: string): string {
  const params = new URLSearchParams();
  params.append('ll', `${coordinates.lat},${coordinates.lng}`);
  params.append('q', placeName || `${coordinates.lat},${coordinates.lng}`);

  return `http://maps.apple.com/?${params.toString()}`;
}

/**
 * Detect if user is on iOS device
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Detect if user is on macOS
 */
export function isMacOS(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Get the appropriate maps URL based on user's device
 * Automatically selects Apple Maps for iOS/macOS, Google Maps for others
 */
export function getDirectionsUrl(options: DirectionsOptions): string {
  if (isIOS() || isMacOS()) {
    return getAppleMapsDirectionsUrl(options);
  }
  return getGoogleMapsDirectionsUrl(options);
}

/**
 * Get the appropriate location URL based on user's device
 */
export function getLocationUrl(coordinates: Coordinates, placeName?: string): string {
  if (isIOS() || isMacOS()) {
    return getAppleMapsLocationUrl(coordinates, placeName);
  }
  return getGoogleMapsLocationUrl(coordinates, placeName);
}

/**
 * Open directions in native maps app
 */
export function openDirections(options: DirectionsOptions): void {
  const url = getDirectionsUrl(options);
  window.open(url, '_blank');
}

/**
 * Open location in native maps app
 */
export function openLocation(coordinates: Coordinates, placeName?: string): void {
  const url = getLocationUrl(coordinates, placeName);
  window.open(url, '_blank');
}

/**
 * Get current user location using browser Geolocation API
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Open directions from current location to destination
 */
export async function openDirectionsFromCurrentLocation(
  destination: Coordinates,
  destinationName?: string,
  travelMode?: 'driving' | 'walking' | 'transit' | 'bicycling'
): Promise<void> {
  try {
    const origin = await getCurrentLocation();
    openDirections({
      origin,
      destination,
      destinationName,
      travelMode,
    });
  } catch (error) {
    // If can't get current location, open without origin (will use user's current location by default)
    openDirections({
      destination,
      destinationName,
      travelMode,
    });
  }
}
