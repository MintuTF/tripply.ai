'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { PlaceCard } from './PlaceCard';
import { PlacesGridSkeleton } from './Skeletons';
import type { TravelPlace } from '@/lib/travel/types';
import { cn } from '@/lib/utils';

interface PlacesGridProps {
  places: TravelPlace[];
  isLoading: boolean;
  onCardClick: (place: TravelPlace) => void;
  className?: string;
}

export function PlacesGrid({ places, isLoading, onCardClick, className }: PlacesGridProps) {
  if (isLoading) {
    return <PlacesGridSkeleton count={6} />;
  }

  if (places.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('flex flex-col items-center justify-center py-16', className)}
      >
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No places found
        </h3>
        <p className="text-gray-500 text-center max-w-sm">
          Try adjusting your filters or search for a different city
        </p>
      </motion.div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {places.map((place, index) => (
        <PlaceCard
          key={place.id}
          place={place}
          onClick={() => onCardClick(place)}
          index={index}
        />
      ))}
    </div>
  );
}
