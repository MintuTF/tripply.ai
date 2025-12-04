'use client';

import { useState } from 'react';
import { Card } from '@/types';
import { ResultCard } from '@/components/cards/ResultCard';
import { cn } from '@/lib/utils';
import { MoreVertical, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface CardListProps {
  cards: Card[];
  columnId: string;
  onCardUpdate?: (card: Card) => void;
  onCardDelete?: (cardId: string) => void;
  variant?: 'default' | 'compact';
}

/**
 * CardList - Displays a list of cards with drag-and-drop support
 */
export function CardList({
  cards,
  columnId,
  onCardUpdate,
  onCardDelete,
  variant = 'default',
}: CardListProps) {
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; cardId: string | null }>({
    isOpen: false,
    cardId: null,
  });

  const handleDragStart = (card: Card, e: React.DragEvent) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
    // Store card data for cross-column drag and drop
    e.dataTransfer.setData('application/json', JSON.stringify(card));
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Try local state first, then fall back to dataTransfer (cross-column drag)
    let cardToUpdate: Card | null = draggedCard;
    if (!cardToUpdate) {
      try {
        const cardData = e.dataTransfer.getData('application/json');
        if (cardData) {
          cardToUpdate = JSON.parse(cardData);
        }
      } catch (err) {
        console.error('Failed to parse dragged card data:', err);
        return;
      }
    }

    if (cardToUpdate) {
      // Update labels array - remove old column labels, add new one
      const columnIds = ['considering', 'shortlist', 'confirmed', 'dismissed'];
      const newLabels = cardToUpdate.labels.filter((l: string) => !columnIds.includes(l));
      newLabels.push(columnId);

      const updatedCard = { ...cardToUpdate, labels: newLabels };
      onCardUpdate?.(updatedCard);
    }
  };

  const handleDeleteClick = (cardId: string) => {
    setDeleteConfirm({ isOpen: true, cardId });
    setShowMenuFor(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.cardId) {
      onCardDelete?.(deleteConfirm.cardId);
    }
    setDeleteConfirm({ isOpen: false, cardId: null });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, cardId: null });
  };

  if (cards.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex-1 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-8 text-center"
      >
        <p className="text-sm text-muted-foreground">No cards yet</p>
        <p className="text-xs text-muted-foreground">Drag cards here or add new ones</p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn('space-y-3', columnId === 'list' && 'space-y-2')}
    >
      {cards.map((card, index) => (
        <div
          key={card.id || `card-${index}`}
          draggable
          onDragStart={(e) => handleDragStart(card, e)}
          onDragEnd={handleDragEnd}
          className={cn(
            'group relative cursor-move transition-opacity',
            draggedCard?.id === card.id && 'opacity-50'
          )}
        >
          {/* Card Menu */}
          <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setShowMenuFor(showMenuFor === card.id ? null : card.id)}
              className="rounded-md bg-background/90 p-1.5 shadow-sm backdrop-blur-sm hover:bg-accent"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenuFor === card.id && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border bg-background shadow-lg">
                <div className="p-1">
                  <button
                    onClick={() => handleDeleteClick(card.id)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card Content */}
          <ResultCard
            card={card}
            variant={variant === 'compact' ? 'compact' : 'default'}
            onSave={(card) => {
              const updated = { ...card, is_favorited: !card.is_favorited };
              onCardUpdate?.(updated);
            }}
          />
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Card"
        message="Are you sure you want to delete this card? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
