'use client';

import { useRef, useState } from 'react';
import { PlaceCard } from '@/types';
import { cn } from '@/lib/utils';
import {
  UtensilsCrossed,
  Hotel,
  MapPin,
  Compass,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { WhyPlaceCard } from './WhyPlaceCard';

export interface PlaceWithWhy extends PlaceCard {
  whyTags?: string[];
  whyBullets?: string[];
}

export interface PlaceCardGroupProps {
  category: string;
  categoryIcon?: LucideIcon;
  whyGroupWorks?: string[];
  places: PlaceWithWhy[];
  savedPlaceIds?: Set<string>;
  onSavePlace?: (place: PlaceCard) => void;
  onViewDetails?: (place: PlaceCard) => void;
}

// Category icon mapping
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  restaurants: UtensilsCrossed,
  dining: UtensilsCrossed,
  food: UtensilsCrossed,
  hotels: Hotel,
  accommodation: Hotel,
  stays: Hotel,
  activities: Compass,
  attractions: MapPin,
  sights: MapPin,
  locations: MapPin,
};

// Category emoji mapping for visual flair
const CATEGORY_EMOJI: Record<string, string> = {
  restaurants: '🍽',
  dining: '🍽',
  food: '🍜',
  hotels: '🏨',
  accommodation: '🛏',
  stays: '🏠',
  activities: '🎯',
  attractions: '🏛',
  sights: '📸',
  locations: '📍',
  romantic: '💕',
  family: '👨‍👩‍👧‍👦',
  adventure: '🧗',
  relaxation: '🧘',
  nightlife: '🌙',
  shopping: '🛍',
  culture: '🎭',
};

function getCategoryIcon(category: string): LucideIcon {
  const key = category.toLowerCase();
  return CATEGORY_ICONS[key] || MapPin;
}

function getCategoryEmoji(category: string): string {
  const key = category.toLowerCase();
  // Check for partial matches
  for (const [pattern, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (key.includes(pattern)) {
      return emoji;
    }
  }
  return '📍';
}

export function PlaceCardGroup({
  category,
  categoryIcon,
  whyGroupWorks = [],
  places,
  savedPlaceIds = new Set(),
  onSavePlace,
  onViewDetails,
}: PlaceCardGroupProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const Icon = categoryIcon || getCategoryIcon(category);
  const emoji = getCategoryEmoji(category);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!places.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {category}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({places.length})
          </span>
        </div>

        {/* WHY Group Works */}
        {whyGroupWorks.length > 0 && (
          <div className="pl-8">
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
              Why these work:
            </p>
            <ul className="space-y-0.5">
              {whyGroupWorks.slice(0, 3).map((reason, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span className="text-purple-500">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Cards Container */}
      <div className="relative">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Scroll Right Button */}
        {canScrollRight && places.length > 2 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Scrollable Cards */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={cn(
            'flex gap-4 overflow-x-auto scrollbar-hide pb-2',
            'scroll-smooth snap-x snap-mandatory',
            places.length <= 2 ? 'justify-start' : ''
          )}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {places.map((place, idx) => (
            <div
              key={place.id}
              className="snap-start"
              style={{ scrollSnapAlign: 'start' }}
            >
              <WhyPlaceCard
                place={place}
                whyTags={place.whyTags}
                whyBullets={place.whyBullets}
                isSaved={savedPlaceIds.has(place.id)}
                onSave={() => onSavePlace?.(place)}
                onViewDetails={() => onViewDetails?.(place)}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Simple vertical list variant for smaller groups
 */
export function PlaceCardList({
  category,
  whyGroupWorks = [],
  places,
  savedPlaceIds = new Set(),
  onSavePlace,
  onViewDetails,
}: PlaceCardGroupProps) {
  const emoji = getCategoryEmoji(category);

  if (!places.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {category}
        </h3>
      </div>

      {/* WHY Group Works - Inline */}
      {whyGroupWorks.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400 pl-7">
          {whyGroupWorks.join(' · ')}
        </p>
      )}

      {/* Cards - Vertical Stack */}
      <div className="space-y-2 pl-7">
        {places.map((place) => (
          <WhyPlaceCard
            key={place.id}
            place={place}
            whyTags={place.whyTags}
            whyBullets={place.whyBullets}
            isSaved={savedPlaceIds.has(place.id)}
            onSave={() => onSavePlace?.(place)}
            onViewDetails={() => onViewDetails?.(place)}
          />
        ))}
      </div>
    </motion.div>
  );
}
