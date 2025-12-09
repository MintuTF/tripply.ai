'use client';

/**
 * Map utilities for animated SVG maps in Remotion
 * Handles coordinate projection, bounds calculation, and animation helpers
 */

import { MapMarker, StoryTemplate } from '@/types/story';

export type Point = { x: number; y: number };
export type Bounds = { ne: [number, number]; sw: [number, number] };

/**
 * Convert lat/lng to SVG coordinates using Mercator projection
 */
export function projectToSvg(
  lat: number,
  lng: number,
  bounds: Bounds,
  width: number,
  height: number,
  padding: number = 40
): Point {
  const [neLng, neLat] = bounds.ne;
  const [swLng, swLat] = bounds.sw;

  // Add padding to effective dimensions
  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  // Normalize longitude to 0-1 range
  const x = ((lng - swLng) / (neLng - swLng)) * effectiveWidth + padding;

  // Mercator projection for latitude
  const latRad = (lat * Math.PI) / 180;
  const nLatRad = (neLat * Math.PI) / 180;
  const sLatRad = (swLat * Math.PI) / 180;

  const mercatorY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const mercatorN = Math.log(Math.tan(Math.PI / 4 + nLatRad / 2));
  const mercatorS = Math.log(Math.tan(Math.PI / 4 + sLatRad / 2));

  // Invert Y since SVG y increases downward
  const y =
    effectiveHeight - ((mercatorY - mercatorS) / (mercatorN - mercatorS)) * effectiveHeight + padding;

  return { x, y };
}

/**
 * Calculate bounding box from an array of markers
 * Returns bounds with some padding
 */
export function calculateBounds(markers: MapMarker[], paddingFactor: number = 0.15): Bounds {
  if (!markers.length) {
    // Default to world view
    return {
      ne: [180, 85],
      sw: [-180, -85],
    };
  }

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const marker of markers) {
    minLng = Math.min(minLng, marker.lng);
    maxLng = Math.max(maxLng, marker.lng);
    minLat = Math.min(minLat, marker.lat);
    maxLat = Math.max(maxLat, marker.lat);
  }

  // Add padding to bounds
  const lngPadding = (maxLng - minLng) * paddingFactor || 0.01;
  const latPadding = (maxLat - minLat) * paddingFactor || 0.01;

  return {
    ne: [maxLng + lngPadding, maxLat + latPadding],
    sw: [minLng - lngPadding, minLat - latPadding],
  };
}

/**
 * Get the center point of bounds
 */
export function getBoundsCenter(bounds: Bounds): { lat: number; lng: number } {
  return {
    lat: (bounds.ne[1] + bounds.sw[1]) / 2,
    lng: (bounds.ne[0] + bounds.sw[0]) / 2,
  };
}

/**
 * Generate a curved bezier path between two points
 * Creates decorative, aesthetic curves (not real routes)
 */
export function getCurvedPath(from: Point, to: Point, curvature: number = 0.3): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  // Calculate perpendicular offset for control point
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Perpendicular direction
  const perpX = -dy / distance;
  const perpY = dx / distance;

  // Control point offset (alternates direction based on position)
  const offsetAmount = distance * curvature;
  const controlX = midX + perpX * offsetAmount;
  const controlY = midY + perpY * offsetAmount;

  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

/**
 * Generate multiple curved paths for all connected markers
 */
export function getAllConnectorPaths(
  markers: MapMarker[],
  bounds: Bounds,
  width: number,
  height: number,
  padding: number = 40
): string[] {
  const sortedMarkers = [...markers].sort((a, b) => a.order - b.order);
  const paths: string[] = [];

  for (let i = 0; i < sortedMarkers.length - 1; i++) {
    const from = projectToSvg(
      sortedMarkers[i].lat,
      sortedMarkers[i].lng,
      bounds,
      width,
      height,
      padding
    );
    const to = projectToSvg(
      sortedMarkers[i + 1].lat,
      sortedMarkers[i + 1].lng,
      bounds,
      width,
      height,
      padding
    );

    // Alternate curvature direction for visual variety
    const curvature = i % 2 === 0 ? 0.25 : -0.25;
    paths.push(getCurvedPath(from, to, curvature));
  }

  return paths;
}

