'use client';

import { motion } from 'framer-motion';
import {
  Bookmark,
  ChevronRight,
  MapPin,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaceCard } from '@/types';

interface SavedPlacesSectionProps {
  savedPlaces?: PlaceCard[];
  onViewAll?: () => void;
  onBuildItinerary?: () => void;
  onAddPlaces?: () => void;
  className?: string;
}

export function SavedPlacesSection({
  savedPlaces = [],
  onViewAll,
  onBuildItinerary,
  onAddPlaces,
  className,
}: SavedPlacesSectionProps) {
  const hasPlaces = savedPlaces.length > 0;
  const displayPlaces = savedPlaces.slice(0, 3);
  const remainingCount = savedPlaces.length > 3 ? savedPlaces.length - 3 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={cn(
        'rounded-2xl border border-border bg-card p-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Bookmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Your Saved Places</h3>
            <p className="text-sm text-muted-foreground">
              {hasPlaces ? `${savedPlaces.length} places saved` : 'No places saved yet'}
            </p>
          </div>
        </div>

        {hasPlaces && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Places Preview */}
      {hasPlaces ? (
        <div className="space-y-4">
          {/* Thumbnails Grid */}
          <div className="flex items-center gap-2">
            {displayPlaces.map((place, index) => (
              <motion.div
                key={`${place.id}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-background shadow-sm"
              >
                {place.photos?.[0] ? (
                  <img
                    src={place.photos[0]}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Remaining count */}
            {remainingCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center border-2 border-background"
              >
                <span className="text-sm font-semibold text-muted-foreground">
                  +{remainingCount}
                </span>
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onViewAll}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all font-medium text-sm"
            >
              <Bookmark className="h-4 w-4" />
              View Saved
            </button>
            <button
              onClick={onBuildItinerary}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium text-sm shadow-lg"
            >
              Build Itinerary
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        // Empty State
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Bookmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Save places you want to visit to build your perfect itinerary
          </p>
          <button
            onClick={onAddPlaces}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-accent transition-all text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Start Discovering
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default SavedPlacesSection;
