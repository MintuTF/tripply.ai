'use client';

import { motion } from 'framer-motion';
import { Calendar, Users, Zap, Sparkles, RefreshCw, Plus, Sliders } from 'lucide-react';
import type { ItineraryResponse } from '@/types';
import { ItineraryDayCard } from './ItineraryDayCard';
import { cn } from '@/lib/utils';

export interface ItineraryResponseViewProps {
  itinerary: ItineraryResponse;
  onAdjustPace?: () => void;
  onAddDay?: () => void;
  onChangeFocus?: () => void;
  className?: string;
}

export function ItineraryResponseView({
  itinerary,
  onAdjustPace,
  onAddDay,
  onChangeFocus,
  className,
}: ItineraryResponseViewProps) {
  const { tripSummary, whyThisPlanWorks, days } = itinerary;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Trip Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800/30 p-4"
      >
        {/* Summary badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {tripSummary.days && (
            <Badge icon={Calendar} label={`${tripSummary.days} days`} />
          )}
          {tripSummary.travelerType && (
            <Badge icon={Users} label={tripSummary.travelerType} />
          )}
          {tripSummary.pace && (
            <Badge icon={Zap} label={`${tripSummary.pace} pace`} />
          )}
        </div>

        {/* Focus tags */}
        {tripSummary.focus && tripSummary.focus.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tripSummary.focus.map((focus, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs rounded-full bg-white/60 dark:bg-gray-800/60 text-purple-700 dark:text-purple-300"
              >
                {focus}
              </span>
            ))}
          </div>
        )}

        {/* Why this plan works */}
        {whyThisPlanWorks && whyThisPlanWorks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-700/30">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              WHY THIS PLAN WORKS
            </div>
            <ul className="space-y-1">
              {whyThisPlanWorks.map((reason, idx) => (
                <li
                  key={idx}
                  className="text-sm text-purple-600 dark:text-purple-400 flex items-start gap-2"
                >
                  <span className="text-purple-400 dark:text-purple-500">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* Day Cards */}
      <div className="space-y-3">
        {days.map((day, idx) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <ItineraryDayCard
              day={day}
              defaultExpanded={idx === 0} // First day expanded by default
            />
          </motion.div>
        ))}
      </div>

      {/* Action buttons */}
      {(onAdjustPace || onAddDay || onChangeFocus) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 pt-2"
        >
          {onAdjustPace && (
            <ActionButton
              icon={Sliders}
              label="Adjust pace"
              onClick={onAdjustPace}
            />
          )}
          {onAddDay && (
            <ActionButton
              icon={Plus}
              label="Add a day"
              onClick={onAddDay}
            />
          )}
          {onChangeFocus && (
            <ActionButton
              icon={RefreshCw}
              label="Change focus"
              onClick={onChangeFocus}
            />
          )}
        </motion.div>
      )}
    </div>
  );
}

/**
 * Summary badge component
 */
function Badge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 text-xs font-medium">
      <Icon className="w-3.5 h-3.5 text-purple-500" />
      {label}
    </div>
  );
}

/**
 * Action button for follow-up actions
 */
function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'text-xs font-medium',
        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
        'hover:bg-gray-200 dark:hover:bg-gray-700',
        'border border-gray-200 dark:border-gray-700',
        'transition-colors'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/**
 * Loading skeleton for itinerary
 */
export function ItineraryResponseSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-xl bg-gray-100 dark:bg-gray-800 p-4">
        <div className="flex gap-2 mb-3">
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Day card skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl bg-gray-100 dark:bg-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
