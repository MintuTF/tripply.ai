'use client';

import { useState } from 'react';
import { Layout, Card } from '@/types';
import { ResultCard } from '@/components/cards/ResultCard';
import { MapPin, Compass } from 'lucide-react';

interface NearbyLayoutProps {
  data: any;
  layout: Layout;
  onLayoutChange?: (intent: string) => void;
}

/**
 * NearbyLayout - Map-first view with nearby places
 * Shows when user asks "what's near [location]" or "show me nearby restaurants"
 */
export function NearbyLayout({ data, layout }: NearbyLayoutProps) {
  const [radius, setRadius] = useState(data.radius || 1000); // meters
  const places = data.places || [];
  const center = data.center || data.location || 'Current location';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Nearby Places</h1>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Around {typeof center === 'string' ? center : center.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map & Controls */}
      <div className="border-b bg-muted/30 px-6 py-4">
        <div className="space-y-3">
          {/* Radius Slider */}
          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-medium">
              <span>Search Radius</span>
              <span className="text-muted-foreground">
                {radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}
              </span>
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="500"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Map Placeholder */}
          <div className="flex h-64 items-center justify-center rounded-lg border bg-muted/50">
            <div className="text-center text-muted-foreground">
              <Compass className="mx-auto mb-2 h-12 w-12" />
              <p className="text-sm">Map will be displayed here</p>
              <p className="text-xs">(Google Maps integration pending)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-6">
        {places.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {places.length} places found within {radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {places.map((place: any) => {
                const card: Card = {
                  id: place.id || `place-${Math.random()}`,
                  trip_id: data.trip_id || 'temp',
                  type: 'place',
                  data: place,
                  is_favorited: false,
                  created_at: new Date().toISOString(),
                };
                return <ResultCard key={card.id} card={card} variant="default" />;
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No places found</h3>
              <p className="text-sm text-muted-foreground">
                Try increasing the search radius or changing your location
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
