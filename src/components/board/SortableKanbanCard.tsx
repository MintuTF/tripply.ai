'use client';

import { useState } from 'react';
import { Card } from '@/types';
import { ResultCard } from '@/components/cards/ResultCard';
import { cn } from '@/lib/utils';
import { MoreVertical, Trash2, Copy } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableKanbanCardProps {
  card: Card;
  columnId: string;
  onCardUpdate?: (card: Card) => void;
  onCardDelete?: (cardId: string) => void;
  onCardClick?: (card: Card) => void;
  onCardDuplicate?: (card: Card) => void;
}

/**
 * SortableKanbanCard - A draggable card component using dnd-kit
 * Replaces the HTML5 drag-drop implementation for consistent behavior
 */
export function SortableKanbanCard({
  card,
  columnId,
  onCardUpdate,
  onCardDelete,
  onCardClick,
  onCardDuplicate,
}: SortableKanbanCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      card,
      columnId,
      type: 'card',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Track pointer position to differentiate clicks from drags
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // Compose our handler with dnd-kit's listener so both work
  const composedOnPointerDown = (e: React.PointerEvent) => {
    setStartPos({ x: e.clientX, y: e.clientY });
    // Call dnd-kit's handler if it exists - this enables drag functionality
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e as unknown as React.PointerEvent<Element>);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if we were dragging
    if (isDragging) return;

    // Check if pointer moved more than 8px (matching dnd-kit's drag threshold)
    if (startPos) {
      const dx = Math.abs(e.clientX - startPos.x);
      const dy = Math.abs(e.clientY - startPos.y);
      if (dx > 8 || dy > 8) {
        setStartPos(null);
        return; // Was a drag, not a click
      }
    }

    // Don't trigger if clicking on the menu button area
    if ((e.target as HTMLElement).closest('.card-menu-button')) {
      return;
    }

    onCardClick?.(card);
    setStartPos(null);
  };

  const handleDeleteClick = () => {
    setDeleteConfirm(true);
    setShowMenu(false);
  };

  const handleDeleteConfirm = () => {
    onCardDelete?.(card.id);
    setDeleteConfirm(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onPointerDown={composedOnPointerDown}
        onClick={handleClick}
        className={cn(
          'group relative transition-all duration-200 cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-50 scale-105 z-50'
        )}
      >
        {/* Card Menu Button - prevent drag events from interfering */}
        <div
          className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 card-menu-button"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-md bg-background/90 p-1.5 shadow-sm backdrop-blur-sm hover:bg-accent"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-36 rounded-lg border bg-background shadow-lg z-50"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onCardDuplicate?.(card);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Copy className="h-3 w-3" />
                  Duplicate
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
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
          variant="default"
          onSave={(card) => {
            const updated = { ...card, is_favorited: !card.is_favorited };
            onCardUpdate?.(updated);
          }}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        title="Delete Card"
        message="Are you sure you want to delete this card? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(false)}
      />
    </>
  );
}