/**
 * Interpolate between two bounds for smooth zoom transitions
 */
export function interpolateBounds(
  fromBounds: Bounds,
  toBounds: Bounds,
  progress: number // 0 to 1
): Bounds {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return {
    ne: [
      fromBounds.ne[0] + (toBounds.ne[0] - fromBounds.ne[0]) * clampedProgress,
      fromBounds.ne[1] + (toBounds.ne[1] - fromBounds.ne[1]) * clampedProgress,
    ],
    sw: [
      fromBounds.sw[0] + (toBounds.sw[0] - fromBounds.sw[0]) * clampedProgress,
      fromBounds.sw[1] + (toBounds.sw[1] - fromBounds.sw[1]) * clampedProgress,
    ],
  };
}

/**
 * Calculate a wider bounds for zoom-out effect
 */
export function getWideBounds(bounds: Bounds, factor: number = 3): Bounds {
  const center = getBoundsCenter(bounds);
  const lngRange = bounds.ne[0] - bounds.sw[0];
  const latRange = bounds.ne[1] - bounds.sw[1];

  return {
    ne: [center.lng + (lngRange * factor) / 2, center.lat + (latRange * factor) / 2],
    sw: [center.lng - (lngRange * factor) / 2, center.lat - (latRange * factor) / 2],
  };
}

/**
 * Easing functions for smooth animations
 */
export const easings = {
  // Smooth ease-out for zoom in
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),

  // Bouncy effect for pin pop-in
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  // Smooth ease-in-out for panning
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // Spring-like bounce
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/**
 * Get icon for marker type
 */
export function getMarkerIcon(type: string): string {
  const icons: Record<string, string> = {
    hotel: '🏨',
    spot: '📍',
    food: '🍽️',
    activity: '⭐',
    note: '📝',
  };
  return icons[type] || '📍';
}

/**
 * Get color for marker type based on template
 */
export function getMarkerColor(
  type: string,
  template: StoryTemplate
): string {
  const colorSchemes: Record<string, Record<string, string>> = {
    minimal: {
      hotel: '#4A90D9',
      spot: '#58A6C1',
      food: '#F97316',
      activity: '#8B5CF6',
      note: '#6B7280',
    },
    aesthetic: {
      hotel: '#8B5A2B',
      spot: '#D4A574',
      food: '#B8860B',
      activity: '#CD853F',
      note: '#A0826D',
    },
    trendy: {
      hotel: '#E94560',
      spot: '#F472B6',
      food: '#FB923C',
      activity: '#A855F7',
      note: '#6366F1',
    },
    luxury: {
      hotel: '#D4AF37',
      spot: '#C9A227',
      food: '#FFD700',
      activity: '#E6BE8A',
      note: '#8B7355',
    },
  };

  return colorSchemes[template]?.[type] || colorSchemes.minimal.spot;
}

/**
 * Template-specific background gradients for SVG maps
 */
export function getMapBackground(template: StoryTemplate): {
  gradient: string[];
  gridColor: string;
  lineColor: string;
} {
  const backgrounds: Record<string, { gradient: string[]; gridColor: string; lineColor: string }> = {
    minimal: {
      gradient: ['#F8F9FA', '#E9ECEF'],
      gridColor: 'rgba(0, 0, 0, 0.05)',
      lineColor: 'rgba(88, 166, 193, 0.4)',
    },
    aesthetic: {
      gradient: ['#FDF8F3', '#F5E6D3'],
      gridColor: 'rgba(139, 90, 43, 0.08)',
      lineColor: 'rgba(212, 165, 116, 0.5)',
    },
    trendy: {
      gradient: ['#1A1A2E', '#16213E'],
      gridColor: 'rgba(233, 69, 96, 0.1)',
      lineColor: 'rgba(233, 69, 96, 0.4)',
    },
    luxury: {
      gradient: ['#0D0D0D', '#1A1A1A'],
      gridColor: 'rgba(212, 175, 55, 0.08)',
      lineColor: 'rgba(212, 175, 55, 0.3)',
    },
  };

  return backgrounds[template] || backgrounds.minimal;
}
