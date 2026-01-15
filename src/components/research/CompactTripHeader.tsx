'use client';

import { format } from 'date-fns';
import { MapPin, Calendar, Users, Share2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Trip } from '@/types';

interface CompactTripHeaderProps {
  trip: Trip;
  onShare: () => void;
  compact?: boolean;
}

export function CompactTripHeader({ trip, onShare, compact }: CompactTripHeaderProps) {
  const formatDateRange = () => {
    if (!trip.dates?.start) return null;
    const start = new Date(trip.dates.start);
    const end = trip.dates?.end ? new Date(trip.dates.end) : null;

    if (end) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }
    return format(start, 'MMM d');
  };

  const dateRange = formatDateRange();

  return (
    <header className={cn(
      'flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-sm',
      compact ? 'px-3 py-2' : 'px-4 py-3'
    )}>
      {/* Trip Info */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Destination */}
        <div className="flex items-center gap-1.5 text-foreground">
          <MapPin className={cn('flex-shrink-0 text-primary', compact ? 'h-4 w-4' : 'h-4 w-4')} />
          <span className={cn('font-semibold truncate', compact ? 'text-sm' : 'text-base')}>
            {trip.destination?.name || trip.title}
          </span>
        </div>

        {/* Separator */}
        <span className="text-muted-foreground/50">|</span>

        {/* Dates */}
        {dateRange && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className={cn('flex-shrink-0', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
            <span className={cn(compact ? 'text-xs' : 'text-sm')}>{dateRange}</span>
          </div>
        )}

        {/* Separator */}
        {trip.party_json && <span className="text-muted-foreground/50 hidden sm:inline">|</span>}

        {/* Travelers */}
        {trip.party_json && (
          <div className="flex items-center gap-1.5 text-muted-foreground hidden sm:flex">
            <Users className={cn('flex-shrink-0', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
            <span className={cn(compact ? 'text-xs' : 'text-sm')}>
              {trip.party_json.adults + (trip.party_json.children || 0)} traveler{(trip.party_json.adults + (trip.party_json.children || 0)) > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onShare}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
            compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
          )}
        >
          <Share2 className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
          <span className="hidden sm:inline">Share</span>
        </button>

        <button
          className={cn(
            'flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
            compact ? 'w-7 h-7' : 'w-8 h-8'
          )}
        >
          <MoreHorizontal className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        </button>
      </div>

      {/* Gradient underline accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </header>
  );
}
