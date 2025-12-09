'use client';

import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin } from '@dnd-kit/core';
import { PlaceCard } from '@/types';
import { ChatColumn } from './ChatColumn';
import { ShortlistColumn } from './ShortlistColumn';
import { ConfirmedColumn } from './ConfirmedColumn';
import { DraggablePlaceCard } from './DraggablePlaceCard';

interface ChatBoardProps {
  tripId?: string;
}

export function ChatBoard({ tripId }: ChatBoardProps) {
  const [shortlistCards, setShortlistCards] = useState<PlaceCard[]>([]);
  const [confirmedCards, setConfirmedCards] = useState<PlaceCard[]>([]);
  const [activeCard, setActiveCard] = useState<PlaceCard | null>(null);

  // Track which cards are already shortlisted or confirmed
  const shortlistedCardIds = useMemo(() => {
    const ids = new Set<string>();
    shortlistCards.forEach((c) => ids.add(c.id));
    confirmedCards.forEach((c) => ids.add(c.id));
    return ids;
  }, [shortlistCards, confirmedCards]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = active.data.current?.card as PlaceCard | undefined;
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const card = active.data.current?.card as PlaceCard | undefined;
    if (!card) return;

    const sourceContainer = getSourceContainer(card.id);
    const destinationId = over.id as string;

    // Handle dropping on shortlist column
    if (destinationId === 'shortlist') {
      if (sourceContainer === 'chat') {
        // Add from chat to shortlist
        setShortlistCards((prev) => {
          if (prev.some((c) => c.id === card.id)) return prev;
          return [...prev, card];
        });
      } else if (sourceContainer === 'confirmed') {
        // Move from confirmed back to shortlist
        setConfirmedCards((prev) => prev.filter((c) => c.id !== card.id));
        setShortlistCards((prev) => {
          if (prev.some((c) => c.id === card.id)) return prev;
          return [...prev, card];
        });
      }
    }

    // Handle dropping on confirmed column
    if (destinationId === 'confirmed') {
      if (sourceContainer === 'chat') {
        // Add from chat directly to confirmed
        setConfirmedCards((prev) => {
          if (prev.some((c) => c.id === card.id)) return prev;
          return [...prev, card];
        });
      } else if (sourceContainer === 'shortlist') {
        // Move from shortlist to confirmed
        setShortlistCards((prev) => prev.filter((c) => c.id !== card.id));
        setConfirmedCards((prev) => {
          if (prev.some((c) => c.id === card.id)) return prev;
          return [...prev, card];
        });
      }
    }
  };

  const getSourceContainer = (cardId: string): 'chat' | 'shortlist' | 'confirmed' => {
    if (shortlistCards.some((c) => c.id === cardId)) return 'shortlist';
    if (confirmedCards.some((c) => c.id === cardId)) return 'confirmed';
    return 'chat';
  };

  const handleAddToShortlist = (card: PlaceCard) => {
    setShortlistCards((prev) => {
      if (prev.some((c) => c.id === card.id)) return prev;
      return [...prev, card];
    });
  };

  const handleConfirm = (card: PlaceCard) => {
    setShortlistCards((prev) => prev.filter((c) => c.id !== card.id));
    setConfirmedCards((prev) => {
      if (prev.some((c) => c.id === card.id)) return prev;
      return [...prev, card];
    });
  };

  const handleRemoveFromShortlist = (cardId: string) => {
    setShortlistCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleRemoveFromConfirmed = (cardId: string) => {
    setConfirmedCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="flex h-full gap-4 p-4 bg-background/50">
        {/* Chat Column - 50% width */}
        <ChatColumn
          tripId={tripId}
          onAddToShortlist={handleAddToShortlist}
          shortlistedCardIds={shortlistedCardIds}
          className="w-1/2"
        />

        {/* Shortlist Column - 25% width */}
        <ShortlistColumn
          cards={shortlistCards}
          onConfirm={handleConfirm}
          onRemove={handleRemoveFromShortlist}
          className="w-1/4"
        />

        {/* Confirmed Column - 25% width */}
        <ConfirmedColumn
          cards={confirmedCards}
          onRemove={handleRemoveFromConfirmed}
          className="w-1/4"
        />
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeCard ? (
          <div className="opacity-80 rotate-3 scale-105">
            <DraggablePlaceCard
              card={activeCard}
              isDraggable={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
