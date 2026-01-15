'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, MapPin } from 'lucide-react';
import { useHeroImage } from '@/hooks/useHeroImage';
import { useDestinationTheme } from './DestinationThemeProvider';
import { cn } from '@/lib/utils';

interface DestinationHeroProps {
  destination: string;
  dates?: {
    start: string | null;
    end: string | null;
  };
  travelers?: number;
  className?: string;
}

export function DestinationHero({
  destination,
  dates,
  travelers,
  className,
}: DestinationHeroProps) {
  const { imageUrl, isLoading } = useHeroImage(destination);
  const { theme } = useDestinationTheme();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Format dates for display
  const formatDateRange = () => {
    if (!dates?.start) return null;

    const startDate = new Date(dates.start);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', options);

    if (!dates.end) return startStr;

    const endDate = new Date(dates.end);
    const endStr = endDate.toLocaleDateString('en-US', options);

    return `${startStr} - ${endStr}`;
  };

  const dateRange = formatDateRange();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl',
        'h-[200px] md:h-[250px] lg:h-[300px]',
        className
      )}
    >
      {/* Loading skeleton */}
      {(isLoading || !imageLoaded) && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
      )}

      {/* Background Image with parallax-like effect */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: imageLoaded ? 1 : 1.1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <img
          src={imageUrl}
          alt={destination}
          onLoad={() => setImageLoaded(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      </motion.div>

      {/* Gradient Overlay - bottom to top */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            to top,
            rgba(0, 0, 0, 0.7) 0%,
            rgba(0, 0, 0, 0.4) 40%,
            rgba(0, 0, 0, 0.1) 70%,
            transparent 100%
          )`,
        }}
      />

      {/* Subtle color tint based on destination theme */}
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-30"
        style={{ backgroundColor: theme.primary }}
      />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Destination Name */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {destination}
          </h1>

          {/* Trip Details */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-white/90 text-sm md:text-base">
            {dateRange && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{dateRange}</span>
              </div>
            )}

            {travelers && travelers > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{travelers} traveler{travelers !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Theme mood indicator */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${theme.primary}40`,
                color: 'white',
              }}
            >
              <span className="capitalize">{theme.mood}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative corner accent */}
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-20"
        style={{
          background: `radial-gradient(circle at top right, ${theme.primary}, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}
