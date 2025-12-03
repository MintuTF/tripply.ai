'use client';

import { useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import { MapPin } from 'lucide-react';
import type { PlaceCard } from '@/types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  places: PlaceCard[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  onPlaceClick?: (place: PlaceCard) => void;
}

export function MapView({
  places,
  center,
  zoom = 13,
  height = '400px',
  onPlaceClick
}: MapViewProps) {
  const [selectedPlace, setSelectedPlace] = useState<PlaceCard | null>(null);

  // Calculate center from places if not provided
  const mapCenter = center || (places.length > 0 && places[0].coordinates
    ? places[0].coordinates
    : { lat: 48.8566, lng: 2.3522 }); // Default to Paris

  const [viewState, setViewState] = useState({
    longitude: mapCenter.lng,
    latitude: mapCenter.lat,
    zoom,
  });

  const handleMarkerClick = useCallback((place: PlaceCard) => {
    setSelectedPlace(place);
    onPlaceClick?.(place);
  }, [onPlaceClick]);

  // Mapbox token from environment
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja2x4Y3g2NjgwMDAwMnBsZmh2Nm5wNjVmIn0.example';

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Map Controls */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Place Markers */}
        {places.map((place) => {
          if (!place.coordinates) return null;

          return (
            <Marker
              key={place.id}
              longitude={place.coordinates.lng}
              latitude={place.coordinates.lat}
              anchor="bottom"
              onClick={() => handleMarkerClick(place)}
            >
              <div className="relative cursor-pointer group">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-card px-3 py-2 rounded-lg shadow-lg border border-border whitespace-nowrap">
                    <p className="text-sm font-semibold text-foreground">{place.name}</p>
                    {place.rating && (
                      <p className="text-xs text-muted-foreground">
                        ⭐ {place.rating}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-200
                  ${place.type === 'hotel' ? 'bg-blue-500' : ''}
                  ${place.type === 'restaurant' ? 'bg-orange-500' : ''}
                  ${place.type === 'activity' ? 'bg-green-500' : ''}
                  ${place.type === 'location' ? 'bg-purple-500' : ''}
                  group-hover:scale-125 group-hover:shadow-xl
                `}>
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Selected Place Popup */}
        {selectedPlace && selectedPlace.coordinates && (
          <Popup
            longitude={selectedPlace.coordinates.lng}
            latitude={selectedPlace.coordinates.lat}
            anchor="top"
            onClose={() => setSelectedPlace(null)}
            closeButton={true}
            closeOnClick={false}
            className="map-popup"
          >
            <div className="p-2 min-w-[200px]">
              {selectedPlace.photos[0] && (
                <img
                  src={selectedPlace.photos[0]}
                  alt={selectedPlace.name}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
              )}
              <h3 className="font-bold text-foreground mb-1">{selectedPlace.name}</h3>
              {selectedPlace.rating && (
                <p className="text-sm text-muted-foreground mb-1">
                  ⭐ {selectedPlace.rating} ({selectedPlace.review_count} reviews)
                </p>
              )}
              {selectedPlace.address && (
                <p className="text-xs text-muted-foreground">{selectedPlace.address}</p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
