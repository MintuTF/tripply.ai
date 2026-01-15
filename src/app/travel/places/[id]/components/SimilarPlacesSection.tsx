'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, Star } from 'lucide-react';
import type { TravelPlace } from '@/lib/travel/types';

interface SimilarPlacesSectionProps {
  currentPlace: TravelPlace;
  similarPlaces: TravelPlace[];
}

function SimilarPlaceCard({
  place,
  onClick,
}: {
  place: TravelPlace;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-64 md:w-auto bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md shadow-purple-100/50 border border-purple-100/50 cursor-pointer hover:shadow-xl hover:shadow-purple-200/50 transition-all hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-36 bg-gradient-to-br from-purple-100 to-pink-100">
        <img
          src={place.imageUrl}
          alt={place.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400';
          }}
        />
        {/* Rating badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-semibold text-gray-900">
            {place.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 line-clamp-1 mb-1">
          {place.name}
        </h4>
        <div className="flex flex-wrap gap-1 mb-2">
          {place.categories.slice(0, 2).map((cat, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700"
            >
              {cat}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {place.reviewCount.toLocaleString()} reviews
        </p>
      </div>
    </div>
  );
}

export function SimilarPlacesSection({
  currentPlace,
  similarPlaces,
}: SimilarPlacesSectionProps) {
  const router = useRouter();

  const handlePlaceClick = (place: TravelPlace) => {
    router.push(`/travel/places/${place.id}`);
  };

  if (!similarPlaces || similarPlaces.length === 0) {
    return null;
  }

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Similar Places You Might Like
            </h2>
            <p className="text-sm text-gray-600">
              Based on categories similar to {currentPlace.name}
            </p>
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-4">
          {similarPlaces.slice(0, 6).map((place) => (
            <SimilarPlaceCard
              key={place.id}
              place={place}
              onClick={() => handlePlaceClick(place)}
            />
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {similarPlaces.slice(0, 6).map((place) => (
            <SimilarPlaceCard
              key={place.id}
              place={place}
              onClick={() => handlePlaceClick(place)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
