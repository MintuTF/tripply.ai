'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Route,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TripStats {
  totalDays: number;
  plannedActivities: number;
  bookedActivities: number;
  estimatedBudget: number;
  spentBudget: number;
  travelTime: string;
  completionPercentage: number;
}

interface TripOverviewProps {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  stats: TripStats;
  onOptimizeRoute?: () => void;
  onAiSuggest?: () => void;
  className?: string;
}

export function TripOverview({
  destination,
  startDate,
  endDate,
  travelers,
  stats,
  onOptimizeRoute,
  onAiSuggest,
  className,
}: TripOverviewProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const budgetPercentage = Math.min(100, (stats.spentBudget / stats.estimatedBudget) * 100);
  const isOverBudget = stats.spentBudget > stats.estimatedBudget;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Trip Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Trip Overview</h3>

        <div className="space-y-4">
          {/* Destination */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Destination</p>
              <p className="font-medium text-foreground">{destination}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dates</p>
              <p className="font-medium text-foreground">
                {formatDate(startDate)} - {formatDate(endDate)}
              </p>
            </div>
          </div>

          {/* Travelers */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Travelers</p>
              <p className="font-medium text-foreground">
                {travelers} {travelers === 1 ? 'person' : 'people'}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium text-foreground">
                {stats.totalDays} {stats.totalDays === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Planning Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Planning Progress</h3>
          <span className="text-2xl font-bold text-primary">{stats.completionPercentage}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-accent rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-accent/50">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Booked</span>
            </div>
            <p className="text-xl font-bold text-foreground">{stats.bookedActivities}</p>
          </div>
          <div className="p-3 rounded-xl bg-accent/50">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {stats.plannedActivities - stats.bookedActivities}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Budget Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Budget</h3>
          <TrendingUp className={cn(
            'h-5 w-5',
            isOverBudget ? 'text-red-500' : 'text-green-500'
          )} />
        </div>

        {/* Budget Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              ${stats.spentBudget.toLocaleString()} spent
            </span>
            <span className="text-sm font-medium text-foreground">
              ${stats.estimatedBudget.toLocaleString()} budget
            </span>
          </div>
          <div className="h-3 bg-accent rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${budgetPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                isOverBudget
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : budgetPercentage > 80
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                  : 'bg-gradient-to-r from-green-500 to-green-600'
              )}
            />
          </div>
        </div>

        {/* Remaining */}
        <div className="p-3 rounded-xl bg-accent/50 text-center">
          <p className="text-sm text-muted-foreground mb-1">
            {isOverBudget ? 'Over budget by' : 'Remaining'}
          </p>
          <p className={cn(
            'text-2xl font-bold',
            isOverBudget ? 'text-red-500' : 'text-green-500'
          )}>
            ${Math.abs(stats.estimatedBudget - stats.spentBudget).toLocaleString()}
          </p>
        </div>
      </motion.div>

      {/* AI Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOptimizeRoute}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
        >
          <Route className="h-5 w-5" />
          Optimize Route
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAiSuggest}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
        >
          <Sparkles className="h-5 w-5" />
          AI Suggestions
        </motion.button>
      </motion.div>
    </div>
  );
}

export default TripOverview;
