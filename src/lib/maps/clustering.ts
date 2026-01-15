/**
 * Clustering Configuration for Maps
 * Threshold-based clustering using Supercluster
 */

import Supercluster from 'supercluster';

export interface ClusterPoint {
  type: 'Feature';
  properties: {
    cluster?: boolean;
    cluster_id?: number;
    point_count?: number;
    point_count_abbreviated?: string;
    // Custom properties
    id: string;
    name: string;
    placeType: 'hotel' | 'spot' | 'food' | 'activity';
    [key: string]: any;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

/**
 * Clustering threshold - activate when more than 20 places
 */
export const CLUSTERING_THRESHOLD = 20;

/**
 * Default Supercluster options
 */
export const DEFAULT_CLUSTER_OPTIONS: Supercluster.Options<any, any> = {
  radius: 60, // Cluster radius in pixels
  maxZoom: 16, // Max zoom to cluster points on
  minZoom: 0, // Min zoom to cluster points on
  minPoints: 2, // Minimum points to form a cluster
};

/**
 * Create a Supercluster instance
 */
export function createClusterIndex(
  options: Partial<Supercluster.Options<any, any>> = {}
): Supercluster {
  return new Supercluster({
    ...DEFAULT_CLUSTER_OPTIONS,
    ...options,
  });
}

/**
 * Convert place to GeoJSON feature for clustering
 */
export function placeToGeoJSON(place: {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  type: 'hotel' | 'spot' | 'food' | 'activity';
  [key: string]: any;
}): ClusterPoint {
  return {
    type: 'Feature',
    properties: {
      id: place.id,
      name: place.name,
      placeType: place.type,
      ...place,
    },
    geometry: {
      type: 'Point',
      coordinates: [place.coordinates.lng, place.coordinates.lat],
    },
  };
}

/**
 * Check if clustering should be enabled based on number of places
 */
export function shouldEnableClustering(placeCount: number): boolean {
  return placeCount > CLUSTERING_THRESHOLD;
}

/**
 * Get clusters for current map bounds and zoom
 */
export function getClusters(
  clusterIndex: Supercluster,
  bounds: [number, number, number, number], // [westLng, southLat, eastLng, northLat]
  zoom: number
): ClusterPoint[] {
  return clusterIndex.getClusters(bounds, Math.floor(zoom));
}

/**
 * Get children of a cluster (points that belong to it)
 */
export function getClusterChildren(
  clusterIndex: Supercluster,
  clusterId: number
): ClusterPoint[] {
  return clusterIndex.getChildren(clusterId);
}

/**
 * Get cluster expansion zoom (zoom level to show cluster children)
 */
export function getClusterExpansionZoom(
  clusterIndex: Supercluster,
  clusterId: number
): number {
  return clusterIndex.getClusterExpansionZoom(clusterId);
}

/**
 * Format cluster count for display
 */
export function formatClusterCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  return `${Math.floor(count / 1000)}k`;
}
