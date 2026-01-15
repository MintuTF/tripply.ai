'use client';

import { Calendar, Users, Share2, Bookmark } from 'lucide-react';
import type { Trip } from '@/types';

interface StickyTripHeaderProps {
  trip: Trip;
  onShare?: () => void;
  onSave?: () => void;
}

export function StickyTripHeader({ trip, onShare, onSave }: StickyTripHeaderProps) {
  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTravelerCount = () => {
    const adults = trip.party_json?.adults || 1;
    const children = trip.party_json?.children || 0;
    return adults + children;
  };

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-lg">{trip.destination?.name || trip.title}</h2>
            {trip.dates_json?.start && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(trip.dates_json.start)} - {formatDate(trip.dates_json.end)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{getTravelerCount()} travelers</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
            >
              <Bookmark className="h-4 w-4" />
              Save
            </button>
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
