'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, MapPin, Navigation2, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity, DayPlan } from './DayTimeline';
import type { MapPlace, MapRoute } from '@/components/maps/UniversalMapView';
import { calculateRouteDistance, formatDistance, formatDuration, estimateWalkingTime } from '@/lib/maps/distance';
import { shouldOptimize } from '@/lib/maps/routeOptimization';
import { RouteOptimizerPanel } from './RouteOptimizerPanel';
import { cn } from '@/lib/utils';

// Dynamically import map to avoid SSR issues
const UniversalMapView = dynamic(
  () => import('@/components/maps/UniversalMapView'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-accent/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <MapPin className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface ItineraryMapViewProps {
  days: DayPlan[];
  onClose: () => void;
  onOptimizeDay?: (dayNumber: number, optimizedOrder: string[]) => void;
}

// Day colors for route visualization (matching plan)
const DAY_COLORS = [
  '#3b82f6', // Day 1: Blue
  '#8b5cf6', // Day 2: Purple
  '#ec4899', // Day 3: Pink
  '#f59e0b', // Day 4: Orange
  '#10b981', // Day 5: Green
  '#06b6d4', // Day 6: Cyan
  '#f43f5e', // Day 7: Rose
];

/**
 * Map activity type to card type
 */
function activityTypeToCardType(type: Activity['type']): 'hotel' | 'spot' | 'food' | 'activity' {
  if (type === 'restaurant' || type === 'cafe') return 'food';
  if (type === 'shopping' || type === 'nature' || type === 'culture' || type === 'attraction') return 'spot';
  return 'activity';
}

export function ItineraryMapView({ days, onClose, onOptimizeDay }: ItineraryMapViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedActivity, setSelectedActivity] = useState<string | undefined>();
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [optimizingDay, setOptimizingDay] = useState<number | null>(null);

  // Convert activities to MapPlace format
  const { mapPlaces, routes, stats } = useMemo(() => {
    const places: MapPlace[] = [];
    const mapRoutes: MapRoute[] = [];
    const dayStats: Record<number, { distance: number; duration: number; activities: number }> = {};

    // Filter days based on selection
    const filteredDays = selectedDay === 'all'
      ? days
      : days.filter((d) => d.dayNumber === selectedDay);

    filteredDays.forEach((day) => {
      const dayActivities = day.activities.filter((a) => a.coordinates);

      if (dayActivities.length === 0) return;

      // Add places for this day
      dayActivities.forEach((activity, index) => {
        places.push({
          id: activity.id,
          name: activity.name,
          coordinates: activity.coordinates!,
          type: activityTypeToCardType(activity.type),
          day: day.dayNumber,
          order: index + 1,
          time: activity.startTime,
        });
      });

      // Add route for this day
      if (dayActivities.length > 1) {
        mapRoutes.push({
          day: day.dayNumber,
          stops: dayActivities.map((a) => a.id),
          color: DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length],
        });

        // Calculate day stats
        const coords = dayActivities.map((a) => a.coordinates!);
        const distance = calculateRouteDistance(coords);
        const duration = estimateWalkingTime(distance);

        dayStats[day.dayNumber] = {
          distance,
          duration,
          activities: dayActivities.length,
        };
      }
    });

    return { mapPlaces: places, routes: mapRoutes, stats: dayStats };
  }, [days, selectedDay]);

  // Calculate total stats
  const totalStats = useMemo(() => {
    const total = Object.values(stats).reduce(
      (acc, stat) => ({
        distance: acc.distance + stat.distance,
        duration: acc.duration + stat.duration,
        activities: acc.activities + stat.activities,
      }),
      { distance: 0, duration: 0, activities: 0 }
    );

    return total;
  }, [stats]);

  // Get days with activities
  const daysWithActivities = useMemo(() => {
    return days.filter((d) => d.activities.some((a) => a.coordinates));
  }, [days]);

  // Handle activity marker click
  const handleMarkerClick = (activityId: string) => {
    setSelectedActivity(activityId);
  };

  // Find selected activity details
  const selectedActivityData = useMemo(() => {
    if (!selectedActivity) return null;

    for (const day of days) {
      const activity = day.activities.find((a) => a.id === selectedActivity);
      if (activity) {
        return { activity, day: day.dayNumber };
      }
    }

    return null;
  }, [selectedActivity, days]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card rounded-2xl shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col overflow-hidden border-2 border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Trip Route Map</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalStats.activities} activities • {formatDistance(totalStats.distance)} • {formatDuration(totalStats.duration)} walking
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Day Filter Tabs */}
        <div className="flex items-center justify-between gap-2 p-4 border-b border-border bg-accent/30 overflow-x-auto">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedDay('all')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap',
                selectedDay === 'all'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-card hover:bg-accent'
              )}
            >
              All Days
              {selectedDay === 'all' && totalStats.activities > 0 && (
                <span className="text-xs opacity-80">
                  ({formatDistance(totalStats.distance)})
                </span>
              )}
            </button>

            {daysWithActivities.map((day) => {
            const dayColor = DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length];
            const isSelected = selectedDay === day.dayNumber;
            const dayStat = stats[day.dayNumber];

            return (
              <button
                key={day.dayNumber}
                onClick={() => setSelectedDay(day.dayNumber)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap border-2',
                  isSelected
                    ? 'bg-card shadow-lg'
                    : 'bg-card/50 hover:bg-card'
                )}
                style={{
                  borderColor: isSelected ? dayColor : 'transparent',
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dayColor }}
                />
                Day {day.dayNumber}
                {dayStat && (
                  <span className="text-xs text-muted-foreground">
                    ({dayStat.activities} stops, {formatDistance(dayStat.distance)})
                  </span>
                )}
              </button>
            );
          })}
          </div>

          {/* Optimize Button - Only show when a single day is selected */}
          {selectedDay !== 'all' && typeof selectedDay === 'number' && (() => {
            const day = days.find(d => d.dayNumber === selectedDay);
            const canOptimize = day && day.activities.length >= 3 &&
              day.activities.filter(a => a.coordinates).length >= 3;

            if (!canOptimize) return null;

            return (
              <button
                onClick={() => {
                  setOptimizingDay(selectedDay);
                  setShowOptimizer(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap"
              >
                <Zap className="h-4 w-4" />
                Optimize Route
              </button>
            );
          })()}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {mapPlaces.length > 0 ? (
            <UniversalMapView
              places={mapPlaces}
              routes={routes}
              interactive={true}
              showLegend={false}
              showStats={false}
              onMarkerClick={handleMarkerClick}
              selectedPlaceId={selectedActivity}
              fitBounds={true}
              className="h-full"
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-accent/30">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium text-foreground">No activities with locations</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add coordinates to your activities to see them on the map
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Activity Info Popup */}
        <AnimatePresence>
          {selectedActivityData && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4"
            >
              <div className="bg-card border-2 border-border rounded-2xl shadow-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{
                          backgroundColor: DAY_COLORS[(selectedActivityData.day - 1) % DAY_COLORS.length],
                        }}
                      >
                        {selectedActivityData.day}
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        {selectedActivityData.activity.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {selectedActivityData.activity.startTime} - {selectedActivityData.activity.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedActivityData.activity.location}</span>
                      </div>
                    </div>
                    {selectedActivityData.activity.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedActivityData.activity.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedActivity(undefined)}
                    className="p-1 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {selectedActivityData.activity.coordinates && (
                  <button
                    onClick={() => {
                      // Open in maps app
                      const { lat, lng } = selectedActivityData.activity.coordinates!;
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                        '_blank'
                      );
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <Navigation2 className="h-4 w-4" />
                    Get Directions
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Route Optimizer Panel */}
        <AnimatePresence>
          {showOptimizer && optimizingDay !== null && (() => {
            const day = days.find(d => d.dayNumber === optimizingDay);
            if (!day) return null;

            return (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <RouteOptimizerPanel
                  activities={day.activities}
                  dayNumber={day.dayNumber}
                  onApplyOptimization={(optimizedOrder) => {
                    if (onOptimizeDay) {
                      onOptimizeDay(optimizingDay, optimizedOrder);
                    }
                    setShowOptimizer(false);
                    setOptimizingDay(null);
                  }}
                  onClose={() => {
                    setShowOptimizer(false);
                    setOptimizingDay(null);
                  }}
                />
              </div>
            );
          })()}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
