'use client';

import { Hotel, Utensils, Compass, ChevronLeft, ChevronRight, Sparkles, Plane } from 'lucide-react';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useResearch } from './ResearchContext';
import { FilterChips } from './FilterChips';
import { SuggestedHotelCard } from './cards/SuggestedHotelCard';
import { SuggestedRestaurantCard } from './cards/SuggestedRestaurantCard';
import { SuggestedActivityCard } from './cards/SuggestedActivityCard';
import { getFilteredCards } from '@/lib/suggestions/whySuggested';
import { cn } from '@/lib/utils';
import type { Trip } from '@/types';

interface SuggestionsSectionProps {
  trip?: Trip;
}

// Section configuration with colors
const sectionConfig = {
  hotels: {
    icon: Hotel,
    title: 'Hotels You May Like',
    subtitle: 'Handpicked stays based on your preferences',
    iconColor: 'text-primary',
    borderColor: 'border-l-primary',
    bgGradient: 'from-primary/5 via-transparent to-transparent',
  },
  restaurants: {
    icon: Utensils,
    title: 'Recommended Dining',
    subtitle: 'Curated restaurants for every craving',
    iconColor: 'text-secondary',
    borderColor: 'border-l-secondary',
    bgGradient: 'from-secondary/5 via-transparent to-transparent',
  },
  activities: {
    icon: Compass,
    title: 'Things to Do',
    subtitle: 'Experiences you won\'t want to miss',
    iconColor: 'text-accent-foreground',
    borderColor: 'border-l-accent-foreground',
    bgGradient: 'from-accent-foreground/5 via-transparent to-transparent',
  },
};

export function SuggestionsSection({ trip }: SuggestionsSectionProps) {
  const { suggestedHotels, suggestedRestaurants, suggestedActivities, activeFilters } = useResearch();
  const hotelsRef = useRef<HTMLDivElement>(null);
  const restaurantsRef = useRef<HTMLDivElement>(null);
  const activitiesRef = useRef<HTMLDivElement>(null);

  const filteredHotels = getFilteredCards(suggestedHotels, activeFilters, trip);
  const filteredRestaurants = getFilteredCards(suggestedRestaurants, activeFilters, trip);
  const filteredActivities = getFilteredCards(suggestedActivities, activeFilters, trip);

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const amount = direction === 'left' ? -320 : 320;
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const hasAnySuggestions = filteredHotels.length > 0 || filteredRestaurants.length > 0 || filteredActivities.length > 0;

  // Empty state
  if (!hasAnySuggestions) {
    return (
      <section className="py-8">
        {/* Header with Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">AI Suggestions</h3>
              <p className="text-sm text-muted-foreground">Personalized picks for your trip</p>
            </div>
          </div>
          <FilterChips />
        </div>

        {/* Inspiring Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background via-accent/5 to-background p-12"
        >
          <div className="flex flex-col items-center text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-6"
            >
              <Plane className="h-16 w-16 text-primary/60" />
            </motion.div>
            <h4 className="text-xl font-bold mb-2">Start your adventure!</h4>
            <p className="text-muted-foreground max-w-md mb-6">
              Ask the AI assistant to discover hotels, restaurants, and activities tailored to your preferences.
            </p>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                Find Hotels
              </button>
              <button className="px-4 py-2 rounded-xl bg-secondary/10 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors">
                Find Restaurants
              </button>
              <button className="px-4 py-2 rounded-xl bg-accent-foreground/10 text-accent-foreground text-sm font-medium hover:bg-accent-foreground/20 transition-colors">
                Find Activities
              </button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl -z-10" />
        </motion.div>
      </section>
    );
  }

  return (
    <section className="py-8 space-y-8">
      {/* Header with Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl gradient-primary">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">AI Suggestions</h3>
            <p className="text-sm text-muted-foreground">Personalized picks for your trip</p>
          </div>
        </div>
        <FilterChips />
      </div>

      {/* Hotels Section */}
      {filteredHotels.length > 0 && (
        <SuggestionRow
          config={sectionConfig.hotels}
          items={filteredHotels}
          scrollRef={hotelsRef}
          onScroll={(dir) => scroll(hotelsRef as React.RefObject<HTMLDivElement>, dir)}
          renderCard={(card, index) => <SuggestedHotelCard key={card.id} card={card} trip={trip} index={index} />}
        />
      )}

      {/* Restaurants Section */}
      {filteredRestaurants.length > 0 && (
        <SuggestionRow
          config={sectionConfig.restaurants}
          items={filteredRestaurants}
          scrollRef={restaurantsRef}
          onScroll={(dir) => scroll(restaurantsRef as React.RefObject<HTMLDivElement>, dir)}
          renderCard={(card, index) => <SuggestedRestaurantCard key={card.id} card={card} trip={trip} index={index} />}
        />
      )}

      {/* Activities Section */}
      {filteredActivities.length > 0 && (
        <SuggestionRow
          config={sectionConfig.activities}
          items={filteredActivities}
          scrollRef={activitiesRef}
          onScroll={(dir) => scroll(activitiesRef as React.RefObject<HTMLDivElement>, dir)}
          renderCard={(card, index) => <SuggestedActivityCard key={card.id} card={card} trip={trip} index={index} />}
        />
      )}
    </section>
  );
}

// Reusable row component for each suggestion type
interface SuggestionRowProps {
  config: {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    iconColor: string;
    borderColor: string;
    bgGradient: string;
  };
  items: any[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (direction: 'left' | 'right') => void;
  renderCard: (item: any, index: number) => React.ReactNode;
}

function SuggestionRow({ config, items, scrollRef, onScroll, renderCard }: SuggestionRowProps) {
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-2xl border border-border/50 overflow-hidden',
        'bg-gradient-to-r',
        config.bgGradient
      )}
    >
      {/* Section Header */}
      <div className={cn('border-l-4 pl-4 py-4 pr-4', config.borderColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg bg-card shadow-sm', config.iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-lg">{config.title}</h4>
              <p className="text-sm text-muted-foreground">{config.subtitle}</p>
            </div>
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-muted text-sm font-medium text-muted-foreground">
              {items.length}
            </span>
          </div>

          {/* Scroll Controls */}
          <div className="flex gap-1">
            <button
              onClick={() => onScroll('left')}
              className="p-2 rounded-xl border border-border/50 bg-card hover:bg-accent shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => onScroll('right')}
              className="p-2 rounded-xl border border-border/50 bg-card hover:bg-accent shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide scroll-smooth"
      >
        {items.map((item, index) => renderCard(item, index))}
      </div>
    </motion.div>
  );
}
