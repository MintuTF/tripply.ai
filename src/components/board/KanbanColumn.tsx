'use client';

import { useState, useMemo } from 'react';
import { Card, CardType } from '@/types';
import { SortableKanbanCard } from './SortableKanbanCard';
import { cn } from '@/lib/utils';
import { Hotel, Utensils, Compass, ChevronDown, Sparkles, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

/**
 * Droppable Day Section wrapper component
 * Allows cards to be dropped onto day sections to assign a day
 */
function DroppableDaySection({
  dayNum,
  children,
  className,
}: {
  dayNum: number;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-section-${dayNum}`,
    data: {
      type: 'day-section',
      dayNumber: dayNum,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        'transition-all duration-200',
        isOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {children}
    </div>
  );
}

interface Category {
  id: CardType;
  label: string;
  icon: typeof Hotel;
  color: string;
  gradient: string;
}

interface KanbanColumnProps {
  column: {
    id: string;
    label: string;
    color: string;
  };
  categories: Category[];
  cardsByCategory: Record<string, Card[]>;
  onCardUpdate?: (card: Card) => void;
  onCardDelete?: (cardId: string) => void;
  onCardClick?: (card: Card) => void;
  onCardDuplicate?: (card: Card) => void;
  onAskAI?: () => void;
  tripDates?: { start: string; end: string };
}

/**
 * Format a date for day header display
 */
function formatDayDate(startDate: string, dayNumber: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayNumber - 1);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Calculate total trip days from dates
 */
function getTripDays(dates?: { start: string; end: string }): number {
  if (!dates?.start || !dates?.end) return 0;
  const start = new Date(dates.start);
  const end = new Date(dates.end);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * KanbanColumn - A single column in the Kanban board with sortable cards
 * Uses dnd-kit SortableContext for drag-and-drop reordering
 * For "confirmed" column with trip dates, groups cards by day
 */
export function KanbanColumn({
  column,
  categories,
  cardsByCategory,
  onCardUpdate,
  onCardDelete,
  onCardClick,
  onCardDuplicate,
  onAskAI,
  tripDates,
}: KanbanColumnProps) {
  // Track collapsed state for sections (days or categories)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const isSectionCollapsed = (sectionId: string) => {
    return collapsedSections[sectionId] ?? false;
  };

  // Calculate trip days for booked column
  const tripDayCount = getTripDays(tripDates);
  const isConfirmedWithDays = column.id === 'confirmed' && tripDayCount > 0;

  // Get all cards flat for this column
  const allCards = useMemo(() => {
    return categories.flatMap(cat => cardsByCategory[cat.id] || []);
  }, [categories, cardsByCategory]);

  // Group cards by day for booked column
  const cardsByDay = useMemo(() => {
    if (!isConfirmedWithDays) return null;

    const grouped: Record<number, Record<string, Card[]>> = {};

    // Initialize days 1 through N
    for (let day = 1; day <= tripDayCount; day++) {
      grouped[day] = {};
      categories.forEach(cat => {
        grouped[day][cat.id] = [];
      });
    }

    // Add day 0 for unscheduled
    grouped[0] = {};
    categories.forEach(cat => {
      grouped[0][cat.id] = [];
    });

    // Group cards by day and category
    allCards.forEach(card => {
      const dayNum = card.day || 0;
      const catId = card.type;

      if (!grouped[dayNum]) {
        grouped[dayNum] = {};
        categories.forEach(cat => {
          grouped[dayNum][cat.id] = [];
        });
      }

      if (grouped[dayNum][catId]) {
        grouped[dayNum][catId].push(card);
      }
    });

    // Sort cards within each day/category by order
    Object.keys(grouped).forEach(day => {
      Object.keys(grouped[Number(day)]).forEach(cat => {
        grouped[Number(day)][cat].sort((a, b) => (a.order || 0) - (b.order || 0));
      });
    });

    return grouped;
  }, [isConfirmedWithDays, allCards, categories, tripDayCount]);

  // Get total count for the column
  const totalCount = allCards.length;

  // Get all card IDs in this column for SortableContext
  const allCardIds = allCards.map(card => card.id);

  // Make the column droppable for cards coming from other columns
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      columnId: column.id,
      type: 'column',
    },
  });

  // Render category section (reusable for both modes)
  const renderCategorySection = (category: Category, categoryCards: Card[], keyPrefix: string = '') => {
    const Icon = category.icon;
    const isCollapsed = isSectionCollapsed(`${keyPrefix}${category.id}`);

    if (categoryCards.length === 0) return null;

    return (
      <div key={`${keyPrefix}${category.id}`} className="space-y-1">
        <button
          onClick={() => toggleSection(`${keyPrefix}${category.id}`)}
          className={cn(
            'w-full px-2 py-1.5 flex items-center justify-between transition-all duration-200 rounded-lg',
            'hover:bg-card/50'
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-1 rounded-md',
                category.color === 'blue' && 'bg-blue-500/15 text-blue-600',
                category.color === 'orange' && 'bg-orange-500/15 text-orange-600',
                category.color === 'purple' && 'bg-purple-500/15 text-purple-600'
              )}
            >
              <Icon className="h-3 w-3" />
            </div>
            <span className="text-xs font-medium">{category.label}</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                category.color === 'blue' && 'bg-blue-500/15 text-blue-700',
                category.color === 'orange' && 'bg-orange-500/15 text-orange-700',
                category.color === 'purple' && 'bg-purple-500/15 text-purple-700'
              )}
            >
              {categoryCards.length}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isCollapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-1.5 pl-1">
                {categoryCards.map((card, index) => (
                  <motion.div
                    key={card.id || `card-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <SortableKanbanCard
                      card={card}
                      columnId={column.id}
                      onCardUpdate={onCardUpdate}
                      onCardDelete={onCardDelete}
                      onCardClick={onCardClick}
                      onCardDuplicate={onCardDuplicate}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Render day section for booked column
  const renderDaySection = (dayNum: number, dayCards: Record<string, Card[]>) => {
    const dayCardCount = categories.reduce((sum, cat) => sum + (dayCards[cat.id]?.length || 0), 0);
    const isCollapsed = isSectionCollapsed(`day-${dayNum}`);
    const isUnscheduled = dayNum === 0;
    const isEmpty = dayCardCount === 0;

    return (
      <DroppableDaySection
        key={`day-${dayNum}`}
        dayNum={dayNum}
        className={cn(
          'rounded-xl border overflow-hidden bg-card/30 backdrop-blur-sm',
          isEmpty ? 'border-dashed border-border/50' : 'border-border/30'
        )}
      >
        {/* Day Header */}
        <button
          onClick={() => toggleSection(`day-${dayNum}`)}
          className={cn(
            'w-full px-3 py-2 flex items-center justify-between transition-all duration-200',
            'hover:bg-card/50',
            isUnscheduled && 'bg-muted/30'
          )}
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              'p-1.5 rounded-lg',
              isUnscheduled
                ? 'bg-gray-500/15 text-gray-600'
                : 'bg-green-500/15 text-green-600'
            )}>
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {isUnscheduled ? 'Unscheduled' : `Day ${dayNum}`}
              </span>
              {!isUnscheduled && tripDates && (
                <span className="text-xs text-muted-foreground">
                  {formatDayDate(tripDates.start, dayNum)}
                </span>
              )}
            </div>
            {dayCardCount > 0 && (
              <span className="rounded-full bg-green-500/15 text-green-700 px-2 py-0.5 text-xs font-semibold">
                {dayCardCount}
              </span>
            )}
          </div>
          {!isEmpty && (
            <motion.div
              animate={{ rotate: isCollapsed ? -90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </button>

        {/* Day Content - Categories within this day */}
        <AnimatePresence initial={false}>
          {!isCollapsed && !isEmpty && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-2 pb-2 space-y-2">
                {categories.map(category =>
                  renderCategorySection(category, dayCards[category.id] || [], `day-${dayNum}-`)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DroppableDaySection>
    );
  };

  return (
    <div className="flex min-w-[320px] flex-1 flex-col">
      {/* Column Header */}
      <div
        className="mb-4 rounded-2xl border-2 border-border/30 p-4 backdrop-blur-sm shadow-sm"
        style={{
          background:
            column.color === 'blue'
              ? 'linear-gradient(135deg, rgba(88, 166, 193, 0.1), rgba(88, 166, 193, 0.05))'
              : column.color === 'purple'
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))'
              : column.color === 'green'
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
              : 'linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(107, 114, 128, 0.05))',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-3 w-3 rounded-full shadow-lg',
                column.color === 'blue' && 'bg-primary shadow-primary/50',
                column.color === 'purple' && 'bg-accent-foreground shadow-accent-foreground/50',
                column.color === 'green' && 'bg-success shadow-success/50',
                column.color === 'gray' && 'bg-muted-foreground shadow-muted-foreground/50'
              )}
            />
            <h3 className="text-lg font-bold">{column.label}</h3>
            <span className="rounded-full bg-card/80 px-3 py-0.5 text-sm font-semibold shadow-sm">
              {totalCount}
            </span>
          </div>
          {onAskAI && (
            <button
              onClick={onAskAI}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-300 gradient-primary text-white shadow-md hover:shadow-lg hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              Ask AI
            </button>
          )}
        </div>
      </div>

      {/* Column Drop Zone with Sortable Cards */}
      <div
        ref={setDroppableRef}
        className={cn(
          'flex-1 overflow-y-auto space-y-3 pr-1 min-h-[200px] rounded-xl transition-colors',
          isOver && 'bg-primary/5 border-2 border-dashed border-primary/30'
        )}
      >
        <SortableContext items={allCardIds} strategy={verticalListSortingStrategy}>
          {isConfirmedWithDays && cardsByDay ? (
            // Day-grouped view for Confirmed column
            <>
              {/* Render days 1 through N */}
              {Array.from({ length: tripDayCount }, (_, i) => i + 1).map(dayNum =>
                renderDaySection(dayNum, cardsByDay[dayNum] || {})
              )}
              {/* Render unscheduled (day 0) at the end */}
              {renderDaySection(0, cardsByDay[0] || {})}
            </>
          ) : (
            // Category-grouped view for other columns
            <>
              {categories.map((category) => {
                const Icon = category.icon;
                const categoryCards = cardsByCategory[category.id] || [];
                const isCollapsed = isSectionCollapsed(category.id);

                if (categoryCards.length === 0) return null;

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border/30 overflow-hidden bg-card/30 backdrop-blur-sm"
                  >
                    {/* Category Sub-section Header */}
                    <button
                      onClick={() => toggleSection(category.id)}
                      className={cn(
                        'w-full px-3 py-2 flex items-center justify-between transition-all duration-200',
                        'hover:bg-card/50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'p-1.5 rounded-lg',
                            category.color === 'blue' && 'bg-blue-500/15 text-blue-600',
                            category.color === 'orange' && 'bg-orange-500/15 text-orange-600',
                            category.color === 'purple' && 'bg-purple-500/15 text-purple-600'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium">{category.label}</span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                            category.color === 'blue' && 'bg-blue-500/15 text-blue-700',
                            category.color === 'orange' && 'bg-orange-500/15 text-orange-700',
                            category.color === 'purple' && 'bg-purple-500/15 text-purple-700'
                          )}
                        >
                          {categoryCards.length}
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: isCollapsed ? -90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    </button>

                    {/* Category Cards */}
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-2 pb-2 space-y-2">
                            {categoryCards.map((card, index) => (
                              <motion.div
                                key={card.id || `card-${index}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                              >
                                <SortableKanbanCard
                                  card={card}
                                  columnId={column.id}
                                  onCardUpdate={onCardUpdate}
                                  onCardDelete={onCardDelete}
                                  onCardClick={onCardClick}
                                  onCardDuplicate={onCardDuplicate}
                                />
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </>
          )}

          {/* Empty state for column */}
          {totalCount === 0 && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">No items yet</p>
                <p className="text-xs mt-1">Drag cards here or add new ones</p>
              </div>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
