'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Trip, TripStatus } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronDown, Check, Archive } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface TripInfoHeaderProps {
  trip: Trip;
  onTripUpdate: (updates: Partial<Trip>) => Promise<void>;
  onArchive?: () => void;
  isDraft?: boolean;
  isLoggedOut?: boolean;
  /** Short counts line, e.g. "6 places · 1 shop item" */
  summary?: string;
  /** Tools shown on the right (search, add, export...) */
  actions?: ReactNode;
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

export function TripInfoHeader({ trip, onTripUpdate, onArchive, isDraft, isLoggedOut, summary, actions }: TripInfoHeaderProps) {
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
    if (!trip.dates?.start || !trip.dates?.end) return '';
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

  const travelers = getTotalTravelers();
  const meta = [
    summary,
    trip.destination?.name,
    !isLoggedOut ? formatDateRange() : '',
    !isLoggedOut ? `${travelers} ${travelers === 1 ? 'traveler' : 'travelers'}` : '',
  ].filter(Boolean);

  const chipBase = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium';

  return (
    <div className="relative z-30 border-b border-gray-200/70 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {/* Left: name, status, one line of facts */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-gray-900">{trip.title}</h1>

            {isDraft ? (
              <span className={cn(chipBase, 'bg-purple-50 text-purple-700')}>{DRAFT_STATUS.label}</span>
            ) : (
              <div className="relative" ref={statusDropdownRef}>
                <button
                  ref={buttonRef}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={cn(chipBase, 'transition-shadow hover:shadow-sm', statusConfig.bgColor, statusConfig.color)}
                >
                  {effectiveStatus === 'completed' && <Check className="h-3 w-3" />}
                  {statusConfig.label}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          {meta.length > 0 && <p className="mt-0.5 truncate text-xs text-gray-500">{meta.join(' · ')}</p>}
        </div>

        {/* Right: tools */}
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onArchive && effectiveStatus !== 'archived' && (
            <button
              onClick={onArchive}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100"
              title="Archive trip"
              aria-label="Archive trip"
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
