'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import type { TravelPlace } from '@/lib/travel/types';
import { cn } from '@/lib/utils';

interface MapPanelProps {
  places: TravelPlace[];
  selectedId?: string;
  center: { lat: number; lng: number };
  onMarkerClick?: (place: TravelPlace) => void;
  className?: string;
}

export function MapPanel({
  places,
  selectedId,
  center,
  onMarkerClick,
  className
}: MapPanelProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxgl, setMapboxgl] = useState<any>(null);

  // Dynamically import mapbox-gl
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        const mapboxModule = await import('mapbox-gl');
        const mapbox = mapboxModule.default;

        // Set access token from env
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
          setError('Mapbox token not configured');
          setIsLoading(false);
          return;
        }

        mapbox.accessToken = token;
        setMapboxgl(mapbox);
      } catch (err) {
        console.error('Failed to load Mapbox:', err);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    loadMapbox();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxgl || !mapContainer.current || mapRef.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [center.lng, center.lat],
        zoom: 12,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.AttributionControl({ compact: true }));

      map.on('load', () => {
        setIsLoading(false);
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  }, [mapboxgl, center]);

  // Update center when it changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.flyTo({
        center: [center.lng, center.lat],
        zoom: 12,
        duration: 1500,
      });
    }
  }, [center]);

  // Add/update markers
  useEffect(() => {
    if (!mapRef.current || !mapboxgl) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    places.forEach(place => {
      const isSelected = place.id === selectedId;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'travel-map-marker';
      el.innerHTML = `
        <div class="relative group cursor-pointer">
          <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
            isSelected
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-125'
              : 'bg-white hover:scale-110'
          }">
            <svg class="w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-500'}" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
          ${isSelected ? `
            <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
              ${place.name}
            </div>
          ` : ''}
        </div>
      `;

      el.addEventListener('click', () => {
        onMarkerClick?.(place);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([place.coordinates.lng, place.coordinates.lat])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [places, selectedId, mapboxgl, onMarkerClick]);

  // Fly to selected place
  useEffect(() => {
    if (mapRef.current && selectedId) {
      const selectedPlace = places.find(p => p.id === selectedId);
      if (selectedPlace) {
        mapRef.current.flyTo({
          center: [selectedPlace.coordinates.lng, selectedPlace.coordinates.lat],
          zoom: 15,
          duration: 1000,
        });
      }
    }
  }, [selectedId, places]);

  if (error) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center bg-purple-50 rounded-2xl',
        className
      )}>
        <AlertCircle className="w-12 h-12 text-purple-300 mb-4" />
        <p className="text-gray-600 text-center">{error}</p>
        <p className="text-sm text-gray-500 mt-2">
          Check your Mapbox configuration
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('relative rounded-2xl overflow-hidden shadow-xl', className)}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-purple-50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="text-sm text-gray-600">Loading map...</span>
          </div>
        </div>
      )}

      {/* Map container */}
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Places count badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4 text-purple-500" />
          <span>{places.length} places</span>
        </div>
      </div>
    </motion.div>
  );
}
