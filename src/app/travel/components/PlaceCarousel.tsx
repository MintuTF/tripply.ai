'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PlaceCard } from './PlaceCard';
import type { TravelPlace } from '@/lib/travel/types';

interface PlaceCarouselProps {
  places: TravelPlace[];
  onPlaceClick: (place: TravelPlace) => void;
}

export function PlaceCarousel({ places, onPlaceClick }: PlaceCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300; // Width of one card + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (places.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No places found in this category
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Left Scroll Button */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        aria-label="Scroll carousel left"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {places.map((place, index) => (
          <div key={place.id} className="flex-shrink-0 w-72 snap-start">
            <PlaceCard place={place} onClick={() => onPlaceClick(place)} index={index} />
          </div>
        ))}
      </div>

      {/* Right Scroll Button */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        aria-label="Scroll carousel right"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>
    </div>
  );
}
