'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Trip, TravelInfo } from '@/types';
import { WeatherWidget } from '@/components/trip/WeatherWidget';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Car,
  Footprints,
  Train,
  Plane,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ItineraryViewProps {
  cards: Card[];
  trip: Trip;
  onCardClick?: (card: Card) => void;
  onUpdateCard?: (cardId: string, updates: Partial<Card>) => void;
  onScheduleCard?: (card: Card) => void;
}

interface DayGroup {
  day: number;
  date: string;
  cards: Card[];
  totalTravelTime: number;
  isOverloaded: boolean;
}

// Sortable Card Component
interface SortableCardProps {
  card: Card;
  isLast: boolean;
  onCardClick?: (card: Card) => void;
  getTravelIcon: (mode?: 'driving' | 'walking' | 'transit' | 'flight') => React.ReactNode;
  formatTravelTime: (minutes: number) => string;
}

function SortableCard({ card, isLast, onCardClick, getTravelIcon, formatTravelTime }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const payload = card.payload_json as any;

  return (
    <div ref={setNodeRef} style={style}>
      {/* Card */}
      <div
        className={cn(
          'rounded-xl border-2 border-border bg-background p-4',
          'hover:border-primary/50 hover:shadow-md transition-all',
          'group relative',
          isDragging && 'shadow-2xl ring-2 ring-primary'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Time Badge */}
          {card.time_slot && (
            <div className="flex-shrink-0 rounded-lg bg-muted px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 inline mb-0.5 mr-1 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {card.time_slot}
              </span>
            </div>
          )}

          {/* Card Content */}
          <div
            onClick={() => onCardClick?.(card)}
            className="flex-1 min-w-0 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h5 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {payload.name}
                </h5>
                {payload.address && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {payload.address}
                  </p>
                )}
              </div>
              <span className="flex-shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground capitalize">
                {card.type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Travel Info to Next Stop */}
      {!isLast && card.travel_info && (
        <div className="flex items-center gap-2 py-2 pl-8 text-sm text-muted-foreground">
          {getTravelIcon(card.travel_info.mode)}
          <span>
            {formatTravelTime(card.travel_info.duration)} • {card.travel_info.distance.toFixed(1)} km
          </span>
        </div>
      )}
    </div>
  );
}

export function ItineraryView({ cards, trip, onCardClick, onUpdateCard, onScheduleCard }: ItineraryViewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  // Setup drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate total trip days
  const startDate = new Date(trip.dates.start);
  const endDate = new Date(trip.dates.end);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Group cards by day
  const dayGroups: DayGroup[] = [];
  for (let day = 1; day <= totalDays; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + (day - 1));

    const dayCards = cards
      .filter((c) => c.day === day)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const totalTravelTime = dayCards.reduce(
      (sum, card) => sum + (card.travel_info?.duration || 0),
      0
    );

    // Warn if more than 4 hours of travel in one day
    const isOverloaded = totalTravelTime > 240;

    dayGroups.push({
      day,
      date: dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      cards: dayCards,
      totalTravelTime,
      isOverloaded,
    });
  }

  // Unscheduled cards (no day assigned)
  const unscheduledCards = cards.filter((c) => !c.day);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent, dayNumber: number) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Find the day's cards
    const dayCards = dayGroups.find((g) => g.day === dayNumber)?.cards || [];
    const oldIndex = dayCards.findIndex((c) => c.id === active.id);
    const newIndex = dayCards.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder cards within the day
    const reorderedCards = arrayMove(dayCards, oldIndex, newIndex);

    // Update order for all cards in this day
    reorderedCards.forEach((card, index) => {
      if (onUpdateCard) {
        onUpdateCard(card.id, { order: index + 1 });
      }
    });
  };

  const toggleDay = (day: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const getTravelIcon = (mode?: 'driving' | 'walking' | 'transit' | 'flight') => {
    switch (mode) {
      case 'walking':
        return <Footprints className="h-3.5 w-3.5" />;
      case 'transit':
        return <Train className="h-3.5 w-3.5" />;
      case 'flight':
        return <Plane className="h-3.5 w-3.5" />;
      default:
        return <Car className="h-3.5 w-3.5" />;
    }
  };

  const formatTravelTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-4">
      {/* Trip Overview */}
      <div className="rounded-xl border-2 border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">{trip.title}</h3>
              <p className="text-sm text-muted-foreground">
                {totalDays} {totalDays === 1 ? 'day' : 'days'} • {trip.dates.start} to {trip.dates.end}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Stops</p>
            <p className="text-2xl font-bold text-foreground">{cards.filter(c => c.day).length}</p>
          </div>
        </div>
      </div>

      {/* Weather Forecast */}
      <WeatherWidget trip={trip} />

      {/* Day-by-Day Itinerary */}
      {dayGroups.map((group) => (
        <motion.div
          key={group.day}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-border bg-card overflow-hidden"
        >
          {/* Day Header */}
          <button
            onClick={() => toggleDay(group.day)}
            className={cn(
              'w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors',
              expandedDays.has(group.day) && 'bg-muted/30'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-white font-bold">
                {group.day}
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-foreground">Day {group.day}</h4>
                <p className="text-sm text-muted-foreground">{group.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{group.cards.length}</span>
                </div>
                {group.totalTravelTime > 0 && (
                  <div className={cn(
                    'flex items-center gap-1.5',
                    group.isOverloaded && 'text-orange-500 dark:text-orange-400'
                  )}>
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{formatTravelTime(group.totalTravelTime)}</span>
                  </div>
                )}
                {group.isOverloaded && (
                  <AlertCircle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                )}
              </div>

              {expandedDays.has(group.day) ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Day Content */}
          <AnimatePresence>
            {expandedDays.has(group.day) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="border-t border-border p-4 space-y-3">
                  {group.cards.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No stops scheduled for this day</p>
                      <p className="text-xs mt-1">Drag cards here or assign them to Day {group.day}</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(event, group.day)}
                    >
                      <SortableContext
                        items={group.cards.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {group.cards.map((card, index) => {
                          const isLast = index === group.cards.length - 1;
                          return (
                            <SortableCard
                              key={card.id || `sortable-${index}`}
                              card={card}
                              isLast={isLast}
                              onCardClick={onCardClick}
                              getTravelIcon={getTravelIcon}
                              formatTravelTime={formatTravelTime}
                            />
                          );
                        })}
                      </SortableContext>
                    </DndContext>
                  )}

                  {/* Overload Warning */}
                  {group.isOverloaded && (
                    <div className="flex items-start gap-2 rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 mt-4">
                      <AlertCircle className="h-4 w-4 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-orange-600 dark:text-orange-400">
                          Heavy travel day
                        </p>
                        <p className="text-orange-600/80 dark:text-orange-400/80 mt-0.5">
                          This day has over 4 hours of travel time. Consider spreading stops across multiple days.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Unscheduled Cards */}
      {unscheduledCards.length > 0 && (
        <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-4">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Unscheduled ({unscheduledCards.length})
          </h4>
          <div className="space-y-2">
            {unscheduledCards.map((card, index) => {
              const payload = card.payload_json as any;
              return (
                <div
                  key={card.id || `unsched-${index}`}
                  className="rounded-lg border border-border bg-background p-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div onClick={() => onCardClick?.(card)} className="flex-1 min-w-0 cursor-pointer">
                      <h5 className="font-medium text-foreground line-clamp-1">{payload.name}</h5>
                      {payload.address && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {payload.address}
                        </p>
                      )}
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground capitalize">
                      {card.type}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleCard?.(card);
                      }}
                      className="flex-shrink-0 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:shadow-md hover:scale-105"
                    >
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Schedule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
