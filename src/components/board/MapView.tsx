'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Map from 'react-map-gl/maplibre';
import { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import { Card } from '@/types';
import { cn } from '@/lib/utils';
import { MapPin, Utensils, Bed, Compass } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapViewProps {
  cards: Card[];
  selectedCardId?: string;
  hoveredCardId?: string;
  onCardClick?: (card: Card) => void;
  onCardHover?: (cardId: string | undefined) => void;
  showSidebar?: boolean;
  searchResults?: Card[] | null;
  searchLocation?: string;
}

// Map marker colors by card type
const MARKER_COLORS = {
  hotel: '#10b981', // green
  spot: '#3b82f6', // blue
  food: '#f59e0b', // orange
  activity: '#8b5cf6', // purple
  note: '#6b7280', // gray
};

export function MapView({
  cards,
  selectedCardId,
  hoveredCardId,
  onCardClick,
  onCardHover,
  showSidebar = false,
  searchResults,
  searchLocation
}: MapViewProps) {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 2,
  });

  // Combine cards with search results
  const allCards = useMemo(() => {
    if (searchResults && searchResults.length > 0) {
      // When searching, show search results
      return searchResults;
    }
    // Otherwise show saved cards
    return cards;
  }, [cards, searchResults]);

  // Filter cards with coordinates
  const cardsWithCoords = useMemo(() => {
    return allCards.filter((card) => {
      const payload = typeof card.payload_json === 'string'
        ? JSON.parse(card.payload_json)
        : card.payload_json;
      return payload.coordinates?.lat && payload.coordinates?.lng;
    });
  }, [allCards]);

  // Group scheduled cards by day for route lines
  const routesByDay = useMemo(() => {
    const grouped: Record<number, Card[]> = {};
    cardsWithCoords
      .filter((c) => c.day)
      .forEach((card) => {
        const day = card.day!;
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(card);
      });

    // Sort by order within each day
    Object.keys(grouped).forEach((day) => {
      grouped[parseInt(day)].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return grouped;
  }, [cardsWithCoords]);

  // Create route line features for each day
  const routeFeatures = useMemo(() => {
    return Object.entries(routesByDay).map(([day, dayCards]) => {
      const coordinates = dayCards.map((card) => {
        const payload = typeof card.payload_json === 'string'
          ? JSON.parse(card.payload_json)
          : card.payload_json;
        return [payload.coordinates.lng, payload.coordinates.lat];
      });

      return {
        type: 'Feature' as const,
        properties: { day: parseInt(day) },
        geometry: {
          type: 'LineString' as const,
          coordinates,
        },
      };
    });
  }, [routesByDay]);

  // Auto-fit bounds to show all markers
  useEffect(() => {
    if (cardsWithCoords.length === 0) return;

    const bounds = cardsWithCoords.reduce(
      (acc, card) => {
        const payload = typeof card.payload_json === 'string'
          ? JSON.parse(card.payload_json)
          : card.payload_json;
        const { lat, lng } = payload.coordinates;

        return {
          minLng: Math.min(acc.minLng, lng),
          maxLng: Math.max(acc.maxLng, lng),
          minLat: Math.min(acc.minLat, lat),
          maxLat: Math.max(acc.maxLat, lat),
        };
      },
      {
        minLng: Infinity,
        maxLng: -Infinity,
        minLat: Infinity,
        maxLat: -Infinity,
      }
    );

    // Calculate center and zoom
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;

    setViewState({
      longitude: centerLng,
      latitude: centerLat,
      zoom: 11,
    });
  }, [cardsWithCoords]);

  // Focus on selected card
  useEffect(() => {
    if (!selectedCardId) return;
    const card = cardsWithCoords.find((c) => c.id === selectedCardId);
    if (!card) return;

    const payload = typeof card.payload_json === 'string'
      ? JSON.parse(card.payload_json)
      : card.payload_json;

    if (payload.coordinates) {
      setViewState((prev) => ({
        ...prev,
        longitude: payload.coordinates.lng,
        latitude: payload.coordinates.lat,
        zoom: 14,
      }));
    }
  }, [selectedCardId, cardsWithCoords]);

  // Center map on search location
  useEffect(() => {
    if (!searchLocation || searchLocation.trim() === '') return;

    // Use the geocoding API to get coordinates for the location
    const geocodeLocation = async () => {
      try {
        const response = await fetch(`/api/places/geocode?address=${encodeURIComponent(searchLocation)}`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.location) {
          setViewState({
            longitude: data.location.lng,
            latitude: data.location.lat,
            zoom: 12,
          });
        }
      } catch (error) {
        console.error('Failed to geocode location:', error);
      }
    };

    geocodeLocation();
  }, [searchLocation]);

  const handleMarkerClick = useCallback((card: Card) => {
    onCardClick?.(card);
  }, [onCardClick]);

  return (
    <div className="relative h-full w-full">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />

        {/* Route Lines */}
        {routeFeatures.length > 0 && (
          <Source
            id="route"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: routeFeatures,
            }}
          >
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 3,
                'line-opacity': 0.8,
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
            />
          </Source>
        )}

        {/* Markers */}
        {cardsWithCoords.map((card, index) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          const color = MARKER_COLORS[card.type as keyof typeof MARKER_COLORS] || MARKER_COLORS.note;

          // Create unique key using card.id, or place_id with index to ensure uniqueness
          const uniqueKey = card.id || `${payload.place_id || 'marker'}-${index}`;

          const isHotel = card.type === 'hotel';

          return (
            <Marker
              key={uniqueKey}
              longitude={payload.coordinates.lng}
              latitude={payload.coordinates.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(card);
              }}
            >
              <div className="relative">
                {/* Day badge */}
                {card.day && (
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-lg z-10">
                    {card.day}
                  </div>
                )}

                {/* Hotel Price Badge or Simple Dot Marker */}
                {isHotel ? (
                  <div className="relative group/hotel">
                    {/* Hotel marker with bed icon and price */}
                    <div
                      className={cn(
                        'cursor-pointer transition-all duration-200 hover:scale-110',
                        'flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg bg-white border-2',
                        selectedCardId === card.id && 'ring-2 ring-primary scale-110 border-pink-500',
                        hoveredCardId === card.id && 'ring-2 ring-primary/50 scale-105 border-pink-400'
                      )}
                      style={{ borderColor: selectedCardId === card.id || hoveredCardId === card.id ? undefined : '#ec4899' }}
                      onMouseEnter={() => onCardHover?.(card.id)}
                      onMouseLeave={() => onCardHover?.(undefined)}
                    >
                      <div className="w-5 h-5 rounded bg-pink-500 flex items-center justify-center flex-shrink-0">
                        <Bed className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 max-w-[100px] truncate">{payload.name}</span>
                    </div>

                    {/* Hover preview card */}
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 opacity-0 invisible group-hover/hotel:opacity-100 group-hover/hotel:visible transition-all duration-200 z-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick?.(card);
                      }}
                    >
                      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden hover:shadow-3xl transition-shadow">
                        {/* Photo */}
                        {payload.photos?.[0] && (
                          <div className="h-32 w-full">
                            <img src={payload.photos[0]} alt={payload.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        {/* Content */}
                        <div className="p-3">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm flex-1">{payload.name}</h3>
                          </div>
                          <div className="flex items-center gap-1 text-sm mb-1">
                            <span className="font-medium text-gray-800">{payload.rating || 4.0}</span>
                            <div className="flex text-yellow-400">
                              {'★'.repeat(Math.floor(payload.rating || 4))}
                            </div>
                            <span className="text-gray-500">({payload.review_count || 0})</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {payload.amenities?.slice(0, 2).join(' · ') || 'Hotel'}
                          </p>
                          <div className="flex items-center justify-center gap-2 bg-cyan-50 text-cyan-700 rounded-lg py-2 text-sm font-medium">
                            <Bed className="w-4 h-4" />
                            Check availability
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : card.type === 'food' ? (
                  // Restaurant marker with icon, name, and hover preview
                  <div className="relative group/food">
                    <div
                      className={cn(
                        'cursor-pointer transition-all duration-200 hover:scale-105',
                        'flex items-center gap-1 px-2 py-1 rounded-full shadow-lg bg-white border-2',
                        selectedCardId === card.id && 'ring-2 ring-primary scale-110 border-orange-500',
                        hoveredCardId === card.id && 'ring-2 ring-primary/50 scale-105 border-orange-400'
                      )}
                      style={{ borderColor: selectedCardId === card.id || hoveredCardId === card.id ? undefined : '#f59e0b' }}
                      onMouseEnter={() => onCardHover?.(card.id)}
                      onMouseLeave={() => onCardHover?.(undefined)}
                    >
                      <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <Utensils className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800 max-w-[120px] truncate">
                        {payload.name}
                      </span>
                    </div>

                    {/* Hover preview card */}
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 opacity-0 invisible group-hover/food:opacity-100 group-hover/food:visible transition-all duration-200 z-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick?.(card);
                      }}
                    >
                      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden hover:shadow-3xl transition-shadow">
                        {/* Photo */}
                        {payload.photos?.[0] && (
                          <div className="h-32 w-full">
                            <img src={payload.photos[0]} alt={payload.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        {/* Content */}
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-900 text-sm">{payload.name}</h3>
                          <div className="flex items-center gap-1 text-sm mb-1">
                            <span className="font-medium text-gray-800">{payload.rating || 4.0}</span>
                            <div className="flex text-yellow-400">
                              {'★'.repeat(Math.floor(payload.rating || 4))}
                            </div>
                            <span className="text-gray-500">({payload.review_count || 0})</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {payload.cuisine_type || 'Restaurant'}
                          </p>
                          <div className="flex items-center justify-center gap-2 bg-orange-50 text-orange-700 rounded-lg py-2 text-sm font-medium">
                            <Utensils className="w-4 h-4" />
                            View details
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : card.type === 'spot' ? (
                  // Things to Do marker with compass icon, name, and hover preview
                  <div className="relative group/spot">
                    <div
                      className={cn(
                        'cursor-pointer transition-all duration-200 hover:scale-105',
                        'flex items-center gap-1 px-2 py-1 rounded-full shadow-lg bg-white border-2',
                        selectedCardId === card.id && 'ring-2 ring-primary scale-110 border-blue-500',
                        hoveredCardId === card.id && 'ring-2 ring-primary/50 scale-105 border-blue-400'
                      )}
                      style={{ borderColor: selectedCardId === card.id || hoveredCardId === card.id ? undefined : '#3b82f6' }}
                      onMouseEnter={() => onCardHover?.(card.id)}
                      onMouseLeave={() => onCardHover?.(undefined)}
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Compass className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800 max-w-[120px] truncate">
                        {payload.name}
                      </span>
                    </div>

                    {/* Hover preview card */}
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 opacity-0 invisible group-hover/spot:opacity-100 group-hover/spot:visible transition-all duration-200 z-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick?.(card);
                      }}
                    >
                      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden hover:shadow-3xl transition-shadow">
                        {/* Photo */}
                        {payload.photos?.[0] && (
                          <div className="h-32 w-full">
                            <img src={payload.photos[0]} alt={payload.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        {/* Content */}
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-900 text-sm">{payload.name}</h3>
                          <div className="flex items-center gap-1 text-sm mb-1">
                            <span className="font-medium text-gray-800">{payload.rating || 4.0}</span>
                            <div className="flex text-yellow-400">
                              {'★'.repeat(Math.floor(payload.rating || 4))}
                            </div>
                            <span className="text-gray-500">({payload.review_count || 0})</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {payload.type || 'Attraction'}
                          </p>
                          <div className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 rounded-lg py-2 text-sm font-medium">
                            <Compass className="w-4 h-4" />
                            Learn more
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Other types: colored dot markers
                  <div
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:scale-125',
                      'rounded-full w-3 h-3 shadow-md',
                      selectedCardId === card.id && 'ring-4 ring-primary scale-150',
                      hoveredCardId === card.id && 'ring-4 ring-primary/50 scale-150'
                    )}
                    style={{ backgroundColor: color }}
                    onMouseEnter={() => onCardHover?.(card.id)}
                    onMouseLeave={() => onCardHover?.(undefined)}
                  />
                )}
              </div>
            </Marker>
          );
        })}

      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-xl border-2 border-border bg-card/95 backdrop-blur-sm p-3 shadow-lg">
        <h4 className="text-xs font-bold text-foreground mb-2">Map Legend</h4>
        <div className="space-y-1.5">
          {Object.entries(MARKER_COLORS).map(([type, color]) => {
            return (
              <div key={type} className="flex items-center gap-2">
                {type === 'hotel' ? (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white border-2 border-pink-500 shadow-sm">
                    <div className="w-4 h-4 rounded bg-pink-500 flex items-center justify-center">
                      <Bed className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                ) : type === 'food' ? (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white border-2 border-orange-500 shadow-sm">
                    <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                      <Utensils className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-700">Name</span>
                  </div>
                ) : (
                  <div
                    className="rounded-full w-3 h-3 shadow-md"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="text-xs text-foreground capitalize">{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 left-4 rounded-xl border-2 border-border bg-card/95 backdrop-blur-sm p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{cardsWithCoords.length}</p>
            <p className="text-xs text-muted-foreground">Locations</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{Object.keys(routesByDay).length}</p>
            <p className="text-xs text-muted-foreground">Days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
