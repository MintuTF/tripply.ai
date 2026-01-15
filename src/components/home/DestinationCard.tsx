'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Star, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  rating: number;
  trending?: number;
  tags?: string[];
  description?: string;
}

interface DestinationCardProps {
  destination: Destination;
  variant?: 'default' | 'large' | 'compact';
  className?: string;
}

export function DestinationCard({ destination, variant = 'default', className }: DestinationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/travel?destination=${encodeURIComponent(destination.name)}`);
  };

  if (variant === 'compact') {
    return (
      <motion.button
        onClick={handleClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -4 }}
        className={cn(
          'group relative overflow-hidden rounded-2xl bg-card border border-border/50',
          'transition-shadow duration-300',
          'hover:shadow-xl hover:shadow-black/10',
          'text-left w-full',
          className
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <motion.img
            src={destination.image}
            alt={destination.name}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.4 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {destination.trending && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
              <TrendingUp className="h-3 w-3" />
              {destination.trending}k
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-bold text-white mb-1">{destination.name}</h3>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {destination.country}
            </div>
          </div>
        </div>
      </motion.button>
    );
  }

  if (variant === 'large') {
    return (
      <motion.button
        onClick={handleClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -6 }}
        className={cn(
          'group relative overflow-hidden rounded-3xl',
          'transition-shadow duration-300',
          'hover:shadow-2xl hover:shadow-black/20',
          'text-left w-full',
          className
        )}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <motion.img
            src={destination.image}
            alt={destination.name}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.6 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {destination.trending && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-full">
              <TrendingUp className="h-4 w-4" />
              {destination.trending}k travelers
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              {destination.tags?.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{destination.name}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-white/90">
                  <MapPin className="h-4 w-4" />
                  {destination.country}
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-current" />
                  {destination.rating.toFixed(1)}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                className="flex items-center gap-2 text-white font-semibold"
              >
                Start Planning
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.button>
    );
  }

  // Default variant
  return (
    <motion.button
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card',
        'border border-border/50',
        'transition-shadow duration-300',
        'hover:shadow-xl hover:shadow-black/10',
        'text-left w-full',
        className
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <motion.img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {destination.trending && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-orange-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
            <TrendingUp className="h-3 w-3" />
            {destination.trending}k
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-1 text-amber-400 text-sm mb-2">
            <Star className="h-3.5 w-3.5 fill-current" />
            {destination.rating.toFixed(1)}
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{destination.name}</h3>
          <div className="flex items-center gap-1.5 text-white/70 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            {destination.country}
          </div>

          {destination.description && (
            <p className="text-white/60 text-sm mt-2 line-clamp-2">{destination.description}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
