'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  Bed,
  Sparkles,
  Sunrise,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Activity, DayPlan } from '@/components/plan-page';
import type { Card } from '@/types';
import { DaySummary } from './DaySummary';

interface DraggableDayTimelineProps {
  days: DayPlan[];
  unscheduledActivities?: Activity[];
  allCards?: Card[];
  onDayChange?: (activityId: string, newDay: number, newOrder: number) => void;
  onReorder?: (dayNumber: number, activityIds: string[]) => void;
  onUnschedule?: (activityId: string) => void;
  onAddActivity?: (dayIndex: number) => void;
  onEditActivity?: (dayIndex: number, activityId: string) => void;
  className?: string;
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  attraction: Camera,
  restaurant: Utensils,
  shopping: ShoppingBag,
  nature: Palmtree,
  culture: Landmark,
  cafe: Coffee,
  hotel: Bed,
  other: Sparkles,
};

const ACTIVITY_COLORS: Record<string, string> = {
  attraction: 'from-blue-500 to-blue-600',
  restaurant: 'from-orange-500 to-orange-600',
  shopping: 'from-pink-500 to-pink-600',
  nature: 'from-green-500 to-green-600',
  culture: 'from-purple-500 to-purple-600',
  cafe: 'from-amber-500 to-amber-600',
  hotel: 'from-emerald-500 to-emerald-600',
  other: 'from-gray-500 to-gray-600',
};

const getTimeOfDay = (time: string): 'morning' | 'afternoon' | 'evening' | 'night' => {
  if (!time) return 'morning';
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

// Sortable Activity Card Component
function SortableActivityCard({
  activity,
  dayIndex,
  onEdit,
}: {
  activity: Activity;
  dayIndex: number;
  onEdit?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.other;
  const colorClass = ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.other;

  return (
    <div
      ref={setNodeRef}
      style={style}
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
        className={cn(
          'flex-1 p-4 rounded-xl border border-border bg-background transition-all cursor-pointer',
          'hover:border-primary/30 hover:shadow-md group-hover:translate-x-1',
          isDragging && 'shadow-2xl ring-2 ring-primary'
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Drag Handle */}
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded transition-colors"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>

              <h4
                onClick={onEdit}
                className="font-semibold text-foreground truncate hover:text-primary transition-colors"
              >
                {activity.name}
              </h4>
              {activity.isBooked && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  Booked
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {activity.startTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {activity.startTime}{activity.endTime && ` - ${activity.endTime}`}
                </span>
              )}
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
    </div>
  );
}

export function DraggableDayTimeline({
  days,
  unscheduledActivities = [],
  allCards = [],
  onDayChange,
  onReorder,
  onUnschedule,
  onAddActivity,
  onEditActivity,
  className,
}: DraggableDayTimelineProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showUnscheduled, setShowUnscheduled] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine source and destination
    let sourceDay: number | null = null;
    let destDay: number | null = null;

    // Find source day
    days.forEach((day, idx) => {
      if (day.activities.some(a => a.id === activeId)) {
        sourceDay = day.dayNumber;
      }
    });

    // Check if dropping on unscheduled
    if (overId === 'unscheduled') {
      if (sourceDay !== null && onUnschedule) {
        onUnschedule(activeId);
      }
      setActiveId(null);
      return;
    }

    // Find destination day
    days.forEach((day, idx) => {
      if (day.activities.some(a => a.id === overId) || overId === `day-${day.dayNumber}`) {
        destDay = day.dayNumber;
      }
    });

    // If dropped on a day header
    if (overId.startsWith('day-')) {
      destDay = parseInt(overId.split('-')[1]);
    }

    // Handle reordering within same day
    if (sourceDay === destDay && sourceDay !== null) {
      const dayIndex = days.findIndex(d => d.dayNumber === sourceDay);
      const activities = days[dayIndex].activities;
      const oldIndex = activities.findIndex(a => a.id === activeId);
      const newIndex = activities.findIndex(a => a.id === overId);

      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
        const reorderedActivities = arrayMove(activities, oldIndex, newIndex);
        if (onReorder) {
          onReorder(sourceDay, reorderedActivities.map(a => a.id));
        }
      }
    }
    // Handle moving between days or from unscheduled
    else if (destDay !== null && onDayChange) {
      const destDayIndex = days.findIndex(d => d.dayNumber === destDay);
      const newOrder = days[destDayIndex].activities.length; // Add at end
      onDayChange(activeId, destDay, newOrder);
    }

    setActiveId(null);
  };

  const activeActivity = activeId
    ? [...days.flatMap(d => d.activities), ...unscheduledActivities].find(a => a.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('space-y-4', className)}>
        {/* Unscheduled Activities */}
        {unscheduledActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden"
          >
            <button
              onClick={() => setShowUnscheduled(!showUnscheduled)}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground">Unscheduled</h3>
                  <p className="text-sm text-muted-foreground">
                    {unscheduledActivities.length} card{unscheduledActivities.length !== 1 ? 's' : ''} to plan
                  </p>
                </div>
              </div>
              {showUnscheduled ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            <AnimatePresence>
              {showUnscheduled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  id="unscheduled"
                  className="px-4 sm:px-5 pb-5"
                >
                  <SortableContext items={unscheduledActivities.map(a => a.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {unscheduledActivities.map((activity) => (
                        <SortableActivityCard
                          key={activity.id}
                          activity={activity}
                          dayIndex={-1}
                          onEdit={() => onEditActivity?.(-1, activity.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Days */}
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
              id={`day-${day.dayNumber}`}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Day Header */}
              <button
                onClick={() => toggleDay(dayIndex)}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
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

                  <div className={cn(
                    'p-2 rounded-lg transition-colors',
                    isExpanded ? 'bg-primary/10 text-primary' : 'bg-accent'
                  )}>
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
                      {day.activities.length > 0 ? (
                        <div className="relative">
                          <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

                          <SortableContext items={day.activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                              {day.activities.map((activity, activityIndex) => (
                                <SortableActivityCard
                                  key={activity.id}
                                  activity={activity}
                                  dayIndex={dayIndex}
                                  onEdit={() => onEditActivity?.(dayIndex, activity.id)}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </div>
                      ) : (
                        <div
                          id={`day-${day.dayNumber}`}
                          className="text-center py-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground mb-2">Drop activities here</p>
                          <p className="text-xs text-muted-foreground">Or click below to add</p>
                        </div>
                      )}

                      {/* Day Summary Statistics */}
                      {allCards.length > 0 && (
                        <div className="mt-4">
                          <DaySummary dayNumber={day.dayNumber} allCards={allCards} />
                        </div>
                      )}

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
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeActivity ? (
          <div className="flex gap-4 opacity-80">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br',
                ACTIVITY_COLORS[activeActivity.type] || ACTIVITY_COLORS.other
              )}>
                {(() => {
                  const Icon = ACTIVITY_ICONS[activeActivity.type] || ACTIVITY_ICONS.other;
                  return <Icon className="h-6 w-6 text-white" />;
                })()}
              </div>
            </div>
            <div className="flex-1 p-4 rounded-xl border border-primary bg-card shadow-2xl">
              <h4 className="font-semibold text-foreground">{activeActivity.name}</h4>
              <p className="text-sm text-muted-foreground">{activeActivity.location}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default DraggableDayTimeline;
