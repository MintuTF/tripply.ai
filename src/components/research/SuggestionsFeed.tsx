'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResearch } from './ResearchContext';
import { EnhancedPlaceCard } from './EnhancedPlaceCard';
import { useDestinationTheme } from './DestinationThemeProvider';
import { cn } from '@/lib/utils';
import type { Trip, PlaceCard } from '@/types';

interface SuggestionsFeedProps {
  trip: Trip;
  compact?: boolean;
}

export function SuggestionsFeed({ trip, compact }: SuggestionsFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { suggestions, shortlistCards, setSelectedPlace, addToShortlist, openDetailPanel } = useResearch();
  const { theme } = useDestinationTheme();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = compact ? 180 : 240;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleSelectCard = (card: PlaceCard) => {
    setSelectedPlace(card.id);
    openDetailPanel(card);
  };

  const handleSaveCard = (card: PlaceCard) => {
    addToShortlist(card);
  };

  const isCardSaved = (cardId: string) => {
    return shortlistCards.some((item: PlaceCard) => item.id === cardId);
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn('mt-8', compact && 'mt-4')}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between mb-4',
        compact && 'mb-3'
      )}>
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-4 rounded-full"
            style={{ backgroundColor: theme.primary }}
          />
          <h3 className="text-sm font-semibold text-foreground">
            Suggestions for you
          </h3>
          <span className="text-xs text-muted-foreground">
            ({suggestions.length})
          </span>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className={cn(
              'rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
              compact ? 'p-1' : 'p-1.5'
            )}
          >
            <ChevronLeft className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
          </button>
          <button
            onClick={() => scroll('right')}
            className={cn(
              'rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
              compact ? 'p-1' : 'p-1.5'
            )}
          >
            <ChevronRight className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
          </button>
        </div>
      </div>

      {/* Scrollable Cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth -mx-2 px-2 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {suggestions.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex-shrink-0"
          >
            <EnhancedPlaceCard
              card={card}
              onSelect={() => handleSelectCard(card)}
              onSave={() => handleSaveCard(card)}
              isSaved={isCardSaved(card.id)}
              variant={compact ? 'compact' : 'default'}
              showReason={!compact}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
