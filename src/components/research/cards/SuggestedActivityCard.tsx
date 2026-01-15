'use client';

import { Star, Clock, MapPin, Lightbulb, Check, CalendarPlus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { PlaceCard, Trip } from '@/types';
import { generateWhySuggested } from '@/lib/suggestions/whySuggested';
import { useResearch } from '../ResearchContext';
import { cn } from '@/lib/utils';

interface SuggestedActivityCardProps {
  card: PlaceCard;
  trip?: Trip;
  index?: number;
}

export function SuggestedActivityCard({ card, trip, index = 0 }: SuggestedActivityCardProps) {
  const { addToShortlist, setHoveredPlace, setSelectedPlace, openDetailPanel, shortlistCards } = useResearch();
  const whySuggested = generateWhySuggested(card, trip);
  const [isAdding, setIsAdding] = useState(false);

  const isAdded = shortlistCards.some(c => c.id === card.id);

  const handleAddToDay = async (e: React.MouseEvent) => {
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
      className="group min-w-[260px] max-w-[260px] bg-card rounded-2xl border border-border/50 overflow-hidden
                 hover-lift shadow-sm hover:shadow-depth hover:border-accent-foreground/30 transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setHoveredPlace(card.id)}
      onMouseLeave={() => setHoveredPlace(null)}
      onClick={() => { setSelectedPlace(card.id); openDetailPanel(card); }}
    >
      {/* Image Section with Gradient Overlay */}
      <div className="relative h-36 bg-muted overflow-hidden">
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-foreground/20 to-purple-500/20">
            <Sparkles className="h-12 w-12 text-muted-foreground/40" />
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
            {/* Duration Badge */}
            {card.duration && (
              <div className="flex items-center gap-1 px-2.5 py-1 glassmorphism rounded-full text-white text-xs font-semibold shadow-lg">
                <Clock className="h-3 w-3" />
                {card.duration}
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
        {/* Activity Name */}
        <h4 className="font-bold text-base text-foreground leading-tight line-clamp-1 group-hover:text-accent-foreground transition-colors">
          {card.name}
        </h4>

        {/* Address */}
        {card.address && (
          <p className="flex items-center gap-1 mt-1.5 text-sm text-muted-foreground line-clamp-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{card.address}</span>
          </p>
        )}

        {/* Why Suggested Chip - Purple accent */}
        <div className="mt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-accent-foreground/15 to-purple-500/15
                          text-accent-foreground rounded-full text-xs font-medium border border-accent-foreground/20">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>{whySuggested}</span>
          </div>
        </div>

        {/* CTA Button - Purple gradient for activities */}
        <motion.button
          onClick={handleAddToDay}
          disabled={isAdded || isAdding}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
            isAdded
              ? "bg-green-500/10 text-green-600 border border-green-500/30 cursor-default"
              : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02]"
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
              Added
            </>
          ) : (
            <>
              <CalendarPlus className="h-4 w-4" />
              Add to Day
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
