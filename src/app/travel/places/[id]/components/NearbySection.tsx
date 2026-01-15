'use client';

import { useRouter } from 'next/navigation';
import { Hotel, MapPin, UtensilsCrossed } from 'lucide-react';
import type { TravelPlace } from '@/lib/travel/types';
import type { LucideIcon } from 'lucide-react';
import { NearbyPlaceCard } from '@/components/travel/NearbyPlaceCard';

interface NearbySectionProps {
  nearbyPlaces: {
    hotels: TravelPlace[];
    activities: TravelPlace[];
    restaurants: TravelPlace[];
  };
}

interface NearbyCategoryProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  places: TravelPlace[];
  highlightMetrics: ('distance' | 'price' | 'duration' | 'timing' | 'cuisine' | 'bestTime')[];
  onPlaceClick: (place: TravelPlace) => void;
}

function NearbyCategory({
  icon: Icon,
  title,
  subtitle,
  places,
  highlightMetrics,
  onPlaceClick,
}: NearbyCategoryProps) {
  if (places.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <Icon className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>

      {/* Horizontal Scroll of Cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {places.slice(0, 8).map((place) => (
          <NearbyPlaceCard
            key={place.id}
            place={place}
            onClick={onPlaceClick}
            highlightMetrics={highlightMetrics}
          />
        ))}
      </div>
    </div>
  );
}

export function NearbySection({ nearbyPlaces }: NearbySectionProps) {
  const router = useRouter();

  const handlePlaceClick = (place: TravelPlace) => {
    // Navigate to the detail page for this nearby place
    router.push(`/travel/places/${place.id}`);
  };
  const hasAnyNearby =
    nearbyPlaces.hotels.length > 0 ||
    nearbyPlaces.activities.length > 0 ||
    nearbyPlaces.restaurants.length > 0;

  if (!hasAnyNearby) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-100/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Smart Nearby Recommendations
            </h2>
            <p className="text-gray-600">
              No nearby places found. Check back later for recommendations.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-purple-100/50 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Smart Nearby Recommendations
          </h2>
          <p className="text-gray-600 mb-8">
            Discover great places within walking distance
          </p>

          {/* Hotels Nearby */}
          <NearbyCategory
            icon={Hotel}
            title="Hotels Nearby"
            subtitle="Places to stay within walking distance"
            places={nearbyPlaces.hotels}
            onPlaceClick={handlePlaceClick}
            highlightMetrics={['distance', 'price']}
          />

          {/* Activities Nearby */}
          <NearbyCategory
            icon={MapPin}
            title="Activities Nearby"
            subtitle="Perfect before or after this place"
            places={nearbyPlaces.activities}
            onPlaceClick={handlePlaceClick}
            highlightMetrics={['duration', 'timing']}
          />

          {/* Restaurants Nearby */}
          <NearbyCategory
            icon={UtensilsCrossed}
            title="Restaurants Nearby"
            subtitle="Dining options for lunch, dinner, or coffee"
            places={nearbyPlaces.restaurants}
            onPlaceClick={handlePlaceClick}
            highlightMetrics={['cuisine', 'bestTime']}
          />
        </div>
      </div>
    </section>
  );
}
