'use client';

import { Star, MapPin, DollarSign, Clock } from 'lucide-react';
import type { TravelPlace } from '@/lib/travel/types';

interface NearbyPlaceCardProps {
  place: TravelPlace;
  onClick: (place: TravelPlace) => void;
  highlightMetrics?: ('distance' | 'price' | 'duration' | 'timing' | 'cuisine' | 'bestTime')[];
}

export function NearbyPlaceCard({ place, onClick, highlightMetrics = [] }: NearbyPlaceCardProps) {
  const priceLevel = place.priceLevel ? '$'.repeat(place.priceLevel) : null;

  return (
    <div
      onClick={() => onClick(place)}
      className="flex-shrink-0 w-72 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={place.imageUrl || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600'}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600';
          }}
        />

        {/* Category Badge */}
        {place.categories[0] && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-900">
              {place.categories[0]}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Rating */}
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors">
            {place.name}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-gray-900">
                {place.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              ({place.reviewCount})
            </span>
          </div>
        </div>

        {/* Highlighted Metrics */}
        <div className="flex flex-wrap gap-2">
          {/* Distance - if highlighted */}
          {highlightMetrics.includes('distance') && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5" />
              <span>5 min walk</span>
            </div>
          )}

          {/* Price - if highlighted */}
          {highlightMetrics.includes('price') && priceLevel && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{priceLevel}</span>
            </div>
          )}

          {/* Duration - if highlighted */}
          {highlightMetrics.includes('duration') && place.duration && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Clock className="w-3.5 h-3.5" />
              <span>{place.duration}</span>
            </div>
          )}

          {/* Area/Cuisine - always show if available */}
          {place.area && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5" />
              <span>{place.area}</span>
            </div>
          )}
        </div>

        {/* Short Description */}
        {place.shortDescription && (
          <p className="mt-2 text-xs text-gray-600 line-clamp-2">
            {place.shortDescription}
          </p>
        )}
      </div>
    </div>
  );
}
