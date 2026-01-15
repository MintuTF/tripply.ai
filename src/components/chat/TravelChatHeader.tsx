'use client';

import { MapPin, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCountryFlag, extractCountryCode } from '@/lib/travel/cityMetadata';

export interface TravelChatHeaderProps {
  destination?: string;
  country?: string;
  countryCode?: string;
  tripName?: string;
  days?: number;
  startDate?: string;
  endDate?: string;
  travelerType?: string;
  className?: string;
}

export function TravelChatHeader({
  destination,
  country,
  countryCode,
  tripName,
  days,
  startDate,
  endDate,
  travelerType,
  className,
}: TravelChatHeaderProps) {
  // Get flag emoji
  const extractedCode = country ? extractCountryCode(country) : null;
  const flag = countryCode
    ? getCountryFlag(countryCode)
    : extractedCode
    ? getCountryFlag(extractedCode)
    : '';

  // Format date range
  const dateRange = startDate && endDate
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : days
    ? `${days} day${days > 1 ? 's' : ''}`
    : null;

  if (!destination && !tripName) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3',
        'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md',
        'border-b border-gray-100 dark:border-gray-800',
        className
      )}
    >
      {/* Left: Destination & Trip Name */}
      <div className="flex items-center gap-3">
        {/* Flag + Destination */}
        {destination && (
          <div className="flex items-center gap-2">
            {flag && <span className="text-xl">{flag}</span>}
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {destination}
              </h2>
              {country && country !== destination && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {country}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Trip Name Badge */}
        {tripName && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800">
            <MapPin className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              {tripName}
            </span>
          </div>
        )}
      </div>

      {/* Right: Trip Details */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {/* Date Range */}
        {dateRange && (
          <div className="hidden sm:flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{dateRange}</span>
          </div>
        )}

        {/* Traveler Type */}
        {travelerType && (
          <div className="hidden md:flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span className="capitalize">{travelerType}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact inline header for mobile
 */
export function TravelChatHeaderCompact({
  destination,
  countryCode,
  tripName,
}: Pick<TravelChatHeaderProps, 'destination' | 'countryCode' | 'tripName'>) {
  const flag = countryCode ? getCountryFlag(countryCode) : '';

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm">
      {flag && <span>{flag}</span>}
      <span className="font-medium text-gray-900 dark:text-white">
        {destination || tripName}
      </span>
      {destination && tripName && (
        <>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="text-gray-500 dark:text-gray-400">{tripName}</span>
        </>
      )}
    </div>
  );
}

// Helper function to format date
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
