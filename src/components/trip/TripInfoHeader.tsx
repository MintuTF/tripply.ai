'use client';

import { useState, useRef, useEffect } from 'react';
import { Trip, TripStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Users,
  ChevronDown,
  Check,
  Archive,
  MapPin,
  Plane
} from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface TripInfoHeaderProps {
  trip: Trip;
  onTripUpdate: (updates: Partial<Trip>) => Promise<void>;
  onArchive?: () => void;
  isDraft?: boolean;
  isLoggedOut?: boolean;
}

const DRAFT_STATUS = {
  label: 'Draft',
  color: 'text-amber-600',
  bgColor: 'bg-amber-100 dark:bg-amber-900/30'
};

const STATUS_CONFIG: Record<TripStatus, { label: string; color: string; bgColor: string }> = {
  planning: {
    label: 'Planning',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  completed: {
    label: 'Completed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800/50'
  },
  archived: {
    label: 'Archived',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800/50'
  },
};

// Calculate effective status based on dates (auto + manual override)
function calculateEffectiveStatus(trip: Trip): TripStatus {
  // If manually archived or completed, keep it
  if (trip.status === 'archived') return 'archived';
  if (trip.status === 'completed') return 'completed';

  const now = new Date();
  const start = new Date(trip.dates.start);
  const end = new Date(trip.dates.end);

  // Auto-detect based on dates
  if (isAfter(now, end)) return 'completed';
  if (isAfter(now, start) && isBefore(now, end)) return 'in_progress';
  return 'planning';
}

export function TripInfoHeader({ trip, onTripUpdate, onArchive, isDraft, isLoggedOut }: TripInfoHeaderProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const effectiveStatus = calculateEffectiveStatus(trip);
  const statusConfig = STATUS_CONFIG[effectiveStatus];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: TripStatus) => {
    setShowStatusDropdown(false);
    if (newStatus !== trip.status) {
      setIsSaving(true);
      await onTripUpdate({ status: newStatus });
      setIsSaving(false);
    }
  };

  const formatDateRange = () => {
    const start = new Date(trip.dates.start);
    const end = new Date(trip.dates.end);

    if (start.getFullYear() === end.getFullYear()) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  };

  const getTotalTravelers = () => {
    const { adults = 2, children = 0, infants = 0 } = trip.party_json || {};
    return adults + children + infants;
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b border-border/50 px-6 py-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left side - Trip info */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Trip icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg">
            <Plane className="h-5 w-5 text-white" />
          </div>

          {/* Trip title - static display */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{trip.title}</span>
          </div>

          {/* Status badge - static for draft, dropdown for saved trips */}
          {isDraft ? (
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                DRAFT_STATUS.bgColor,
                DRAFT_STATUS.color
              )}
            >
              {DRAFT_STATUS.label}
            </div>
          ) : (
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                  'transition-all duration-200 hover:shadow-md',
                  statusConfig.bgColor,
                  statusConfig.color
                )}
              >
                {effectiveStatus === 'completed' && <Check className="h-3.5 w-3.5" />}
                {statusConfig.label}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              <AnimatePresence>
                {showStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 bg-card rounded-xl border shadow-xl z-50 overflow-hidden min-w-[160px]"
                  >
                    {(['planning', 'in_progress', 'completed'] as TripStatus[]).map((status) => {
                      const config = STATUS_CONFIG[status];
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={cn(
                            'w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium',
                            'hover:bg-accent/50 transition-colors text-left',
                            effectiveStatus === status && 'bg-accent/30'
                          )}
                        >
                          {status === 'completed' && <Check className="h-4 w-4" />}
                          <span className={config.color}>{config.label}</span>
                          {effectiveStatus === status && (
                            <Check className="h-4 w-4 ml-auto text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right side - Date and actions */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Destination (if set) */}
          {trip.destination?.name && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{trip.destination.name}</span>
            </div>
          )}

          {/* Date range - read-only display (hidden for logged-out users) */}
          {!isLoggedOut && (
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'border-2 border-border/50 bg-card/50 backdrop-blur-sm',
                'text-sm font-medium'
              )}
            >
              <Calendar className="h-4 w-4 text-primary" />
              {formatDateRange()}
            </div>
          )}

          {/* Travelers count (hidden for logged-out users) */}
          {!isLoggedOut && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{getTotalTravelers()} travelers</span>
            </div>
          )}

          {/* Archive button */}
          {onArchive && effectiveStatus !== 'archived' && (
            <button
              onClick={onArchive}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                'text-sm font-medium text-muted-foreground',
                'hover:bg-accent/50 transition-colors'
              )}
              title="Archive trip"
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="absolute top-2 right-2 text-xs text-muted-foreground">
          Saving...
        </div>
      )}
    </div>
  );
}
