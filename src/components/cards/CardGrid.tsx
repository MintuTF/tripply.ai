'use client';

import { useState } from 'react';
import { PlaceCard } from '@/types';
import { LocationCard } from './LocationCard';
import { RestaurantCard } from './RestaurantCard';
import { HotelCard } from './HotelCard';
import { ActivityCard } from './ActivityCard';
import { CardModal } from './CardModal';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CardGridProps {
  cards: PlaceCard[];
  onAddToTrip?: (card: PlaceCard) => void;
  onSave?: (card: PlaceCard) => void;
  initialDisplayCount?: number;
}

const DEFAULT_DISPLAY_COUNT = 3;

export function CardGrid({ cards, onAddToTrip, onSave, initialDisplayCount = DEFAULT_DISPLAY_COUNT }: CardGridProps) {
  const [selectedCard, setSelectedCard] = useState<PlaceCard | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (!cards || cards.length === 0) {
    return null;
  }

  const hasMoreCards = cards.length > initialDisplayCount;
  const displayedCards = showAll ? cards : cards.slice(0, initialDisplayCount);
  const hiddenCount = cards.length - initialDisplayCount;

  const renderCard = (card: PlaceCard, index: number) => {
    const commonProps = {
      card,
      onAddToTrip,
      onSave,
      onClick: setSelectedCard,
    };

    const cardComponent = (() => {
      switch (card.type) {
        case 'restaurant':
          return <RestaurantCard key={card.id} {...commonProps} />;
        case 'hotel':
          return <HotelCard key={card.id} {...commonProps} />;
        case 'activity':
          return <ActivityCard key={card.id} {...commonProps} />;
        case 'location':
        default:
          return <LocationCard key={card.id} {...commonProps} />;
      }
    })();

    // Add animation delay for cards appearing when expanded
    if (showAll && index >= initialDisplayCount) {
      return (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: (index - initialDisplayCount) * 0.05 }}
        >
          {cardComponent}
        </motion.div>
      );
    }

    return cardComponent;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="my-8"
      >
        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            Recommended Places
          </h3>
          <span className="text-sm text-muted-foreground">
            {showAll ? cards.length : `${displayedCards.length} of ${cards.length}`} {cards.length === 1 ? 'place' : 'places'}
          </span>
        </div>

        {/* Cards - Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {displayedCards.map((card, index) => (
            <div key={card.id} className="flex-shrink-0 w-72 snap-start">
              {renderCard(card, index)}
            </div>
          ))}
        </div>

        {/* See More / See Less Button */}
        {hasMoreCards && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  See {hiddenCount} More
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onAddToTrip={onAddToTrip}
          onSave={onSave}
        />
      )}
    </>
  );
}
