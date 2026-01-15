'use client';

import { Star, Camera } from 'lucide-react';
import type { TravelPlace } from '@/lib/travel/types';

interface PlaceDetailHeroProps {
  place: TravelPlace & {
    images?: string[];
    ranking?: number;
    totalPlaces?: number;
  };
}

// Star rating component with purple theme
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className="w-5 h-5 text-amber-400 fill-amber-400"
        />
      ))}
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star className="w-5 h-5 text-purple-200" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
        </div>
      )}
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="w-5 h-5 text-purple-200" />
      ))}
    </div>
  );
}

export function PlaceDetailHero({ place }: PlaceDetailHeroProps) {
  // Get images array - fallback to single imageUrl repeated
  const images = place.images?.length
    ? place.images
    : [place.imageUrl, place.imageUrl, place.imageUrl];

  // Get first 3 images for the card display
  const displayImages = images.slice(0, 3);
  const remainingCount = images.length > 3 ? images.length - 3 : 0;

  // Default ranking if not provided
  const ranking = place.ranking || Math.floor(Math.random() * 20) + 1;
  const totalPlaces = place.totalPlaces || 100;

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Photo Gallery - 3 Equal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
          {displayImages.map((img, index) => (
            <div
              key={index}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg shadow-purple-100 hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
            >
              <img
                src={img}
                alt={`${place.name} - Photo ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800';
                }}
              />
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* "+X photos" overlay on last card */}
              {index === 2 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 to-pink-900/70 flex flex-col items-center justify-center backdrop-blur-[2px]">
                  <Camera className="w-8 h-8 text-white mb-2" />
                  <span className="text-white font-semibold text-lg">
                    +{remainingCount} photos
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Title & Info Section - Below Photos */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-100/50 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Left: Title & Badges */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {place.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2">
                {/* Ranking Badge */}
                {place.area && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-sm font-medium border border-purple-200/50">
                    <span className="text-purple-600 font-bold">#{ranking}</span>
                    <span>of {totalPlaces} things to do in {place.area}</span>
                  </span>
                )}

                {/* Category Badges */}
                {place.categories.slice(0, 2).map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-medium border border-purple-100"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Rating Section */}
            <div className="flex flex-col items-start md:items-end gap-1 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100/50">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {place.rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500 font-medium">/ 5</span>
              </div>
              <StarRating rating={place.rating} />
              <span className="text-sm text-gray-600 mt-1">
                {place.reviewCount.toLocaleString()} reviews
              </span>
            </div>
          </div>

          {/* Short Description */}
          {place.shortDescription && (
            <p className="mt-4 text-gray-600 leading-relaxed">
              {place.shortDescription}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
