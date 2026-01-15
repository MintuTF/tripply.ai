'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion } from 'framer-motion';
import { Map as MapIcon, Maximize2, Minimize2, MapPin } from 'lucide-react';
import type { PlaceCard } from '@/types';
import { cn } from '@/lib/utils';

interface ChatMapSidebarProps {
  places: PlaceCard[];
  center: { lat: number; lng: number };
  onPlaceClick?: (place: PlaceCard) => void;
  className?: string;
}

const MARKER_COLORS: Record<PlaceCard['type'], string> = {
  hotel: '#f43f5e',
  restaurant: '#f97316',
  activity: '#a855f7',
  spot: '#3b82f6',
};

export function ChatMapSidebar({
  places,
  center,
  onPlaceClick,
  className,
}: ChatMapSidebarProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [center.lng, center.lat],
      zoom: 13,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();
      map.current?.remove();
      map.current = null;
    };
  }, [center.lng, center.lat]);

  // Create marker element
  const createMarkerElement = useCallback(
    (place: PlaceCard) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.cursor = 'pointer';

      const color = MARKER_COLORS[place.type] || MARKER_COLORS.spot;

      el.innerHTML = `
        <div class="w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl border-2 border-white"
             style="background-color: ${color}">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onPlaceClick?.(place);
      });

      return el;
    },
    [onPlaceClick]
  );

  // Add/update markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current.clear();

    const placesWithCoords = places.filter((p) => p.coordinates);

    placesWithCoords.forEach((place) => {
      if (!place.coordinates) return;

      const el = createMarkerElement(place);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([place.coordinates.lng, place.coordinates.lat])
        .addTo(map.current!);

      markers.current.set(place.id, marker);
    });

    // Auto-fit bounds if we have places with coordinates
    if (placesWithCoords.length > 0 && map.current) {
      const bounds = new maplibregl.LngLatBounds();

      placesWithCoords.forEach((place) => {
        if (place.coordinates) {
          bounds.extend([place.coordinates.lng, place.coordinates.lat]);
        }
      });

      map.current.fitBounds(bounds, {
        padding: 40,
        maxZoom: 14,
        duration: 800,
      });
    }
  }, [places, isMapLoaded, createMarkerElement]);

  if (places.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border-2 border-border bg-background overflow-hidden shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {places.length} {places.length === 1 ? 'Place' : 'Places'}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label={isExpanded ? 'Collapse map' : 'Expand map'}
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Map Container */}
      <motion.div
        ref={mapContainer}
        className="w-full"
        animate={{ height: isExpanded ? 400 : 200 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}
