'use client';

import { useState } from 'react';
import { PlaceCard } from '@/types';
import { LocationCard } from './LocationCard';
import { RestaurantCard } from './RestaurantCard';
import { HotelCard } from './HotelCard';
import { ActivityCard } from './ActivityCard';
import { CardModal } from './CardModal';
import { motion } from 'framer-motion';

interface CardGridProps {
  cards: PlaceCard[];
  onAddToTrip?: (card: PlaceCard) => void;
  onSave?: (card: PlaceCard) => void;
}

export function CardGrid({ cards, onAddToTrip, onSave }: CardGridProps) {
  const [selectedCard, setSelectedCard] = useState<PlaceCard | null>(null);

  if (!cards || cards.length === 0) {
    return null;
  }

  const renderCard = (card: PlaceCard) => {
    const commonProps = {
      card,
      onAddToTrip,
      onSave,
      onClick: setSelectedCard,
    };

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
            {cards.length} {cards.length === 1 ? 'place' : 'places'}
          </span>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(renderCard)}
        </div>
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
