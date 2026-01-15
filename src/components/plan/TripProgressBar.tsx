'use client';

import { motion } from 'framer-motion';
import { Hotel, Utensils, MapPin, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Card } from '@/types';

interface TripProgressBarProps {
  cards: Card[];
  onBuildItinerary?: () => void;
  className?: string;
}

export function TripProgressBar({ cards, onBuildItinerary, className }: TripProgressBarProps) {
  // Calculate stats
  const hotelCount = cards.filter((c) => c.type === 'hotel').length;
  const restaurantCount = cards.filter((c) => c.type === 'food').length;
  const activityCount = cards.filter((c) => c.type === 'spot').length;
  const totalCount = cards.length;

  // Determine if ready to build (has at least one of each type)
  const isReady = hotelCount > 0 && (restaurantCount > 0 || activityCount > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6">
            {/* Total */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{totalCount}</div>
                <div className="text-xs text-muted-foreground">Total Places</div>
              </div>
            </div>

            {/* Hotels */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Hotel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{hotelCount}</div>
                <div className="text-xs text-muted-foreground">Hotels</div>
              </div>
            </div>

            {/* Restaurants */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{restaurantCount}</div>
                <div className="text-xs text-muted-foreground">Restaurants</div>
              </div>
            </div>

            {/* Activities */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{activityCount}</div>
                <div className="text-xs text-muted-foreground">Activities</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            {isReady && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  Ready to Build
                </span>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBuildItinerary}
              disabled={!isReady}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all',
                'shadow-lg hover:shadow-xl',
                isReady
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              <Calendar className="h-5 w-5" />
              <span className="hidden sm:inline">Build Itinerary</span>
              <span className="sm:hidden">Build</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                Trip Planning Progress
              </span>
              <span className="text-xs font-medium text-foreground">
                {Math.min(100, Math.round((totalCount / 10) * 100))}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-primary/80 to-secondary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (totalCount / 10) * 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
