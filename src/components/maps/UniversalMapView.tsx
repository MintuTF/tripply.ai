'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Bed, Utensils, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createClusterIndex,
  placeToGeoJSON,
  shouldEnableClustering,
  getClusters,
  getClusterExpansionZoom,
  formatClusterCount,
  type ClusterPoint,
} from '@/lib/maps/clustering';
import { calculateBounds, type Coordinates } from '@/lib/maps/distance';

// ============================================================================
// Types
// ============================================================================

export interface MapPlace {
  id: string;
  name: string;
  coordinates: Coordinates;
  type: 'hotel' | 'spot' | 'food' | 'activity';
  date?: string;
  time?: string;
  day?: number;
  order?: number;
  [key: string]: any;
}

export interface MapRoute {
  day: number;
  stops: string[]; // Place IDs in order
  color?: string;
}

export interface UniversalMapViewProps {
  places: MapPlace[];
  routes?: MapRoute[];
  interactive?: boolean;
  showLegend?: boolean;
  showStats?: boolean;
  onMarkerClick?: (placeId: string) => void;
  fitBounds?: boolean;
  center?: Coordinates;
  zoom?: number;
  className?: string;
  selectedPlaceId?: string;
  hoveredPlaceId?: string;
}

// ============================================================================
// Constants
// ============================================================================

const MARKER_COLORS = {
  hotel: '#10b981', // green
  spot: '#3b82f6', // blue
  food: '#f59e0b', // orange
  activity: '#8b5cf6', // purple
};

const DAY_COLORS = [
  '#3b82f6', // Day 1: Blue
  '#8b5cf6', // Day 2: Purple
  '#ec4899', // Day 3: Pink
  '#f59e0b', // Day 4: Orange
  '#10b981', // Day 5: Green
  '#06b6d4', // Day 6: Cyan
  '#f43f5e', // Day 7: Rose
];

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// ============================================================================
// Component
// ============================================================================

