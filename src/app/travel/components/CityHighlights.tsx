'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, MapPin, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TravelPlace } from '@/lib/travel/types';

interface CityHighlightsProps {
  cityName: string;
  places: TravelPlace[];
  onPlaceClick: (place: TravelPlace) => void;
  isLoading?: boolean;
}

export function CityHighlights({ cityName, places, onPlaceClick, isLoading = false }: CityHighlightsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Get top-rated places sorted by rating and popularity
  const topPlaces = [...places]
    .sort((a, b) => {
      // Combine rating and popularity for ranking
      const scoreA = (a.rating || 0) * 0.7 + (a.popularityScore || 0) * 0.3;
      const scoreB = (b.rating || 0) * 0.7 + (b.popularityScore || 0) * 0.3;
      return scoreB - scoreA;
    })
    .slice(0, 10);

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollButtons();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScrollButtons);
      return () => ref.removeEventListener('scroll', checkScrollButtons);
    }
  }, [topPlaces]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Don't show if no places and not loading
  if (topPlaces.length === 0 && !isLoading) return null;

  // Skeleton card component
  const SkeletonCard = () => (
    <div className="flex-shrink-0 snap-start">
      <div className="w-[280px] bg-white rounded-2xl shadow-lg shadow-purple-100 border border-purple-100/50 overflow-hidden">
        <div className="relative h-44 bg-gray-200 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Popular in {cityName}
              </h2>
              <p className="text-gray-500 text-sm">Top-rated attractions and experiences</p>
            </div>
          </div>

          {/* Scroll Arrows */}
          {!isLoading && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  canScrollLeft
                    ? 'bg-white shadow-lg shadow-purple-100 hover:shadow-purple-200 text-gray-700 hover:text-purple-600'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  canScrollRight
                    ? 'bg-white shadow-lg shadow-purple-100 hover:shadow-purple-200 text-gray-700 hover:text-purple-600'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel - Show skeletons when loading */}
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden pb-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          /* Carousel */
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {topPlaces.map((place, index) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 snap-start"
            >
              <div
                onClick={() => onPlaceClick(place)}
                className="w-[280px] bg-white rounded-2xl shadow-lg shadow-purple-100 border border-purple-100/50 overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-purple-200 hover:scale-[1.02] transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={place.imageUrl || '/placeholder-place.jpg'}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Rating Badge */}
                  {place.rating && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold text-gray-800">{place.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Top Rated Badge for first 3 */}
                  {index < 3 && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold shadow-lg">
                      Top Rated
                    </div>
                  )}

                  {/* Place Name on Image */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2 drop-shadow-lg">
                      {place.name}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Categories */}
                  <div className="flex items-center gap-2 mb-2">
                    {place.categories?.slice(0, 2).map((cat, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Location & Reviews */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    {place.area && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{place.area}</span>
                      </div>
                    )}
                    {place.reviewCount && (
                      <span>{place.reviewCount.toLocaleString()} reviews</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
