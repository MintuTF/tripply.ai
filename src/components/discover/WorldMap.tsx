'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, ChevronUp, ChevronDown, X, Star, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiscoverDestination } from './DestinationDetailCard';
import type { Region } from './RegionFilter';

// Region center coordinates for zooming
const REGION_VIEWS: Record<Region, { center: [number, number]; zoom: number }> = {
  all: { center: [20, 20], zoom: 1.5 },
  asia: { center: [100, 30], zoom: 3 },
  europe: { center: [15, 50], zoom: 3.5 },
  americas: { center: [-80, 10], zoom: 2.5 },
  africa: { center: [20, 0], zoom: 3 },
  oceania: { center: [140, -25], zoom: 3 },
};

interface WorldMapProps {
  destinations: DiscoverDestination[];
  selectedRegion: Region;
  onDestinationSelect?: (destination: DiscoverDestination) => void;
  className?: string;
}

export function WorldMap({
  destinations,
  selectedRegion,
  onDestinationSelect,
  className,
}: WorldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredDestination, setHoveredDestination] = useState<DiscoverDestination | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');

      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap contributors',
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
        center: REGION_VIEWS.all.center,
        zoom: REGION_VIEWS.all.zoom,
        attributionControl: false,
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsMapLoaded(true);
      });
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when destinations change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const updateMarkers = async () => {
      const maplibregl = (await import('maplibre-gl')).default;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Filter destinations by region if needed
      const filteredDestinations =
        selectedRegion === 'all'
          ? destinations
          : destinations.filter((d) => d.region === selectedRegion);

      // Add new markers
      filteredDestinations.forEach((destination) => {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'destination-marker';
        el.innerHTML = `
          <div class="w-8 h-8 rounded-full bg-primary shadow-lg flex items-center justify-center cursor-pointer transform transition-transform hover:scale-125 border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `;

        el.addEventListener('mouseenter', () => {
          setHoveredDestination(destination);
        });

        el.addEventListener('mouseleave', () => {
          setHoveredDestination(null);
        });

        el.addEventListener('click', () => {
          if (onDestinationSelect) {
            onDestinationSelect(destination);
          }
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([destination.coordinates.lng, destination.coordinates.lat])
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    };

    updateMarkers();
  }, [destinations, selectedRegion, isMapLoaded, onDestinationSelect]);

  // Update map view when region changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const view = REGION_VIEWS[selectedRegion];
    map.current.flyTo({
      center: view.center,
      zoom: view.zoom,
      duration: 1500,
    });
  }, [selectedRegion, isMapLoaded]);

  return (
    <div className={cn('relative', className)}>
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl',
          'bg-card border border-border',
          'hover:bg-accent transition-colors',
          isExpanded && 'rounded-b-none border-b-0'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Map className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">Interactive Map</p>
            <p className="text-sm text-muted-foreground">
              {isExpanded ? 'Click to collapse' : 'Click to explore destinations on the map'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Map container */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-b-xl border border-t-0 border-border"
          >
            <div ref={mapContainer} className="w-full h-[280px] sm:h-[350px] md:h-[400px] lg:h-[450px] relative">
              {/* Loading state */}
              {!isMapLoaded && (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              )}

              {/* Hover tooltip */}
              <AnimatePresence>
                {hoveredDestination && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-4 left-4 z-10 bg-card border border-border rounded-xl shadow-xl p-4 max-w-xs"
                  >
                    <div className="flex gap-3">
                      <img
                        src={hoveredDestination.image}
                        alt={hoveredDestination.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">
                          {hoveredDestination.name}
                        </h4>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {hoveredDestination.country}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{hoveredDestination.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-primary font-medium">
                      Click to explore
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
