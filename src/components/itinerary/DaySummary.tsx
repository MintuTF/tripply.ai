'use client';

import { motion } from 'framer-motion';
import { Clock, DollarSign, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateDayStats, formatDuration, formatTime12Hour } from '@/lib/utils/validation';
import type { Card } from '@/types';

interface DaySummaryProps {
  dayNumber: number;
  allCards: Card[];
  className?: string;
}

export function DaySummary({ dayNumber, allCards, className }: DaySummaryProps) {
  const stats = calculateDayStats(dayNumber, allCards);

  if (stats.totalActivities === 0) {
    return (
      <div className={cn('rounded-lg border border-dashed border-border bg-accent/20 p-4', className)}>
        <p className="text-sm text-muted-foreground text-center">
          No activities planned for this day yet
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-border bg-card p-4 space-y-3',
        stats.hasConflicts && 'ring-2 ring-orange-500/20',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Day {dayNumber} Summary
        </h4>
        {stats.hasConflicts && (
          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
            <AlertTriangle className="h-3 w-3" />
            {stats.conflictCount} conflict{stats.conflictCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Time Range */}
        {stats.startTime && stats.endTime && (
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Time Range</p>
              <p className="text-sm font-medium text-foreground truncate">
                {formatTime12Hour(stats.startTime)} - {formatTime12Hour(stats.endTime)}
              </p>
            </div>
          </div>
        )}

        {/* Total Duration */}
        {stats.totalDuration > 0 && (
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium text-foreground">
                {formatDuration(stats.totalDuration)}
              </p>
            </div>
          </div>
        )}

        {/* Scheduled Activities */}
        <div className="flex items-start gap-2">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            stats.scheduledActivities === stats.totalActivities
              ? 'bg-green-100 dark:bg-green-900/20'
              : 'bg-yellow-100 dark:bg-yellow-900/20'
          )}>
            <CheckCircle className={cn(
              'h-4 w-4',
              stats.scheduledActivities === stats.totalActivities
                ? 'text-green-600 dark:text-green-400'
                : 'text-yellow-600 dark:text-yellow-400'
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Scheduled</p>
            <p className="text-sm font-medium text-foreground">
              {stats.scheduledActivities}/{stats.totalActivities} activities
            </p>
          </div>
        </div>

        {/* Estimated Cost */}
        {stats.totalCost > 0 && (
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Est. Cost</p>
              <p className="text-sm font-medium text-foreground">
                ${stats.totalCost.toFixed(0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Warnings */}
      {stats.hasConflicts && (
        <div className="pt-2 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400">
            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <p>
              Some activities have overlapping time slots. Consider adjusting the schedule to avoid conflicts.
            </p>
          </div>
        </div>
      )}

      {stats.unscheduledActivities > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <p>
              {stats.unscheduledActivities} activity{stats.unscheduledActivities > 1 ? ' activities' : ''}
              {' '}not yet scheduled. Click on {stats.unscheduledActivities > 1 ? 'them' : 'it'} to set a time.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Compact version for mobile
export function DaySummaryCompact({ dayNumber, allCards }: { dayNumber: number; allCards: Card[] }) {
  const stats = calculateDayStats(dayNumber, allCards);

  if (stats.totalActivities === 0) return null;

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground px-2 py-1 bg-accent/50 rounded">
      <span>{stats.scheduledActivities}/{stats.totalActivities} scheduled</span>
      {stats.hasConflicts && (
        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
          <AlertTriangle className="h-3 w-3" />
          {stats.conflictCount}
        </span>
      )}
      {stats.totalCost > 0 && <span>${stats.totalCost.toFixed(0)}</span>}
    </div>
  );
}
