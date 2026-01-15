'use client';

import { Star, Plus, MapPin, Lightbulb, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { PlaceCard, Trip } from '@/types';
import { generateWhySuggested } from '@/lib/suggestions/whySuggested';
import { useResearch } from '../ResearchContext';
import { cn } from '@/lib/utils';

interface SuggestedHotelCardProps {
  card: PlaceCard;
  trip?: Trip;
  index?: number;
}

export function SuggestedHotelCard({ card, trip, index = 0 }: SuggestedHotelCardProps) {
  const { addToShortlist, setHoveredPlace, setSelectedPlace, openDetailPanel, shortlistCards } = useResearch();
  const whySuggested = generateWhySuggested(card, trip);
  const [isAdding, setIsAdding] = useState(false);

  const isAdded = shortlistCards.some(c => c.id === card.id);
  const priceLabel = card.price_level ? '$'.repeat(card.price_level) : null;

  const handleAddToTrip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdded) return;

    setIsAdding(true);
    addToShortlist(card);

    // Brief animation delay
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
      className="group min-w-[300px] max-w-[300px] bg-card rounded-2xl border border-border/50 overflow-hidden
                 hover-lift shadow-sm hover:shadow-depth hover:border-primary/30 transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setHoveredPlace(card.id)}
      onMouseLeave={() => setHoveredPlace(null)}
      onClick={() => { setSelectedPlace(card.id); openDetailPanel(card); }}
    >
      {/* Image Section with Gradient Overlay */}
      <div className="relative h-40 bg-muted overflow-hidden">
        {card.photos?.[0] ? (
          <>
            <img
              src={card.photos[0]}
              alt={card.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <MapPin className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Floating Badges on Image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Rating Badge */}
            {card.rating && (
              <div className="flex items-center gap-1 px-2.5 py-1 glassmorphism rounded-full text-white text-xs font-semibold shadow-lg">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{card.rating.toFixed(1)}</span>
              </div>
            )}
            {/* Price Badge */}
            {priceLabel && (
              <div className="px-2.5 py-1 glassmorphism rounded-full text-white text-xs font-semibold shadow-lg">
                {priceLabel}
              </div>
            )}
          </div>

          {/* Review Count */}
          {card.review_count && (
            <div className="px-2 py-1 glassmorphism rounded-full text-white/80 text-[11px]">
              {card.review_count.toLocaleString()} reviews
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Hotel Name */}
        <h4 className="font-bold text-base text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {card.name}
        </h4>

        {/* Address */}
        {card.address && (
          <p className="flex items-center gap-1 mt-1.5 text-sm text-muted-foreground line-clamp-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{card.address}</span>
          </p>
        )}

        {/* Why Suggested Chip */}
        <div className="mt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-secondary/15 to-amber-500/15
                          text-secondary rounded-full text-xs font-medium border border-secondary/20">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>{whySuggested}</span>
          </div>
        </div>

        {/* CTA Button */}
        <motion.button
          onClick={handleAddToTrip}
          disabled={isAdded || isAdding}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
            isAdded
              ? "bg-green-500/10 text-green-600 border border-green-500/30 cursor-default"
              : "gradient-primary text-white shadow-md hover:shadow-glow hover:scale-[1.02]"
          )}
        >
          {isAdding ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
          ) : isAdded ? (
            <>
              <Check className="h-4 w-4" />
              Added to Trip
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add to Trip
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
