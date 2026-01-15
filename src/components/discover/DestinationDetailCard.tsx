'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Calendar, ArrowRight, Clock, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Region } from './RegionFilter';

export interface DiscoverDestination {
  id: string;
  name: string;
  country: string;
  region: Region;
  image: string;
  rating: number;
  tags: string[];
  description: string;
  bestTime?: string;
  avgTemp?: string;
  coordinates: { lat: number; lng: number };
}

interface DestinationDetailCardProps {
  destination: DiscoverDestination;
  featured?: boolean;
  className?: string;
}

export function DestinationDetailCard({ destination, featured = false, className }: DestinationDetailCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/travel?destination=${encodeURIComponent(destination.name)}`);
  };

  if (featured) {
    return (
      <motion.button
        onClick={handleClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -8 }}
        className={cn(
          'group relative overflow-hidden rounded-3xl text-left w-full',
          'transition-shadow duration-500',
          'hover:shadow-2xl hover:shadow-black/30',
          className
        )}
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <motion.img
            src={destination.image}
            alt={destination.name}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.7 }}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

          {/* Rating badge */}
          <div className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-white font-semibold">{destination.rating.toFixed(1)}</span>
          </div>

          {/* Tags */}
          <div className="absolute top-5 right-5 flex flex-wrap gap-2 justify-end max-w-[60%]">
            {destination.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-white/15 backdrop-blur-sm text-white text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
              <MapPin className="h-4 w-4" />
              {destination.country}
            </div>

            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3">{destination.name}</h3>

            <p className="text-white/80 text-base sm:text-lg mb-5 max-w-2xl line-clamp-2">
              {destination.description}
            </p>

            {/* Quick facts */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {destination.bestTime && (
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Calendar className="h-4 w-4" />
                  Best: {destination.bestTime}
                </div>
              )}
              {destination.avgTemp && (
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Thermometer className="h-4 w-4" />
                  {destination.avgTemp}
                </div>
              )}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0.8, x: 0 }}
              animate={{ opacity: isHovered ? 1 : 0.8, x: isHovered ? 4 : 0 }}
              className="inline-flex items-center gap-2 bg-white text-foreground px-6 py-3 rounded-xl font-semibold transition-colors group-hover:bg-primary group-hover:text-white"
            >
              Start Research
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          </div>
        </div>
      </motion.button>
    );
  }

  // Standard card
  return (
    <motion.button
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -6 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card text-left w-full',
        'border border-border/50',
        'transition-all duration-300',
        'hover:shadow-xl hover:shadow-black/10 hover:border-primary/30',
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <motion.img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-white text-sm font-medium">{destination.rating.toFixed(1)}</span>
        </div>

        {/* Tags */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {destination.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white mb-1">{destination.name}</h3>
          <div className="flex items-center gap-1.5 text-white/70 text-sm mb-2">
            <MapPin className="h-3.5 w-3.5" />
            {destination.country}
          </div>

          {/* Expanded info on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-white/70 text-sm line-clamp-2 mb-3">{destination.description}</p>
                {destination.bestTime && (
                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    Best time: {destination.bestTime}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}
