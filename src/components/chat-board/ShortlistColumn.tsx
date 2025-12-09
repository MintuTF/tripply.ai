'use client';

import { PlaceCard } from '@/types';
import { DroppableColumn } from './DroppableColumn';
import { DraggablePlaceCard } from './DraggablePlaceCard';
import { ListChecks } from 'lucide-react';

interface ShortlistColumnProps {
  cards: PlaceCard[];
  onConfirm: (card: PlaceCard) => void;
  onRemove: (cardId: string) => void;
  className?: string;
}

export function ShortlistColumn({
  cards,
  onConfirm,
  onRemove,
  className,
}: ShortlistColumnProps) {
  return (
    <DroppableColumn
      id="shortlist"
      title="Shortlist"
      count={cards.length}
      icon={<ListChecks className="h-4 w-4" />}
      emptyMessage="Add places you're considering"
      className={className}
    >
      <div className="space-y-3">
        {cards.map((card) => (
          <DraggablePlaceCard
            key={card.id}
            card={card}
            onConfirm={onConfirm}
            onRemove={onRemove}
            showConfirmButton
            showRemoveButton
          />
        ))}
      </div>
    </DroppableColumn>
  );
}
