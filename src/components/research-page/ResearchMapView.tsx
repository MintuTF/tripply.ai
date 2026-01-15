'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Hotel, UtensilsCrossed, Compass, X, Loader2, Eye, EyeOff } from 'lucide-react';
import type { PlaceCard } from '@/types';
import { cn } from '@/lib/utils';

interface ResearchMapViewProps {
  places: PlaceCard[];
  savedPlaces: PlaceCard[];
  destinationCoords: { lat: number; lng: number };
  destination: string;
  onSavePlace: (place: PlaceCard) => void;
  onUnsavePlace: (placeId: string) => void;
  selectedPlaceId?: string | null;
}

const MARKER_COLORS = {
  hotel: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', hex: '#f43f5e' },
  restaurant: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', hex: '#f97316' },
  activity: { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', hex: '#a855f7' },
  location: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', hex: '#3b82f6' },
};

const getMarkerIcon = (type: PlaceCard['type']) => {
  switch (type) {
    case 'hotel':
      return Hotel;
    case 'restaurant':
      return UtensilsCrossed;
    case 'activity':
      return Compass;
    default:
      return MapPin;
  }
};

export function ResearchMapView({
  places,
  savedPlaces,
  destinationCoords,
  destination,
  onSavePlace,
  onUnsavePlace,
  selectedPlaceId,
}: ResearchMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showDiscovered, setShowDiscovered] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceCard | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<PlaceCard | null>(null);

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
            attribution: '© OpenStreetMap contributors',
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
      center: [destinationCoords.lng, destinationCoords.lat],
      zoom: 13,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current.clear();
      map.current?.remove();
      map.current = null;
    };
  }, [destinationCoords.lng, destinationCoords.lat]);

  // Create marker element
  const createMarkerElement = useCallback((place: PlaceCard, isSaved: boolean) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.cursor = 'pointer';

    const Icon = getMarkerIcon(place.type);
    const colors = MARKER_COLORS[place.type];
    const size = isSaved ? 'w-10 h-10' : 'w-7 h-7';
    const opacity = isSaved ? 'opacity-100' : 'opacity-50';

    el.innerHTML = `
      <div class="${size} ${opacity} rounded-full ${colors.bg} shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl border-2 border-white">
        ${Icon === Hotel ? '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>' : ''}
        ${Icon === UtensilsCrossed ? '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>' : ''}
        ${Icon === Compass ? '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' : ''}
        ${Icon === MapPin ? '<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>' : ''}
      </div>
    `;

    el.addEventListener('click', () => {
      setSelectedPlace(place);
    });

    el.addEventListener('mouseenter', () => {
      setHoveredPlace(place);
    });

    el.addEventListener('mouseleave', () => {
      setHoveredPlace(null);
    });

    return el;
  }, []);

  // Add/update markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    const savedPlaceIds = new Set(savedPlaces.map(p => p.id));
    const placesToShow = showDiscovered ? places : savedPlaces;

    placesToShow.forEach(place => {
      if (!place.coordinates) return;

      const isSaved = savedPlaceIds.has(place.id);
      const el = createMarkerElement(place, isSaved);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([place.coordinates.lng, place.coordinates.lat])
        .addTo(map.current!);

      markers.current.set(place.id, marker);
    });

    // Auto-fit bounds if we have places with coordinates
    if (placesToShow.length > 0 && map.current) {
      const bounds = new maplibregl.LngLatBounds();
      let hasValidCoords = false;

      placesToShow.forEach(place => {
        if (place.coordinates && place.coordinates.lng && place.coordinates.lat) {
          bounds.extend([place.coordinates.lng, place.coordinates.lat]);
          hasValidCoords = true;
        }
      });

      // Only fit bounds if we actually have valid coordinates
      if (hasValidCoords) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
          duration: 1000,
        });
      }
    }
  }, [places, savedPlaces, showDiscovered, isMapLoaded, createMarkerElement]);

  // Handle selected place
  useEffect(() => {
    if (selectedPlaceId && map.current) {
      const place = [...places, ...savedPlaces].find(p => p.id === selectedPlaceId);
      if (place?.coordinates) {
        map.current.flyTo({
          center: [place.coordinates.lng, place.coordinates.lat],
          zoom: 15,
          duration: 1500,
        });
        setSelectedPlace(place);
      }
    }
  }, [selectedPlaceId, places, savedPlaces]);

  const handleSave = (place: PlaceCard) => {
    onSavePlace(place);
    setSelectedPlace(null);
  };

  const handleUnsave = (placeId: string) => {
    onUnsavePlace(placeId);
    setSelectedPlace(null);
  };

  const isSaved = (placeId: string) => savedPlaces.some(p => p.id === placeId);

  if (!destinationCoords) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-accent/30">
        <div className="text-center">
          <p className="text-muted-foreground">No destination coordinates available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 rounded-xl overflow-hidden" />

      {/* Loading Overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Toggle Discovered Places Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setShowDiscovered(!showDiscovered)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg transition-all',
            'bg-card border border-border hover:shadow-xl',
            'text-sm font-medium'
          )}
        >
          {showDiscovered ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide Discovered
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Show All Places
            </>
          )}
        </button>
      </div>

      {/* Stats Panel */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3">
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-foreground font-medium">{savedPlaces.length} saved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
              <span className="text-muted-foreground">{places.length} discovered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Preview */}
      <AnimatePresence>
        {hoveredPlace && !selectedPlace && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="bg-card border border-border rounded-xl shadow-xl p-3 w-64">
              {hoveredPlace.photos[0] && (
                <img
                  src={hoveredPlace.photos[0]}
                  alt={hoveredPlace.name}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
              )}
              <h4 className="font-semibold text-sm truncate">{hoveredPlace.name}</h4>
              {hoveredPlace.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-yellow-500">★</span>
                  <span className="text-xs text-muted-foreground">
                    {hoveredPlace.rating} ({hoveredPlace.review_count || 0})
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Place Popup */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-full max-w-md px-4"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {selectedPlace.photos[0] && (
                <img
                  src={selectedPlace.photos[0]}
                  alt={selectedPlace.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {selectedPlace.name}
                    </h3>
                    {selectedPlace.address && (
                      <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="flex-shrink-0 p-2 hover:bg-accent rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {selectedPlace.rating && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'text-sm',
                            i < Math.floor(selectedPlace.rating!) ? 'text-yellow-500' : 'text-gray-300'
                          )}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selectedPlace.rating} ({selectedPlace.review_count || 0} reviews)
                    </span>
                  </div>
                )}

                {selectedPlace.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {selectedPlace.description}
                  </p>
                )}

                <div className="flex gap-3">
                  {isSaved(selectedPlace.id) ? (
                    <button
                      onClick={() => handleUnsave(selectedPlace.id)}
                      className="flex-1 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
                    >
                      Unsave
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSave(selectedPlace)}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Save Place
                    </button>
                  )}
                  {selectedPlace.url && (
                    <a
                      href={selectedPlace.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors text-center"
                    >
                      View Details
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay when popup is open */}
      {selectedPlace && (
        <div
          className="absolute inset-0 bg-black/50 z-20"
          onClick={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
}