export default function UniversalMapView({
  places,
  routes = [],
  interactive = true,
  showLegend = true,
  showStats = true,
  onMarkerClick,
  fitBounds = true,
  center,
  zoom = 12,
  className = '',
  selectedPlaceId,
  hoveredPlaceId,
}: UniversalMapViewProps) {
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    longitude: center?.lng || 0,
    latitude: center?.lat || 20,
    zoom: zoom,
  });

  // Cluster index for handling marker clustering
  const clusterIndex = useRef(createClusterIndex()).current;
  const [clusters, setClusters] = useState<ClusterPoint[]>([]);

  // Determine if clustering should be enabled
  const enableClustering = useMemo(
    () => shouldEnableClustering(places.length),
    [places.length]
  );

  // Filter places with valid coordinates
  const validPlaces = useMemo(() => {
    return places.filter(
      (place) => place.coordinates?.lat && place.coordinates?.lng
    );
  }, [places]);

  // Convert places to GeoJSON features for clustering
  const geoJSONFeatures = useMemo(() => {
    return validPlaces.map((place) => placeToGeoJSON(place));
  }, [validPlaces]);

  // Load places into cluster index
  useEffect(() => {
    if (enableClustering && geoJSONFeatures.length > 0) {
      clusterIndex.load(geoJSONFeatures);
    }
  }, [enableClustering, geoJSONFeatures, clusterIndex]);

  // Update clusters when map moves or zooms
  const updateClusters = useCallback(() => {
    if (!enableClustering || !mapRef.current) return;

    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    const zoom = map.getZoom();

    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    const newClusters = getClusters(clusterIndex, bbox, zoom);
    setClusters(newClusters);
  }, [enableClustering, clusterIndex]);

  // Update clusters on map move/zoom
  useEffect(() => {
    if (enableClustering && mapRef.current) {
      updateClusters();
    }
  }, [enableClustering, viewState, updateClusters]);

  // Group places by day for route lines
  const routesByDay = useMemo(() => {
    if (!routes || routes.length === 0) return {};

    const grouped: Record<number, MapPlace[]> = {};

    routes.forEach((route) => {
      const routePlaces = route.stops
        .map((stopId) => validPlaces.find((p) => p.id === stopId))
        .filter((p): p is MapPlace => p !== undefined);

      if (routePlaces.length > 0) {
        grouped[route.day] = routePlaces;
      }
    });

    return grouped;
  }, [routes, validPlaces]);

  // Create GeoJSON features for route lines
  const routeFeatures = useMemo(() => {
    return Object.entries(routesByDay).map(([day, dayPlaces]) => {
      const coordinates = dayPlaces.map((place) => [
        place.coordinates.lng,
        place.coordinates.lat,
      ]);

      const dayNum = parseInt(day);
      const color = DAY_COLORS[(dayNum - 1) % DAY_COLORS.length];

      return {
        type: 'Feature' as const,
        properties: { day: dayNum, color },
        geometry: {
          type: 'LineString' as const,
          coordinates,
        },
      };
    });
  }, [routesByDay]);

  // Auto-fit bounds to show all markers
  useEffect(() => {
    if (!fitBounds || validPlaces.length === 0 || !mapRef.current) return;

    const coords = validPlaces.map((p) => p.coordinates);
    const bounds = calculateBounds(coords);

    if (!bounds) return;

    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;

    // Calculate appropriate zoom level based on bounds
    const lngDiff = bounds.maxLng - bounds.minLng;
    const latDiff = bounds.maxLat - bounds.minLat;
    const maxDiff = Math.max(lngDiff, latDiff);

    let zoomLevel = 11;
    if (maxDiff > 10) zoomLevel = 6;
    else if (maxDiff > 5) zoomLevel = 8;
    else if (maxDiff > 1) zoomLevel = 10;
    else if (maxDiff > 0.1) zoomLevel = 12;
    else zoomLevel = 14;

    setViewState({
      longitude: centerLng,
      latitude: centerLat,
      zoom: zoomLevel,
    });
  }, [validPlaces, fitBounds]);

  // Focus on selected place
  useEffect(() => {
    if (!selectedPlaceId || !mapRef.current) return;

    const place = validPlaces.find((p) => p.id === selectedPlaceId);
    if (!place) return;

    setViewState((prev) => ({
      ...prev,
      longitude: place.coordinates.lng,
      latitude: place.coordinates.lat,
      zoom: Math.max(prev.zoom, 14),
    }));
  }, [selectedPlaceId, validPlaces]);

  // Handle marker click
  const handleMarkerClick = useCallback(
    (placeId: string) => {
      if (onMarkerClick) {
        onMarkerClick(placeId);
      }
    },
    [onMarkerClick]
  );

  // Handle cluster click - zoom to expansion zoom
  const handleClusterClick = useCallback(
    (clusterId: number, coordinates: [number, number]) => {
      if (!mapRef.current) return;

      const expansionZoom = getClusterExpansionZoom(clusterIndex, clusterId);

      setViewState((prev) => ({
        ...prev,
        longitude: coordinates[0],
        latitude: coordinates[1],
        zoom: expansionZoom,
      }));
    },
    [clusterIndex]
  );

  // Render marker icon
  const renderMarkerIcon = (type: MapPlace['type']) => {
    const iconProps = { className: 'w-3 h-3 text-white' };

    switch (type) {
      case 'hotel':
        return <Bed {...iconProps} />;
      case 'food':
        return <Utensils {...iconProps} />;
      case 'spot':
        return <Compass {...iconProps} />;
      case 'activity':
        return <MapPin {...iconProps} />;
      default:
        return <MapPin {...iconProps} />;
    }
  };

  // Determine which places/clusters to display
  const displayItems = enableClustering ? clusters : geoJSONFeatures;

  return (
    <div className={cn('relative h-full w-full', className)}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => {
          setViewState(evt.viewState);
          if (enableClustering) {
            updateClusters();
          }
        }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        interactive={interactive}
        dragPan={interactive}
        scrollZoom={interactive}
        doubleClickZoom={interactive}
      >
        {/* Navigation Controls */}
        {interactive && <NavigationControl position="top-right" />}

        {/* Route Lines */}
        {routeFeatures.length > 0 && (
          <Source
            id="routes"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: routeFeatures,
            }}
          >
            {routeFeatures.map((feature, idx) => (
              <Layer
                key={`route-${idx}`}
                id={`route-line-${idx}`}
                type="line"
                source="routes"
                filter={['==', 'day', feature.properties.day]}
                paint={{
                  'line-color': feature.properties.color,
                  'line-width': 3,
                  'line-opacity': 0.8,
                }}
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round',
                }}
              />
            ))}
          </Source>
        )}

        {/* Markers or Clusters */}
        {enableClustering ? (
          // Render clusters
          <>
            {clusters.map((cluster) => {
              const [lng, lat] = cluster.geometry.coordinates;
              const { cluster: isCluster, point_count, id } = cluster.properties;

              if (isCluster) {
                // Render cluster marker
                return (
                  <Marker
                    key={`cluster-${cluster.properties.cluster_id}`}
                    longitude={lng}
                    latitude={lat}
                    anchor="center"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      handleClusterClick(
                        cluster.properties.cluster_id!,
                        [lng, lat]
                      );
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full bg-primary text-white font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        width: `${Math.min(30 + (point_count! / 10) * 5, 60)}px`,
                        height: `${Math.min(30 + (point_count! / 10) * 5, 60)}px`,
                      }}
                    >
                      {formatClusterCount(point_count!)}
                    </div>
                  </Marker>
                );
              }

              // Render individual marker
              const place = cluster.properties as unknown as MapPlace;
              const color = MARKER_COLORS[place.type];
              const isSelected = selectedPlaceId === place.id;
              const isHovered = hoveredPlaceId === place.id;

              return (
                <Marker
                  key={`marker-${place.id}`}
                  longitude={lng}
                  latitude={lat}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleMarkerClick(place.id);
                  }}
                >
                  <div className="relative">
                    {/* Day badge */}
                    {place.day && (
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-lg z-10">
                        {place.day}
                      </div>
                    )}

                    {/* Marker dot */}
                    <div
                      className={cn(
                        'cursor-pointer transition-all duration-200',
                        'rounded-full w-10 h-10 shadow-lg flex items-center justify-center',
                        'hover:scale-110',
                        isSelected && 'ring-4 ring-primary scale-125',
                        isHovered && 'ring-4 ring-primary/50 scale-110'
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {renderMarkerIcon(place.type)}
                    </div>
                  </div>
                </Marker>
              );
            })}
          </>
        ) : (
          // Render all markers without clustering
          <>
            {validPlaces.map((place) => {
              const color = MARKER_COLORS[place.type];
              const isSelected = selectedPlaceId === place.id;
              const isHovered = hoveredPlaceId === place.id;

              return (
                <Marker
                  key={`marker-${place.id}`}
                  longitude={place.coordinates.lng}
                  latitude={place.coordinates.lat}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleMarkerClick(place.id);
                  }}
                >
                  <div className="relative">
                    {/* Day badge */}
                    {place.day && (
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-lg z-10">
                        {place.day}
                      </div>
                    )}

                    {/* Marker dot */}
                    <div
                      className={cn(
                        'cursor-pointer transition-all duration-200',
                        'rounded-full w-10 h-10 shadow-lg flex items-center justify-center',
                        'hover:scale-110',
                        isSelected && 'ring-4 ring-primary scale-125',
                        isHovered && 'ring-4 ring-primary/50 scale-110'
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {renderMarkerIcon(place.type)}
                    </div>
                  </div>
                </Marker>
              );
            })}
          </>
        )}
      </Map>

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 rounded-xl border-2 border-border bg-card/95 backdrop-blur-sm p-3 shadow-lg">
          <h4 className="text-xs font-bold text-foreground mb-2">Map Legend</h4>
          <div className="space-y-1.5">
            {Object.entries(MARKER_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="rounded-full w-3 h-3 shadow-md"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-foreground capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {showStats && validPlaces.length > 0 && (
        <div className="absolute top-4 left-4 rounded-xl border-2 border-border bg-card/95 backdrop-blur-sm p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{validPlaces.length}</p>
              <p className="text-xs text-muted-foreground">Places</p>
            </div>
            {Object.keys(routesByDay).length > 0 && (
              <>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {Object.keys(routesByDay).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Days</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {validPlaces.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-accent/30">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No places to display</p>
          </div>
        </div>
      )}
    </div>
  );
}
