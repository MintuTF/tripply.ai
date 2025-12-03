'use client';

import { useState } from 'react';
import { Card, CardType } from '@/types';
import { SortableKanbanCard } from './SortableKanbanCard';
import { cn } from '@/lib/utils';
import { Plus, Hotel, Utensils, Compass, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

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
}

/**
 * KanbanColumn - A single column in the Kanban board with sortable cards
 * Uses dnd-kit SortableContext for drag-and-drop reordering
 */
export function KanbanColumn({
  column,
  categories,
  cardsByCategory,
  onCardUpdate,
  onCardDelete,
  onCardClick,
}: KanbanColumnProps) {
  // Track collapsed state for category sub-sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (categoryId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const isSectionCollapsed = (categoryId: string) => {
    return collapsedSections[categoryId] ?? false;
  };

  // Get total count for the column
  const totalCount = categories.reduce(
    (sum, cat) => sum + (cardsByCategory[cat.id]?.length || 0),
    0
  );

  // Get all card IDs in this column for SortableContext
  const allCardIds = categories.flatMap(cat =>
    (cardsByCategory[cat.id] || []).map(card => card.id)
  );

  // Make the column droppable for cards coming from other columns
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      columnId: column.id,
      type: 'column',
    },
  });

  return (
    <div className="flex min-w-[320px] flex-col">
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
          <button className="rounded-lg p-2 transition-all duration-300 hover:bg-card/50 hover:shadow-md">
            <Plus className="h-5 w-5" />
          </button>
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
          {categories.map((category) => {
            const Icon = category.icon;
            const categoryCards = cardsByCategory[category.id] || [];
            const isCollapsed = isSectionCollapsed(category.id);

            // Hide empty categories
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
