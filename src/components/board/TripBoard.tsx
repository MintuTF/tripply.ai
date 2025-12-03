'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, Trip, CardType } from '@/types';
import { CardList } from './CardList';
import { KanbanColumn } from './KanbanColumn';
import { ItineraryView } from './ItineraryView';
import { DayAssignmentModal } from './DayAssignmentModal';
import { CardDetailPanel } from './CardDetailPanel';
import { BudgetWidget } from '@/components/budget/BudgetWidget';
import { BudgetBreakdown } from '@/components/budget/BudgetBreakdown';
import { ResultCard } from '@/components/cards/ResultCard';
import { cn } from '@/lib/utils';
import { Search, Grid, List, LayoutGrid, Calendar, Wallet, Hotel, Utensils, Compass } from 'lucide-react';
import { TripInfoHeader } from '@/components/trip/TripInfoHeader';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

interface TripBoardProps {
  tripId: string;
  trip: Trip;
  cards?: Card[];
  onCardUpdate?: (card: Card) => void;
  onCardDelete?: (cardId: string) => void;
  onTripUpdate?: (updates: Partial<Trip>) => Promise<void>;
  onArchive?: () => void;
  isLoggedOut?: boolean;
}

/**
 * TripBoard - Kanban-style board for organizing saved cards
 * Inspired by Notion and Linear's card organization
 */
