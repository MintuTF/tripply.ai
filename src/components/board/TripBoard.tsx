'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/types';
import { CardList } from './CardList';
import { cn } from '@/lib/utils';
import { Plus, Filter, Search, Grid, List, LayoutGrid } from 'lucide-react';

interface TripBoardProps {
  tripId: string;
  cards?: Card[];
  onCardUpdate?: (card: Card) => void;
  onCardDelete?: (cardId: string) => void;
}

/**
 * TripBoard - Kanban-style board for organizing saved cards
 * Inspired by Notion and Linear's card organization
 */
export function TripBoard({ tripId, cards = [], onCardUpdate, onCardDelete }: TripBoardProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Define board columns
  const columns = [
    { id: 'considering', label: 'Considering', color: 'blue' },
    { id: 'shortlist', label: 'Shortlist', color: 'purple' },
    { id: 'booked', label: 'Booked', color: 'green' },
    { id: 'dismissed', label: 'Dismissed', color: 'gray' },
  ];

  // Filter and organize cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Search filter
      if (searchQuery) {
        const data = typeof card.data === 'string' ? JSON.parse(card.data) : card.data;
        const name = data.name || data.title || '';
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // Label filter
      if (filterLabel && card.label !== filterLabel) {
        return false;
      }

      // Type filter
      if (filterType && card.type !== filterType) {
        return false;
      }

      return true;
    });
  }, [cards, searchQuery, filterLabel, filterType]);

  // Group cards by column
  const cardsByColumn = useMemo(() => {
    const grouped: Record<string, Card[]> = {};
    columns.forEach((col) => {
      grouped[col.id] = filteredCards.filter((card) => card.label === col.id);
    });
    // Add unlabeled cards to 'considering'
    grouped.considering.push(
      ...filteredCards.filter((card) => !card.label || !columns.find((c) => c.id === card.label))
    );
    return grouped;
  }, [filteredCards, columns]);

  // Get unique labels and types for filters
  const availableLabels = useMemo(() => {
    return Array.from(new Set(cards.map((c) => c.label).filter(Boolean))) as string[];
  }, [cards]);

  const availableTypes = useMemo(() => {
    return Array.from(new Set(cards.map((c) => c.type))) as string[];
  }, [cards]);

  return (
    <div className="flex h-full flex-col gradient-mesh">
      {/* Header */}
      <div className="border-b border-border/50 glassmorphism px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
              Trip Board
            </h1>
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

            {/* Type Filter */}
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="h-10 rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm px-4 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-glow"
            >
              <option value="">All types</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Label Filter */}
            {availableLabels.length > 0 && (
              <select
                value={filterLabel || ''}
                onChange={(e) => setFilterLabel(e.target.value || null)}
                className="h-10 rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm px-4 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-glow"
              >
                <option value="">All columns</option>
                {availableLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            )}

            {/* View Mode */}
            <div className="flex rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'px-3 py-2 transition-all duration-300',
                  viewMode === 'kanban' ? 'gradient-primary text-white shadow-lg' : 'hover:bg-accent/50'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'border-x-2 border-border/50 px-3 py-2 transition-all duration-300',
                  viewMode === 'grid' ? 'gradient-primary text-white shadow-lg' : 'hover:bg-accent/50'
                )}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-2 transition-all duration-300',
                  viewMode === 'list' ? 'gradient-primary text-white shadow-lg' : 'hover:bg-accent/50'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          // Kanban View
          <div className="flex h-full gap-4 overflow-x-auto p-6">
            {columns.map((column) => (
              <div key={column.id} className="flex min-w-[320px] flex-col">
                {/* Column Header */}
                <div className="mb-4 rounded-2xl border-2 border-border/30 p-4 backdrop-blur-sm shadow-sm"
                  style={{
                    background: column.color === 'blue' ? 'linear-gradient(135deg, rgba(88, 166, 193, 0.1), rgba(88, 166, 193, 0.05))' :
                      column.color === 'purple' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))' :
                      column.color === 'green' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' :
                      'linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(107, 114, 128, 0.05))'
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
                        {cardsByColumn[column.id]?.length || 0}
                      </span>
                    </div>
                    <button className="rounded-lg p-2 transition-all duration-300 hover:bg-card/50 hover:shadow-md">
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Column Cards */}
                <CardList
                  cards={cardsByColumn[column.id] || []}
                  columnId={column.id}
                  onCardUpdate={onCardUpdate}
                  onCardDelete={onCardDelete}
                />
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="h-full overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCards.map((card) => (
                <CardList
                  key={card.id}
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
    </div>
  );
}
