'use client';

import { useState } from 'react';
import { Card } from '@/types';
import { ResultCard } from '@/components/cards/ResultCard';
import { cn } from '@/lib/utils';
import { MoreVertical, Trash2, Tag, Copy, ExternalLink } from 'lucide-react';

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

  const handleDragStart = (card: Card, e: React.DragEvent) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
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
    if (draggedCard && draggedCard.label !== columnId) {
      const updatedCard = { ...draggedCard, label: columnId };
      onCardUpdate?.(updatedCard);
    }
  };

  const handleDelete = (cardId: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      onCardDelete?.(cardId);
    }
    setShowMenuFor(null);
  };

  const handleLabelChange = (card: Card, newLabel: string) => {
    const updatedCard = { ...card, label: newLabel };
    onCardUpdate?.(updatedCard);
    setShowMenuFor(null);
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
      {cards.map((card) => (
        <div
          key={card.id}
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
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-background shadow-lg">
                <div className="p-1">
                  {/* Move to Column */}
                  <div className="mb-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                    Move to
                  </div>
                  {['considering', 'shortlist', 'booked', 'dismissed'].map((label) => (
                    <button
                      key={label}
                      onClick={() => handleLabelChange(card, label)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <Tag className="h-3 w-3" />
                      <span className="capitalize">{label}</span>
                    </button>
                  ))}

                  <div className="my-1 border-t" />

                  {/* Other Actions */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(card.data));
                      setShowMenuFor(null);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Copy className="h-3 w-3" />
                    Copy details
                  </button>

                  <button
                    onClick={() => handleDelete(card.id)}
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
    </div>
  );
}
