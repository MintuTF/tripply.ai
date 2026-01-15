'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import type { TravelPlace, CategorizedPlaces } from '@/lib/travel/types';
import { openDirectionsFromCurrentLocation, openLocation } from '@/lib/maps/directions';
import { calculateDistance, formatDistance } from '@/lib/maps/distance';
import type { MapPlace } from '@/components/maps/UniversalMapView';

// Dynamically import map to avoid SSR issues
const UniversalMapView = dynamic(
  () => import('@/components/maps/UniversalMapView'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full rounded-2xl bg-accent/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <MapPin className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface LocationMapSectionProps {
  place: TravelPlace;
  nearbyPlaces: CategorizedPlaces;
}

/**
 * Map categories to card types
 */
function categoriesToType(categories: string[]): 'hotel' | 'spot' | 'food' | 'activity' {
  const categoryStr = categories.join(' ').toLowerCase();

  if (categoryStr.includes('hotel') || categoryStr.includes('accommodation')) {
    return 'hotel';
  }
  if (categoryStr.includes('restaurant') || categoryStr.includes('food') || categoryStr.includes('cafe')) {
    return 'food';
  }
  if (categoryStr.includes('activity') || categoryStr.includes('tour') || categoryStr.includes('sport')) {
    return 'activity';
  }
  return 'spot'; // Default to spot/attraction
}

export function LocationMapSection({ place, nearbyPlaces }: LocationMapSectionProps) {
  // Convert main place and nearby places to MapPlace format
  const mapPlaces = useMemo(() => {
    const places: MapPlace[] = [];

    // Add main place (always first)
    if (place.coordinates) {
      places.push({
        id: place.id,
        name: place.name,
        coordinates: place.coordinates,
        type: categoriesToType(place.categories),
        isMainPlace: true, // Custom flag to identify the main place
      });
    }

    // Add nearby hotels
    nearbyPlaces.hotels?.forEach((hotel) => {
      if (hotel.coordinates && hotel.id !== place.id) {
        places.push({
          id: hotel.id,
          name: hotel.name,
          coordinates: hotel.coordinates,
          type: 'hotel',
        });
      }
    });

    // Add nearby restaurants
    nearbyPlaces.restaurants?.forEach((restaurant) => {
      if (restaurant.coordinates && restaurant.id !== place.id) {
        places.push({
          id: restaurant.id,
          name: restaurant.name,
          coordinates: restaurant.coordinates,
          type: 'food',
        });
      }
    });

    // Add nearby activities
    nearbyPlaces.activities?.forEach((activity) => {
      if (activity.coordinates && activity.id !== place.id) {
        places.push({
          id: activity.id,
          name: activity.name,
          coordinates: activity.coordinates,
          type: 'activity',
        });
      }
    });

    return places;
  }, [place, nearbyPlaces]);

  // Calculate distance from main place to current user location (placeholder)
  const distanceInfo = useMemo(() => {
    if (!place.coordinates) return null;

    // Count nearby places
    const nearbyCount = mapPlaces.length - 1; // Exclude main place

    return {
      nearbyCount,
      address: place.address || 'Address not available',
    };
  }, [place, mapPlaces]);

  // Handle marker click - navigate to place detail page
  const handleMarkerClick = (placeId: string) => {
    if (placeId !== place.id) {
      // Navigate to the clicked place's detail page
      window.location.href = `/travel/places/${placeId}`;
    }
  };

  // Handle Get Directions button
  const handleGetDirections = async () => {
    if (!place.coordinates) return;

    try {
      await openDirectionsFromCurrentLocation(
        place.coordinates,
        place.name,
        'walking' // Default to walking for city exploration
      );
    } catch (error) {
      console.error('Failed to open directions:', error);
      // Fallback: just open the location
      openLocation(place.coordinates, place.name);
    }
  };

  // Handle View in Maps button
  const handleViewInMaps = () => {
    if (!place.coordinates) return;
    openLocation(place.coordinates, place.name);
  };

  if (!place.coordinates) {
    return null; // Don't render if no coordinates
  }

  return (
    <section className="py-8 px-4 md:px-6 max-w-6xl mx-auto">
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Location & Map
            </h2>
            <p className="text-muted-foreground">
              {distanceInfo && distanceInfo.nearbyCount > 0
                ? `${distanceInfo.nearbyCount} nearby places • ${distanceInfo.address}`
                : distanceInfo?.address || 'Explore the area'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleGetDirections}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Get Directions</span>
            </button>
            <button
              onClick={handleViewInMaps}
              className="flex items-center gap-2 px-4 py-2 border border-border bg-card rounded-xl hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">View in Maps</span>
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border-2 border-border shadow-xl">
          <UniversalMapView
            places={mapPlaces}
            interactive={true}
            showLegend={mapPlaces.length > 5} // Only show legend if there are many places
            showStats={false} // Don't need stats for single place view
            onMarkerClick={handleMarkerClick}
            fitBounds={true}
            className="h-[500px]"
            selectedPlaceId={place.id} // Highlight the main place
          />
        </div>

        {/* Nearby Places Summary */}
        {distanceInfo && distanceInfo.nearbyCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {nearbyPlaces.hotels && nearbyPlaces.hotels.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nearby Hotels</p>
                  <p className="text-lg font-bold text-foreground">
                    {nearbyPlaces.hotels.length}
                  </p>
                </div>
              </div>
            )}

            {nearbyPlaces.restaurants && nearbyPlaces.restaurants.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/10">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nearby Restaurants</p>
                  <p className="text-lg font-bold text-foreground">
                    {nearbyPlaces.restaurants.length}
                  </p>
                </div>
              </div>
            )}

            {nearbyPlaces.activities && nearbyPlaces.activities.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/10">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nearby Activities</p>
                  <p className="text-lg font-bold text-foreground">
                    {nearbyPlaces.activities.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Address Info */}
        {place.address && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card/50">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Address</p>
              <p className="text-sm text-muted-foreground">{place.address}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
