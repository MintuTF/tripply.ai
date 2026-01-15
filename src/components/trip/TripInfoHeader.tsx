'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  color: 'text-purple-600',
  bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100'
};

const STATUS_CONFIG: Record<TripStatus, { label: string; color: string; bgColor: string }> = {
  planning: {
    label: 'Planning',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100'
  },
  completed: {
    label: 'Completed',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  archived: {
    label: 'Archived',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100'
  },
};

// Calculate effective status based on dates (auto + manual override)
function calculateEffectiveStatus(trip: Trip): TripStatus {
  // If manually archived or completed, keep it
  if (trip.status === 'archived') return 'archived';
  if (trip.status === 'completed') return 'completed';

  // If no dates, default to planning
  if (!trip.dates?.start || !trip.dates?.end) return 'planning';

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
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const effectiveStatus = calculateEffectiveStatus(trip);
  const statusConfig = STATUS_CONFIG[effectiveStatus];

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (showStatusDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below button
        left: rect.left,
      });
    }
  }, [showStatusDropdown]);

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
    <div className="bg-white/60 backdrop-blur-md border-b border-purple-100/50 px-6 py-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left side - Trip info */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Trip icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-200">
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
                ref={buttonRef}
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
                'border border-purple-100 bg-white/60 backdrop-blur-sm',
                'text-sm font-medium'
              )}
            >
              <Calendar className="h-4 w-4 text-purple-500" />
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

      {/* Status dropdown rendered via portal */}
      {mounted && showStatusDropdown && !isDraft && createPortal(
        <div ref={statusDropdownRef}>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                position: 'fixed',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
              }}
              className="bg-card rounded-xl border shadow-xl z-[60] overflow-hidden min-w-[160px]"
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
          </AnimatePresence>
        </div>,
        document.body
      )}
    </div>
  );
}
