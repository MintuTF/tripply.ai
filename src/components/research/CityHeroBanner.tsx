'use client';

import { Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CityHeroBannerProps {
  cityName: string;
  backgroundImage?: string;
  startDate?: Date;
  endDate?: Date;
  travelers?: number;
  className?: string;
}

export function CityHeroBanner({
  cityName,
  backgroundImage,
  startDate,
  endDate,
  travelers = 2,
  className,
}: CityHeroBannerProps) {
  // Format dates if provided
  const dateRange =
    startDate && endDate
      ? `${format(startDate, 'MMM d')}-${format(endDate, 'd')}`
      : null;

  return (
    <div className={cn('relative w-full h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden', className)}>
      {/* Background Image */}
      <div className="absolute inset-0">
        {backgroundImage ? (
          <img
            src={backgroundImage}
            alt={cityName}
            className="w-full h-full object-cover"
          />
        ) : (
          // Fallback gradient if no image
          <div className="w-full h-full bg-gradient-to-br from-[#58A6C1] via-[#6366F1] to-[#A855F7]" />
        )}
      </div>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)',
        }}
      />

      {/* Content - Bottom Left */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-6 sm:px-6 sm:py-8 md:px-16 md:py-12">
        {/* City Name */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4"
          style={{
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            lineHeight: 1.25,
          }}
        >
          {cityName}
        </h1>

        {/* Details Row */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm md:text-base font-medium text-white/90">
          {dateRange && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{dateRange}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>
              {travelers} {travelers === 1 ? 'traveler' : 'travelers'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