export function TripBoard({ tripId, trip, cards = [], onCardUpdate, onCardDelete, onTripUpdate, onArchive, isLoggedOut }: TripBoardProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'list' | 'itinerary' | 'budget'>('kanban');
  const [totalBudget, setTotalBudget] = useState<number | undefined>(trip.budget_range ? trip.budget_range[1] : undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleModalCard, setScheduleModalCard] = useState<Card | null>(null);

  // Card detail panel state
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Keep selectedCard in sync with cards prop when card data changes
  useEffect(() => {
    if (selectedCard) {
      const updatedCard = cards.find(c => c.id === selectedCard.id);
      if (updatedCard && JSON.stringify(updatedCard) !== JSON.stringify(selectedCard)) {
        setSelectedCard(updatedCard);
      }
    }
  }, [cards, selectedCard]);

  // Drag and drop state
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // Setup drag-and-drop sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Define board columns (for legacy kanban view)
  const columns = [
    { id: 'considering', label: 'Considering', color: 'blue' },
    { id: 'shortlist', label: 'Shortlist', color: 'purple' },
    { id: 'booked', label: 'Booked', color: 'green' },
    { id: 'dismissed', label: 'Dismissed', color: 'gray' },
  ];

  // Define vertical category sections (new auto-organized view)
  const categories = [
    { id: 'hotel' as CardType, label: 'Hotels', icon: Hotel, color: 'blue', gradient: 'from-blue-500/10 to-blue-600/5' },
    { id: 'food' as CardType, label: 'Restaurants', icon: Utensils, color: 'orange', gradient: 'from-orange-500/10 to-orange-600/5' },
    { id: 'spot' as CardType, label: 'Things to Do', icon: Compass, color: 'purple', gradient: 'from-purple-500/10 to-purple-600/5' },
  ];

  // Filter and organize cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Search filter
      if (searchQuery) {
        const payload = typeof card.payload_json === 'string' ? JSON.parse(card.payload_json) : card.payload_json;
        const name = payload.name || payload.title || '';
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [cards, searchQuery]);

  // Group cards by column (for flat kanban view - kept for reference)
  const cardsByColumn = useMemo(() => {
    const grouped: Record<string, Card[]> = {};
    columns.forEach((col) => {
      grouped[col.id] = filteredCards.filter((card) => card.labels.includes(col.id));
    });
    // Add unlabeled cards to 'considering'
    grouped.considering.push(
      ...filteredCards.filter((card) => card.labels.length === 0 || !card.labels.some(label => columns.find((c) => c.id === label)))
    );
    return grouped;
  }, [filteredCards, columns]);

  // Group cards by column AND category (nested structure for auto-organized kanban)
  const cardsByColumnAndCategory = useMemo(() => {
    const result: Record<string, Record<string, Card[]>> = {};

    // Initialize structure
    columns.forEach((col) => {
      result[col.id] = {};
      categories.forEach((cat) => {
        result[col.id][cat.id] = [];
      });
    });

    // First, get cards for each column
    const columnCards: Record<string, Card[]> = {};
    columns.forEach((col) => {
      columnCards[col.id] = filteredCards.filter((card) => card.labels.includes(col.id));
    });

    // Add unlabeled cards to 'considering'
    const unlabeledCards = filteredCards.filter(
      (card) => card.labels.length === 0 || !card.labels.some(label => columns.find((c) => c.id === label))
    );
    columnCards.considering = [...(columnCards.considering || []), ...unlabeledCards];

    // Then group by category within each column AND sort by order
    columns.forEach((col) => {
      categories.forEach((cat) => {
        result[col.id][cat.id] = (columnCards[col.id]?.filter((card) => card.type === cat.id) || [])
          .sort((a, b) => (a.order || 0) - (b.order || 0));
      });
    });

    return result;
  }, [filteredCards, columns, categories]);

  // Handle day assignment
  const handleDayAssignment = (cardId: string, day: number, timeSlot?: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card && onCardUpdate) {
      onCardUpdate({
        ...card,
        day,
        time_slot: timeSlot,
        // Auto-set order as last in that day
        order: cards.filter(c => c.day === day).length + 1,
      });
    }
  };

  // Helper: Get column ID from card's labels
  const getColumnId = (card: Card): string => {
    const columnIds = ['considering', 'shortlist', 'booked', 'dismissed'];
    const columnLabel = card.labels.find(l => columnIds.includes(l));
    return columnLabel || 'considering';
  };

  // Helper: Get cards in a specific column
  const getCardsInColumn = useCallback((columnId: string): Card[] => {
    return filteredCards.filter(card => {
      const cardColumnId = getColumnId(card);
      return cardColumnId === columnId;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [filteredCards]);

  // Drag handlers for dnd-kit
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = filteredCards.find(c => c.id === active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    // Exit early if no target or same position
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active card
    const draggedCard = filteredCards.find(c => c.id === activeId);
    if (!draggedCard) return;

    // Get source column
    const sourceColumnId = getColumnId(draggedCard);

    // Determine target column - could be dropping on a card or a column
    let targetColumnId = sourceColumnId;

    // Check if dropping on a column (droppable)
    if (overId.startsWith('column-')) {
      targetColumnId = overId.replace('column-', '');
    } else {
      // Dropping on a card - find its column
      const overCard = filteredCards.find(c => c.id === overId);
      if (overCard) {
        targetColumnId = getColumnId(overCard);
      }
    }

    // Same column - handle reordering WITHIN THE SAME CATEGORY
    if (sourceColumnId === targetColumnId && !overId.startsWith('column-')) {
      const overCard = filteredCards.find(c => c.id === overId);

      // Only reorder if dragging within same category (hotel→hotel, food→food, etc.)
      if (overCard && draggedCard.type === overCard.type) {
        // Get cards of the same type in this column
        const categoryCards = filteredCards
          .filter(c => getColumnId(c) === sourceColumnId && c.type === draggedCard.type)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const oldIndex = categoryCards.findIndex(c => c.id === activeId);
        const newIndex = categoryCards.findIndex(c => c.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reorderedCards = arrayMove(categoryCards, oldIndex, newIndex);

          // Update order for all cards in this category
          reorderedCards.forEach((card, index) => {
            if (onCardUpdate) {
              onCardUpdate({ ...card, order: index });
            }
          });
        }
      }
      // If dragging between categories within same column, do nothing (card snaps back)
    }
    // Different column - move card to new column
    else if (sourceColumnId !== targetColumnId) {
      // Remove old column label and add new one
      const columnIds = ['considering', 'shortlist', 'booked', 'dismissed'];
      const newLabels = draggedCard.labels.filter(l => !columnIds.includes(l));
      newLabels.push(targetColumnId);

      // Calculate new order based on drop position
      const targetColumnCards = getCardsInColumn(targetColumnId);
      let newOrder = targetColumnCards.length; // Default: end of column

      // If dropping on a card, insert at that position
      if (!overId.startsWith('column-')) {
        const targetIndex = targetColumnCards.findIndex(c => c.id === overId);
        if (targetIndex >= 0) {
          newOrder = targetIndex;
        }
      }

      if (onCardUpdate) {
        onCardUpdate({ ...draggedCard, labels: newLabels, order: newOrder });

        // Reorder remaining cards in target column if dropped in middle
        if (newOrder < targetColumnCards.length) {
          targetColumnCards.forEach((card, index) => {
            if (index >= newOrder) {
              onCardUpdate({ ...card, order: index + 1 });
            }
          });
        }
      }
    }
  };

  // Handle trip updates
  const handleTripUpdate = async (updates: Partial<Trip>) => {
    if (onTripUpdate) {
      await onTripUpdate(updates);
    }
  };

  // Handle card click to open detail panel
  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
  };

  return (
    <div className="flex h-full flex-col gradient-mesh">
      {/* Trip Info Header */}
      <TripInfoHeader
        trip={trip}
        onTripUpdate={handleTripUpdate}
        onArchive={onArchive}
        isDraft={trip.id === 'draft'}
        isLoggedOut={isLoggedOut}
      />

      {/* Board Controls Header */}
      <div className="border-b border-border/50 bg-background px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="rounded-full gradient-primary px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
              {filteredCards.length} cards
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards..."
                className="h-10 w-64 rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm pl-10 pr-4 text-sm transition-all duration-300 focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-glow"
              />
            </div>

            {/* View Mode */}
            <div className="flex rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'px-3 py-2 transition-all duration-300',
                  viewMode === 'kanban' ? 'gradient-primary text-white shadow-lg' : 'hover:bg-accent/50'
                )}
                title="Kanban View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('itinerary')}
                className={cn(
                  'border-x-2 border-border/50 px-3 py-2 transition-all duration-300',
                  viewMode === 'itinerary' ? 'gradient-primary text-white shadow-lg' : 'hover:bg-accent/50'
                )}
                title="Itinerary View"
              >
                <Calendar className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('budget')}
                className={cn(
                  'border-r-2 border-border/50 px-3 py-2 transition-all duration-300',
                  viewMode === 'budget' ? 'gradient-primary text-white shadow-lg' : 'hover:bg-accent/50'
                )}
                title="Budget View"
              >
                <Wallet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'border-r-2 border-border/50 px-3 py-2 transition-all duration-300',
                  viewMode === 'grid' ? 'gradient-primary text-white shadow-lg' : 'hover:bg-accent/50'
                )}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-2 transition-all duration-300',
                  viewMode === 'list' ? 'gradient-primary text-white shadow-lg' : 'hover:bg-accent/50'
                )}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'budget' ? (
          // Budget View
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <BudgetWidget
                trip={trip}
                cards={filteredCards}
                totalBudget={totalBudget}
                onUpdateBudget={setTotalBudget}
              />
              <BudgetBreakdown cards={filteredCards} />
            </div>
          </div>
        ) : viewMode === 'itinerary' ? (
          // Itinerary View
          <div className="h-full overflow-y-auto p-6">
            <ItineraryView
              cards={filteredCards}
              trip={trip}
              onCardClick={handleCardClick}
              onUpdateCard={(cardId, updates) => {
                // Handle card updates
                const card = cards.find(c => c.id === cardId);
                if (card && onCardUpdate) {
                  onCardUpdate({ ...card, ...updates });
                }
              }}
              onScheduleCard={(card) => setScheduleModalCard(card)}
            />
          </div>
        ) : viewMode === 'kanban' ? (
          // Kanban View with dnd-kit
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex h-full gap-4 overflow-x-auto p-6">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  categories={categories}
                  cardsByCategory={cardsByColumnAndCategory[column.id] || {}}
                  onCardUpdate={onCardUpdate}
                  onCardDelete={onCardDelete}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>

            {/* Drag Overlay - Shows a preview of the card being dragged */}
            <DragOverlay>
              {activeCard ? (
                <div className="opacity-90 scale-105 shadow-2xl">
                  <ResultCard
                    card={activeCard}
                    variant="default"
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="h-full overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCards.map((card, index) => (
                <CardList
                  key={card.id || `grid-${index}`}
                  cards={[card]}
                  columnId="grid"
                  onCardUpdate={onCardUpdate}
                  onCardDelete={onCardDelete}
                />
              ))}
            </div>
          </div>
        ) : (
          // List View
          <div className="h-full overflow-y-auto p-6">
            <div className="space-y-2">
              <CardList
                cards={filteredCards}
                columnId="list"
                onCardUpdate={onCardUpdate}
                onCardDelete={onCardDelete}
                variant="compact"
              />
            </div>
          </div>
        )}
      </div>

      {/* Day Assignment Modal */}
      <DayAssignmentModal
        card={scheduleModalCard}
        trip={trip}
        isOpen={!!scheduleModalCard}
        onClose={() => setScheduleModalCard(null)}
        onAssign={handleDayAssignment}
      />

      {/* Card Detail Panel */}
      <CardDetailPanel
        card={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        onCardUpdate={onCardUpdate}
      />
    </div>
  );
}
