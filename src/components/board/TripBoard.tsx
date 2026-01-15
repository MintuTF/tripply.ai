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
import { Search, Grid, List, LayoutGrid, Calendar, Wallet, Hotel, Utensils, Compass, Sparkles, Plus } from 'lucide-react';
import { TripInfoHeader } from '@/components/trip/TripInfoHeader';
import { PlaceSearchModal } from '@/components/search/PlaceSearchModal';
import type { PlaceResult } from '@/types';
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
import { AskAIModal } from './AskAIModal';

interface TripBoardProps {
  tripId: string;
  trip: Trip;
  cards?: Card[];
  onCardUpdate?: (card: Card) => void;
  onCardDelete?: (cardId: string) => void;
  onCardDuplicate?: (card: Card) => void;
  onTripUpdate?: (updates: Partial<Trip>) => Promise<void>;
  onArchive?: () => void;
  isLoggedOut?: boolean;
  onAddCard?: (card: Card) => void;  // For local card adding (guest mode)
  onSaveRequired?: () => void;  // Called when action requires saved trip (e.g., confirming cards)
}

/**
 * TripBoard - Kanban-style board for organizing saved cards
 * Inspired by Notion and Linear's card organization
 */
export function TripBoard({ tripId, trip, cards = [], onCardUpdate, onCardDelete, onCardDuplicate, onTripUpdate, onArchive, isLoggedOut, onAddCard, onSaveRequired }: TripBoardProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'list' | 'itinerary' | 'budget'>('kanban');
  const [totalBudget, setTotalBudget] = useState<number | undefined>(trip.budget_range ? trip.budget_range[1] : undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleModalCard, setScheduleModalCard] = useState<Card | null>(null);

  // Card detail panel state
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Ask AI modal state
  const [showAskAI, setShowAskAI] = useState(false);

  // Place search modal state
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);

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

  // Define board columns (unified purple/pink theme)
  const columns = [
    { id: 'considering', label: 'Considering', color: 'purple' },
    { id: 'shortlist', label: 'Shortlist', color: 'pink' },
    { id: 'confirmed', label: 'Confirmed', color: 'gradient' },
  ];

  // Define vertical category sections (purple/pink theme)
  const categories = [
    { id: 'hotel' as CardType, label: 'Hotels', icon: Hotel, color: 'purple', gradient: 'from-purple-500/10 to-purple-600/5' },
    { id: 'food' as CardType, label: 'Restaurants', icon: Utensils, color: 'pink', gradient: 'from-pink-500/10 to-pink-600/5' },
    { id: 'spot' as CardType, label: 'Things to Do', icon: Compass, color: 'violet', gradient: 'from-violet-500/10 to-violet-600/5' },
  ];

  // Filter and organize cards
  const filteredCards = useMemo(() => {
    return cards
      // Migrate old 'booked' labels to 'confirmed' for backwards compatibility
      .map((card) => {
        if (card.labels?.includes('booked')) {
          return {
            ...card,
            labels: card.labels.map(l => l === 'booked' ? 'confirmed' : l),
          };
        }
        return card;
      })
      .filter((card) => {
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
      grouped[col.id] = filteredCards.filter((card) => (card.labels || []).includes(col.id));
    });
    // Add unlabeled cards to 'considering'
    grouped.considering.push(
      ...filteredCards.filter((card) => !card.labels || card.labels.length === 0 || !card.labels.some(label => columns.find((c) => c.id === label)))
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
      columnCards[col.id] = filteredCards.filter((card) => (card.labels || []).includes(col.id));
    });

    // Add unlabeled cards to 'considering'
    const unlabeledCards = filteredCards.filter(
      (card) => !card.labels || card.labels.length === 0 || !card.labels.some(label => columns.find((c) => c.id === label))
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
      onCardUpdate(cardId, {
        day,
        time_slot: timeSlot,
        // Auto-set order as last in that day
        order: cards.filter(c => c.day === day).length + 1,
      });
    }
  };

  // Helper: Get column ID from card's labels
  const getColumnId = (card: Card): string => {
    const columnIds = ['considering', 'shortlist', 'confirmed', 'dismissed'];
    const columnLabel = (card.labels || []).find(l => columnIds.includes(l));
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

    // Check if dropping on a day section (for scheduling cards in booked column)
    if (overId.startsWith('day-section-')) {
      // Check if trip is draft before assigning to day + confirmed
      if (tripId === 'draft' && onSaveRequired) {
        onSaveRequired();
        return;
      }

      const dayNumber = parseInt(overId.replace('day-section-', ''));

      if (onCardUpdate) {
        // Update the card's day assignment
        // dayNumber 0 means Unscheduled (set day to null/undefined)
        const newDay = dayNumber === 0 ? undefined : dayNumber;

        // Also ensure the card is in the booked column
        const columnIds = ['considering', 'shortlist', 'confirmed', 'dismissed'];
        const newLabels = (draggedCard.labels || []).filter(l => !columnIds.includes(l));
        newLabels.push('confirmed');

        // Calculate order based on existing cards in that day
        const cardsInDay = cards.filter(c => c.day === newDay && (c.labels || []).includes('confirmed'));

        onCardUpdate(draggedCard.id, {
          day: newDay,
          labels: newLabels,
          order: cardsInDay.length,
        });
      }
      return;
    }

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
              onCardUpdate(card.id, { order: index });
            }
          });
        }
      }
      // If dragging between categories within same column, do nothing (card snaps back)
    }
    // Different column - move card to new column
    else if (sourceColumnId !== targetColumnId) {
      // Check if trying to move to confirmed column with unsaved trip
      if (targetColumnId === 'confirmed' && tripId === 'draft') {
        if (onSaveRequired) {
          onSaveRequired();
        }
        return; // Block the move until trip is saved
      }

      // Remove old column label and add new one
      const columnIds = ['considering', 'shortlist', 'confirmed', 'dismissed'];
      const newLabels = (draggedCard.labels || []).filter(l => !columnIds.includes(l));
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
        onCardUpdate(draggedCard.id, { labels: newLabels, order: newOrder });

        // Reorder remaining cards in target column if dropped in middle
        if (newOrder < targetColumnCards.length) {
          targetColumnCards.forEach((card, index) => {
            if (index >= newOrder) {
              onCardUpdate(card.id, { order: index + 1 });
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

  // Handle adding AI-generated cards to the board
  const handleAICardsGenerated = async (newCards: Omit<Card, 'id' | 'created_at' | 'updated_at'>[]) => {
    // Guest mode (no tripId, draft, or logged out) - add cards locally without saving to DB
    if (!tripId || tripId === 'draft' || isLoggedOut) {
      if (onAddCard) {
        for (const cardData of newCards) {
          const card: Card = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...cardData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          onAddCard(card);
        }
      }
      return;
    }

    // Authenticated user with saved trip - save to DB then add to local state
    for (const cardData of newCards) {
      try {
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cardData),
        });

        if (!response.ok) {
          console.error('Failed to save card:', await response.text());
          continue;
        }

        const savedCard = await response.json();

        // Add the saved card to local state so it appears immediately
        if (onAddCard) {
          onAddCard(savedCard);
        }
      } catch (error) {
        console.error('Error saving card:', error);
      }
    }
  };

  return (
    <div className="flex h-full flex-col travel-gradient">
      {/* Trip Info Header */}
      <TripInfoHeader
        trip={trip}
        onTripUpdate={handleTripUpdate}
        onArchive={onArchive}
        isDraft={trip.id === 'draft'}
        isLoggedOut={isLoggedOut}
      />

      {/* Board Controls Header */}
      <div className="border-b border-purple-100/50 bg-white/80 backdrop-blur-md px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-purple-200">
              {filteredCards.length} cards
            </span>

            {/* Add Place Button */}
            <button
              onClick={() => setShowPlaceSearch(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-purple-200 text-purple-600 font-medium hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Place</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards..."
                className="h-10 w-64 rounded-xl border border-purple-100 bg-white/60 backdrop-blur-sm pl-10 pr-4 text-sm transition-all duration-300 focus-visible:outline-none focus-visible:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-200"
              />
            </div>

            {/* View Mode - Hidden */}
            <div className="hidden flex rounded-xl border border-purple-100 bg-white/60 backdrop-blur-sm overflow-hidden">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'px-3 py-2 transition-all duration-300',
                  viewMode === 'kanban' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200' : 'hover:bg-purple-50 text-gray-600'
                )}
                title="Kanban View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('itinerary')}
                className={cn(
                  'border-x border-purple-100 px-3 py-2 transition-all duration-300',
                  viewMode === 'itinerary' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200' : 'hover:bg-purple-50 text-gray-600'
                )}
                title="Itinerary View"
              >
                <Calendar className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('budget')}
                className={cn(
                  'border-r border-purple-100 px-3 py-2 transition-all duration-300',
                  viewMode === 'budget' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200' : 'hover:bg-purple-50 text-gray-600'
                )}
                title="Budget View"
              >
                <Wallet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'border-r border-purple-100 px-3 py-2 transition-all duration-300',
                  viewMode === 'grid' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200' : 'hover:bg-purple-50 text-gray-600'
                )}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-2 transition-all duration-300',
                  viewMode === 'list' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200' : 'hover:bg-purple-50 text-gray-600'
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
                  onCardUpdate(cardId, updates);
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
                  onCardDuplicate={onCardDuplicate}
                  onAskAI={column.id === 'considering' ? () => setShowAskAI(true) : undefined}
                  tripDates={trip.dates}
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

      {/* Ask AI Modal */}
      <AskAIModal
        isOpen={showAskAI}
        onClose={() => setShowAskAI(false)}
        tripId={tripId}
        destination={trip.destination?.name}
        dates={trip.dates}
        budget={trip.budget_range?.[1]}
        onAddCards={handleAICardsGenerated}
        existingCards={cards}
      />

      {/* Place Search Modal */}
      <PlaceSearchModal
        isOpen={showPlaceSearch}
        onClose={() => setShowPlaceSearch(false)}
        cityCoordinates={trip.destination?.coordinates}
        cityName={trip.destination?.name || 'this area'}
        onAddToBoard={async (place: PlaceResult, cardType: 'hotel' | 'food' | 'spot') => {
          // Create card from place
          const cardData: Omit<Card, 'id' | 'created_at' | 'updated_at'> = {
            trip_id: tripId || 'draft',
            type: cardType,
            payload_json: {
              name: place.name,
              address: place.address || '',
              coordinates: place.coordinates,
              photos: place.photos || [],
              rating: place.rating,
              review_count: place.review_count,
              price_level: place.price_level,
              opening_hours: place.opening_hours,
              url: place.url,
              phone: place.phone,
              website: place.website,
              description: place.editorial_summary,
            },
            labels: ['considering'],
          };

          // Guest mode - add locally
          if (!tripId || tripId === 'draft' || isLoggedOut) {
            if (onAddCard) {
              const card: Card = {
                id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ...cardData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              onAddCard(card);
            }
            return;
          }

          // Authenticated mode - save to API
          try {
            const response = await fetch('/api/cards', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cardData),
            });

            if (!response.ok) throw new Error('Failed to add card');

            const savedCard = await response.json();
            if (onAddCard) {
              onAddCard(savedCard);
            }
          } catch (error) {
            console.error('Failed to add place to board:', error);
            throw error;
          }
        }}
      />
    </div>
  );
}
