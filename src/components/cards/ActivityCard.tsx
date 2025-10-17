'use client';

import { useState } from 'react';
import { PlaceCard } from '@/types';
import { cn } from '@/lib/utils';
import { Star, MapPin, ExternalLink, Plus, Bookmark, Activity, Clock, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityCardProps {
  card: PlaceCard;
  onAddToTrip?: (card: PlaceCard) => void;
  onSave?: (card: PlaceCard) => void;
  onClick?: (card: PlaceCard) => void;
}

export function ActivityCard({ card, onAddToTrip, onSave, onClick }: ActivityCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    onSave?.(card);
  };

  const handleAddToTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdded(true);
    onAddToTrip?.(card);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const mainImage = card.photos[0] || '/placeholder-activity.jpg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={() => onClick?.(card)}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card border-2 border-border/50',
        'cursor-pointer transition-all duration-300',
        'hover:border-primary/50 hover:shadow-depth hover:-translate-y-1',
        'backdrop-blur-sm'
      )}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={mainImage}
          alt={card.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-activity.jpg';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Quick Actions - Top Right */}
        <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <button
            onClick={handleSave}
            className={cn(
              'rounded-full p-2.5 shadow-lg backdrop-blur-md transition-all duration-300',
              'hover:scale-110',
              isSaved
                ? 'bg-primary text-white shadow-primary/50'
                : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300'
            )}
            title="Save for later"
          >
            <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
          </button>
        </div>

        {/* Activity Badge - Top Left */}
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/90 dark:bg-gray-800/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur-md flex items-center gap-1.5">
            <Activity className="h-3 w-3" />
            Activity
          </span>
        </div>

        {/* Rating - Bottom Left on Image */}
        {card.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-gray-800/95 px-3 py-1.5 shadow-lg backdrop-blur-md">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-bold text-foreground">{card.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="mb-2 text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {card.name}
        </h3>

        {/* Address */}
        {card.address && (
          <div className="mb-3 flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground line-clamp-2">
              {card.address}
            </p>
          </div>
        )}

        {/* Duration & Price */}
        <div className="mb-3 flex items-center gap-3">
          {card.duration && (
            <div className="flex items-center gap-1.5 text-xs text-foreground/80">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{card.duration}</span>
            </div>
          )}
          {card.price && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <DollarSign className="h-3.5 w-3.5" />
              <span>${card.price}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {card.description && (
          <p className="mb-3 text-sm text-foreground/80 line-clamp-2">
            {card.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleAddToTrip}
            disabled={isAdded}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
              'transition-all duration-300',
              isAdded
                ? 'bg-green-500 text-white'
                : 'gradient-primary text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
            )}
          >
            {isAdded ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  ✓
                </motion.div>
                <span>Added!</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add to Trip</span>
              </>
            )}
          </button>

          {card.url && (
            <a
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center rounded-xl border-2 border-border/50 bg-card px-3 py-2.5 text-sm font-semibold transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
              title="View details"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Hover Lift Effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
        style={{
          boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.3)',
        }}
      />
    </motion.div>
  );
}
