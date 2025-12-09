import { DayPlan, MapSnapshot, MapMarker } from '@/types/story';
import { extractDayMarkers } from './prepareStoryData';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

type MapStyle = 'light' | 'dark' | 'streets' | 'satellite';

const STYLE_IDS: Record<MapStyle, string> = {
  light: 'mapbox/light-v11',
  dark: 'mapbox/dark-v11',
  streets: 'mapbox/streets-v12',
  satellite: 'mapbox/satellite-streets-v12',
};

/**
 * Generates a static map image URL using Mapbox Static Images API
 */
export function generateMapSnapshotUrl(
  markers: MapMarker[],
  options: {
    style?: MapStyle;
    width?: number;
    height?: number;
    padding?: number;
    showRoute?: boolean;
  } = {}
): string | null {
  if (!MAPBOX_ACCESS_TOKEN || markers.length === 0) {
    return null;
  }

  const {
    style = 'light',
    width = 1080,
    height = 600,
    padding = 50,
    showRoute = true,
  } = options;

  const styleId = STYLE_IDS[style];

  // Build marker overlays
  const markerOverlays = markers
    .map((marker, index) => {
      // Use custom marker colors based on type
      const color = getMarkerColor(marker.type);
      const label = index + 1; // 1-based numbering
      return `pin-s-${label}+${color}(${marker.lng},${marker.lat})`;
    })
    .join(',');

  // Build route path if multiple markers
  let pathOverlay = '';
  if (showRoute && markers.length > 1) {
    const pathCoords = markers
      .map((m) => `${m.lng},${m.lat}`)
      .join(';');
    // Encode path as polyline
    pathOverlay = `,path-4+58a6c1-0.5(${encodeURIComponent(pathCoords)})`;
  }

  // Calculate bounds for auto-fit
  const bounds = calculateBounds(markers);
  const boundsStr = `[${bounds.sw[0]},${bounds.sw[1]},${bounds.ne[0]},${bounds.ne[1]}]`;

  // Build URL with auto-fit to bounds
  const overlays = `${markerOverlays}${pathOverlay}`;
  const url = `https://api.mapbox.com/styles/v1/${styleId}/static/${overlays}/auto/${width}x${height}@2x?padding=${padding}&access_token=${MAPBOX_ACCESS_TOKEN}`;

  return url;
}

/**
 * Generates map snapshots for all days
 */
export async function generateDayMapSnapshots(
  days: DayPlan[],
  style: MapStyle = 'light'
): Promise<MapSnapshot[]> {
  const snapshots: MapSnapshot[] = [];

  for (const day of days) {
    const markers = extractDayMarkers(day);

    if (markers.length === 0) {
      continue;
    }

    const imageUrl = generateMapSnapshotUrl(markers, {
      style,
      width: 1080,
      height: 600,
      showRoute: true,
    });

    if (imageUrl) {
      const bounds = calculateBounds(markers);
      const routeCoordinates = markers.map((m) => [m.lng, m.lat] as [number, number]);

      snapshots.push({
        dayIndex: day.dayIndex,
        imageUrl,
        bounds,
        markers,
        routeCoordinates,
      });
    }
  }

  return snapshots;
}

/**
 * Generates an overview map showing all days
 */
export function generateOverviewMapUrl(
  days: DayPlan[],
  style: MapStyle = 'light'
): string | null {
  // Collect all markers from all days
  const allMarkers: MapMarker[] = [];

  days.forEach((day) => {
    const dayMarkers = extractDayMarkers(day);
    dayMarkers.forEach((marker, index) => {
      allMarkers.push({
        ...marker,
        order: allMarkers.length + 1,
      });
    });
  });

  if (allMarkers.length === 0) {
    return null;
  }

  return generateMapSnapshotUrl(allMarkers, {
    style,
    width: 1080,
    height: 800,
    padding: 80,
    showRoute: true,
  });
}

/**
 * Calculates bounding box from markers
 */
function calculateBounds(markers: MapMarker[]): {
  ne: [number, number];
  sw: [number, number];
} {
  if (markers.length === 0) {
    return { ne: [0, 0], sw: [0, 0] };
  }

  let minLng = markers[0].lng;
  let maxLng = markers[0].lng;
  let minLat = markers[0].lat;
  let maxLat = markers[0].lat;

  markers.forEach((marker) => {
    minLng = Math.min(minLng, marker.lng);
    maxLng = Math.max(maxLng, marker.lng);
    minLat = Math.min(minLat, marker.lat);
    maxLat = Math.max(maxLat, marker.lat);
  });

  // Add padding to bounds
  const lngPadding = (maxLng - minLng) * 0.1 || 0.01;
  const latPadding = (maxLat - minLat) * 0.1 || 0.01;

  return {
    ne: [maxLng + lngPadding, maxLat + latPadding],
    sw: [minLng - lngPadding, minLat - latPadding],
  };
}

/**
 * Gets marker color based on place type
 */
function getMarkerColor(type: string): string {
  const colors: Record<string, string> = {
    hotel: 'e74c3c', // Red
    food: 'f39c12', // Orange
    spot: '3498db', // Blue
    activity: '9b59b6', // Purple
    note: '95a5a6', // Gray
  };
  return colors[type] || '58a6c1'; // Default teal
}

/**
 * Preloads map images for faster rendering
 */
export function preloadMapImages(snapshots: MapSnapshot[]): Promise<void[]> {
  return Promise.all(
    snapshots.map(
      (snapshot) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load map for day ${snapshot.dayIndex}`));
          img.src = snapshot.imageUrl;
        })
    )
  );
}

/**
 * Gets the center point of markers
 */
export function getMarkersCenter(markers: MapMarker[]): { lat: number; lng: number } | null {
  if (markers.length === 0) return null;

  const sumLat = markers.reduce((sum, m) => sum + m.lat, 0);
  const sumLng = markers.reduce((sum, m) => sum + m.lng, 0);

  return {
    lat: sumLat / markers.length,
    lng: sumLng / markers.length,
  };
}
