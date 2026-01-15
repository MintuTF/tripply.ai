'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingDown, Clock, Route, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import type { Activity } from './DayTimeline';
import { optimizeRoute, shouldOptimize, estimateOptimizationSavings, type RouteStop } from '@/lib/maps/routeOptimization';
import { formatDistance, formatDuration } from '@/lib/maps/distance';
import { cn } from '@/lib/utils';

interface RouteOptimizerPanelProps {
  activities: Activity[];
  dayNumber: number;
  onApplyOptimization: (optimizedOrder: string[]) => void;
  onClose: () => void;
}

/**
 * Convert Activity to RouteStop for optimization
 */
function activityToRouteStop(activity: Activity): RouteStop | null {
  if (!activity.coordinates) return null;

  // Determine time block from start time
  let timeBlock: 'morning' | 'afternoon' | 'evening' | undefined;
  if (activity.startTime) {
    const hour = parseInt(activity.startTime.split(':')[0]);
    if (hour < 12) timeBlock = 'morning';
    else if (hour < 17) timeBlock = 'afternoon';
    else timeBlock = 'evening';
  }

  return {
    id: activity.id,
    name: activity.name,
    coordinates: activity.coordinates,
    timeBlock,
  };
}

export function RouteOptimizerPanel({
  activities,
  dayNumber,
  onApplyOptimization,
  onClose,
}: RouteOptimizerPanelProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Convert activities to route stops
  const routeStops = useMemo(() => {
    return activities
      .map(activityToRouteStop)
      .filter((stop): stop is RouteStop => stop !== null);
  }, [activities]);

  // Check if optimization is worth it
  const canOptimize = useMemo(() => shouldOptimize(routeStops), [routeStops]);

  // Estimate potential savings
  const estimate = useMemo(() => {
    return estimateOptimizationSavings(routeStops);
  }, [routeStops]);

  // Run optimization
  const optimizationResult = useMemo(() => {
    if (!canOptimize) return null;
    return optimizeRoute(routeStops, { respectTimeBlocks: true, use2Opt: true });
  }, [routeStops, canOptimize]);

  // Handle optimize button click
  const handleOptimize = () => {
    setIsOptimizing(true);
    // Simulate processing time for better UX
    setTimeout(() => {
      setIsOptimizing(false);
      setShowComparison(true);
    }, 800);
  };

  // Handle apply optimization
  const handleApply = () => {
    if (optimizationResult) {
      onApplyOptimization(optimizationResult.optimizedRoute.order);
    }
  };

  if (!canOptimize) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl"
      >
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-1">
              Route Looks Good!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your current route is already efficient. Optimization works best with 4+ stops or routes with backtracking.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-xl font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isOptimizing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border-2 border-border rounded-2xl p-8 shadow-xl"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary"
            />
            <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground mb-1">
              Optimizing Your Route...
            </h3>
            <p className="text-sm text-muted-foreground">
              Finding the most efficient path through {routeStops.length} stops
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!showComparison) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 flex-shrink-0">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-1">
              Optimize Day {dayNumber} Route
            </h3>
            <p className="text-sm text-muted-foreground">
              Automatically reorder your stops to minimize travel distance and time
            </p>
          </div>
        </div>

        {/* Estimated Savings */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-accent/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Potential Savings</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatDistance(estimate.potentialSavings)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-accent/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Time Saved</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ~{Math.round((estimate.potentialSavings / 5) * 60)} min
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground">Confidence:</span>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold',
              estimate.confidence === 'high' && 'bg-green-500/10 text-green-700',
              estimate.confidence === 'medium' && 'bg-yellow-500/10 text-yellow-700',
              estimate.confidence === 'low' && 'bg-gray-500/10 text-gray-700'
            )}
          >
            {estimate.confidence.toUpperCase()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleOptimize}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:bg-primary/90 transition-all hover:shadow-xl"
          >
            <Zap className="h-4 w-4" />
            Optimize Route
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-accent hover:bg-accent/80 text-foreground rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    );
  }

  // Show comparison view
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl max-w-2xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            Optimization Results
          </h3>
          <p className="text-sm text-muted-foreground">
            Compare the original and optimized routes
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Comparison Stats */}
      {optimizationResult && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-600">Distance Saved</span>
            </div>
            <p className="text-2xl font-bold text-red-700">
              {formatDistance(optimizationResult.improvement.distanceSaved)}
            </p>
            <p className="text-xs text-red-600 mt-1">
              {optimizationResult.improvement.percentImprovement.toFixed(1)}% improvement
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Time Saved</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {formatDuration(optimizationResult.improvement.timeSaved)}
            </p>
            <p className="text-xs text-blue-600 mt-1">Walking time</p>
          </div>

          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Route className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">New Distance</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {formatDistance(optimizationResult.optimizedRoute.totalDistance)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              vs {formatDistance(optimizationResult.originalRoute.totalDistance)} before
            </p>
          </div>
        </div>
      )}

      {/* Route Comparison */}
      {optimizationResult && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Original Route */}
          <div className="p-4 rounded-xl bg-accent/30 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              Original Route
            </h4>
            <div className="space-y-2">
              {optimizationResult.originalRoute.stops.map((stop, index) => (
                <div key={stop.id} className="flex items-center gap-2 text-sm">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-500/20 text-gray-700 text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-foreground truncate">{stop.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Optimized Route */}
          <div className="p-4 rounded-xl bg-primary/10 border-2 border-primary">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Optimized Route
            </h4>
            <div className="space-y-2">
              {optimizationResult.optimizedRoute.stops.map((stop, index) => (
                <div key={stop.id} className="flex items-center gap-2 text-sm">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-foreground truncate font-medium">{stop.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleApply}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:bg-primary/90 transition-all hover:shadow-xl"
        >
          <Check className="h-4 w-4" />
          Apply Optimized Route
        </button>
        <button
          onClick={onClose}
          className="px-4 py-3 bg-accent hover:bg-accent/80 text-foreground rounded-xl font-medium transition-colors"
        >
          Keep Original
        </button>
      </div>
    </motion.div>
  );
}
