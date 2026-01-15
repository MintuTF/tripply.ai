'use client';

import { format } from 'date-fns';
import type { Trip } from '@/types';

interface DocumentHeaderProps {
  trip: Trip;
}

export function DocumentHeader({ trip }: DocumentHeaderProps) {
  const formatDateRange = () => {
    if (!trip.dates?.start) return null;
    const start = new Date(trip.dates.start);
    const end = trip.dates?.end ? new Date(trip.dates.end) : null;

    if (end) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }
    return format(start, 'MMM d');
  };

  const getTravelerCount = () => {
    if (!trip.party_json) return null;
    const count = trip.party_json.adults + (trip.party_json.children || 0);
    return `${count} traveler${count > 1 ? 's' : ''}`;
  };

  const dateRange = formatDateRange();
  const travelerCount = getTravelerCount();

  // Build subtitle parts
  const subtitleParts = [dateRange, travelerCount].filter(Boolean);

  return (
    <header className="mb-8 pt-2">
      <h1 className="text-2xl font-semibold text-foreground tracking-tight">
        {trip.destination?.name || trip.title}
      </h1>
      {subtitleParts.length > 0 && (
        <p className="text-muted-foreground mt-1 text-sm">
          {subtitleParts.join(' · ')}
        </p>
      )}
    </header>
  );
}
