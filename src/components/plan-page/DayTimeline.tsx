'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Clock,
  MapPin,
  DollarSign,
  Utensils,
  Camera,
  ShoppingBag,
  Landmark,
  Palmtree,
  Coffee,
  Moon,
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Activity {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'shopping' | 'nature' | 'culture' | 'cafe' | 'other';
  startTime: string;
  endTime: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  estimatedCost?: number;
  notes?: string;
  image?: string;
  isBooked?: boolean;
}

export interface DayPlan {
  date: string;
  dayNumber: number;
  activities: Activity[];
  notes?: string;
}

interface DayTimelineProps {
  days: DayPlan[];
  onAddActivity?: (dayIndex: number) => void;
  onEditActivity?: (dayIndex: number, activityId: string) => void;
  onDeleteActivity?: (dayIndex: number, activityId: string) => void;
  onReorderActivities?: (dayIndex: number, activities: Activity[]) => void;
  className?: string;
}

const ACTIVITY_ICONS: Record<Activity['type'], React.ElementType> = {
  attraction: Camera,
  restaurant: Utensils,
  shopping: ShoppingBag,
  nature: Palmtree,
  culture: Landmark,
  cafe: Coffee,
  other: MapPin,
};

const ACTIVITY_COLORS: Record<Activity['type'], string> = {
  attraction: 'from-blue-500 to-blue-600',
  restaurant: 'from-orange-500 to-orange-600',
  shopping: 'from-pink-500 to-pink-600',
  nature: 'from-green-500 to-green-600',
  culture: 'from-purple-500 to-purple-600',
  cafe: 'from-amber-500 to-amber-600',
  other: 'from-gray-500 to-gray-600',
};

const getTimeOfDay = (time: string): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const TimeOfDayIcon: Record<string, React.ElementType> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

export function DayTimeline({
  days,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onReorderActivities,
  className,
}: DayTimelineProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));

  const toggleDay = (dayIndex: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayIndex)) {
        next.delete(dayIndex);
      } else {
        next.add(dayIndex);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
      full: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  };

  return (
    <div className={cn('space-y-4', className)}>
      {days.map((day, dayIndex) => {
        const isExpanded = expandedDays.has(dayIndex);
        const dateInfo = formatDate(day.date);
        const totalCost = day.activities.reduce((sum, a) => sum + (a.estimatedCost || 0), 0);

        return (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.1 }}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Day Header */}
            <button
              onClick={() => toggleDay(dayIndex)}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Day Number Badge */}
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg">
                  <span className="text-xs font-medium opacity-90">Day</span>
                  <span className="text-xl font-bold">{day.dayNumber}</span>
                </div>

                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground">{dateInfo.weekday}</h3>
                  <p className="text-sm text-muted-foreground">{dateInfo.full}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Day Summary */}
                <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {day.activities.length} activities
                  </span>
                  {totalCost > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ~${totalCost}
                    </span>
                  )}
                </div>

                {/* Expand/Collapse */}
                <div className={cn(
                  'p-2 rounded-lg transition-colors',
                  isExpanded ? 'bg-primary/10 text-primary' : 'bg-accent'
                )}>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </button>

            {/* Day Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-5 pb-5 pt-2">
                    {/* Timeline */}
                    {day.activities.length > 0 ? (
                      <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

                        {/* Activities */}
                        <div className="space-y-4">
                          {day.activities.map((activity, activityIndex) => {
                            const Icon = ACTIVITY_ICONS[activity.type];
                            const colorClass = ACTIVITY_COLORS[activity.type];
                            const timeOfDay = getTimeOfDay(activity.startTime);
                            const TimeIcon = TimeOfDayIcon[timeOfDay];

                            return (
                              <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: activityIndex * 0.05 }}
                                className="flex gap-4 group"
                              >
                                {/* Timeline Node */}
                                <div className="flex flex-col items-center">
                                  <div className={cn(
                                    'w-14 h-14 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br',
                                    colorClass
                                  )}>
                                    <Icon className="h-6 w-6 text-white" />
                                  </div>
                                </div>

                                {/* Activity Card */}
                                <div
                                  onClick={() => onEditActivity?.(dayIndex, activity.id)}
                                  className="flex-1 p-4 rounded-xl border border-border bg-background hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group-hover:translate-x-1"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-foreground truncate">
                                          {activity.name}
                                        </h4>
                                        {activity.isBooked && (
                                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                            Booked
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3.5 w-3.5" />
                                          {activity.startTime} - {activity.endTime}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3.5 w-3.5" />
                                          {activity.location}
                                        </span>
                                        {activity.estimatedCost && (
                                          <span className="flex items-center gap-1">
                                            <DollarSign className="h-3.5 w-3.5" />
                                            ~${activity.estimatedCost}
                                          </span>
                                        )}
                                      </div>
                                      {activity.notes && (
                                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                          {activity.notes}
                                        </p>
                                      )}
                                    </div>

                                    {/* Activity Image */}
                                    {activity.image && (
                                      <div className="hidden sm:block w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                        <img
                                          src={activity.image}
                                          alt={activity.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
                          <MapPin className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">No activities planned yet</p>
                      </div>
                    )}

                    {/* Add Activity Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onAddActivity?.(dayIndex)}
                      className="w-full mt-4 flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="font-medium">Add Activity</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Add New Day Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
      >
        <Plus className="h-5 w-5" />
        <span className="font-medium">Add Another Day</span>
      </motion.button>
    </div>
  );
}

export default DayTimeline;
