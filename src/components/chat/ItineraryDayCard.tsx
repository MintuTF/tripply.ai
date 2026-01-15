'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, MapPin, Utensils, Hotel, Car, Sparkles } from 'lucide-react';
import type { ItineraryDay, ItineraryDayItem } from '@/types';
import { cn } from '@/lib/utils';

export interface ItineraryDayCardProps {
  day: ItineraryDay;
  defaultExpanded?: boolean;
  className?: string;
}

const TIME_SLOT_CONFIG = {
  morning: { label: 'Morning', icon: '☀️', color: 'text-amber-500' },
  afternoon: { label: 'Afternoon', icon: '🌤️', color: 'text-orange-500' },
  evening: { label: 'Evening', icon: '🌅', color: 'text-purple-500' },
  night: { label: 'Night', icon: '🌙', color: 'text-indigo-500' },
} as const;

const ITEM_TYPE_ICONS = {
  activity: MapPin,
  restaurant: Utensils,
  hotel: Hotel,
  transport: Car,
} as const;

export function ItineraryDayCard({ day, defaultExpanded = false, className }: ItineraryDayCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Group items by time slot
  const itemsBySlot = day.items.reduce((acc, item) => {
    const slot = item.timeSlot || 'morning';
    if (!acc[slot]) acc[slot] = [];
    acc[slot].push(item);
    return acc;
  }, {} as Record<string, ItineraryDayItem[]>);

  const totalStops = day.items.length;

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-900',
        'overflow-hidden',
        className
      )}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between',
          'hover:bg-gray-50 dark:hover:bg-gray-800/50',
          'transition-colors'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Day number badge */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
            {day.day}
          </div>

          <div className="text-left">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Day {day.day}: {day.theme}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalStops} {totalStops === 1 ? 'stop' : 'stops'}
            </p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
              {/* Why this day works */}
              {day.whyThisDayWorks && day.whyThisDayWorks.length > 0 && (
                <div className="mt-3 mb-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    WHY THIS DAY WORKS
                  </div>
                  <ul className="space-y-1">
                    {day.whyThisDayWorks.map((reason, idx) => (
                      <li key={idx} className="text-sm text-purple-600 dark:text-purple-400 flex items-start gap-2">
                        <span className="text-purple-400 dark:text-purple-500">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Time slots */}
              <div className="space-y-4">
                {(['morning', 'afternoon', 'evening', 'night'] as const).map((slot) => {
                  const items = itemsBySlot[slot];
                  if (!items || items.length === 0) return null;

                  const config = TIME_SLOT_CONFIG[slot];

                  return (
                    <div key={slot}>
                      {/* Time slot header */}
                      <div className={cn('flex items-center gap-2 mb-2', config.color)}>
                        <span className="text-base">{config.icon}</span>
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>

                      {/* Items in this slot */}
                      <div className="space-y-2 ml-6">
                        {items.map((item, idx) => (
                          <ItineraryItemCard key={idx} item={item} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual item within a day
 */
function ItineraryItemCard({ item }: { item: ItineraryDayItem }) {
  const Icon = ITEM_TYPE_ICONS[item.type] || MapPin;

  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {item.name}
            </h4>
            {item.durationMinutes && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                {formatDuration(item.durationMinutes)}
              </span>
            )}
          </div>

          {/* WHY bullets (max 2) */}
          {item.why && item.why.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {item.why.slice(0, 2).map((reason, idx) => (
                <li key={idx} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                  <span className="text-purple-400 mt-0.5">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format duration in minutes to human-readable string
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
