'use client';

import { Star, MapPin, Clock } from 'lucide-react';
import type { TravelPlace } from '@/lib/travel/types';

interface PlaceInfoBarProps {
  place: TravelPlace;
}

// Star rating component (compact)
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className="w-4 h-4 text-amber-400 fill-amber-400"
        />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="w-4 h-4 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
        </div>
      )}
    </div>
  );
}

export function PlaceInfoBar({ place }: PlaceInfoBarProps) {
  // Format address - take first part if too long
  const shortAddress = place.address
    ? place.address.split(',').slice(0, 2).join(', ')
    : place.area || '';

  return (
    <section className="py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-purple-100/50 shadow-sm">
          {/* Mobile: Stacked layout */}
          <div className="flex flex-col gap-3 sm:hidden">
            <h1 className="text-xl font-bold text-gray-900">
              {place.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <StarRating rating={place.rating} />
                <span className="text-sm font-semibold text-gray-900">
                  {place.rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({place.reviewCount.toLocaleString()})
                </span>
              </div>
              {place.categories.slice(0, 2).map((category, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100"
                >
                  {category}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {shortAddress && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-pink-500" />
                  {shortAddress}
                </span>
              )}
              {place.openNow !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-500" />
                  <span className={place.openNow ? 'text-green-600' : 'text-red-500'}>
                    {place.openNow ? 'Open' : 'Closed'}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Desktop: Single row layout */}
          <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {place.name}
              </h1>
              <div className="flex items-center gap-1.5">
                <StarRating rating={place.rating} />
                <span className="text-sm font-semibold text-gray-900">
                  {place.rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({place.reviewCount.toLocaleString()})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {place.categories.slice(0, 2).map((category, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {shortAddress && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-pink-500" />
                  {shortAddress}
                </span>
              )}
              {place.openNow !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className={place.openNow ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {place.openNow ? 'Open now' : 'Closed'}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
