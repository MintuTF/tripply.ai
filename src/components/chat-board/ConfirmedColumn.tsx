'use client';

import { PlaceCard } from '@/types';
import { DroppableColumn } from './DroppableColumn';
import { DraggablePlaceCard } from './DraggablePlaceCard';
import { CheckCircle2 } from 'lucide-react';

interface ConfirmedColumnProps {
  cards: PlaceCard[];
  onRemove: (cardId: string) => void;
  className?: string;
}

export function ConfirmedColumn({
  cards,
  onRemove,
  className,
}: ConfirmedColumnProps) {
  return (
    <DroppableColumn
      id="confirmed"
      title="Confirmed"
      count={cards.length}
      icon={<CheckCircle2 className="h-4 w-4" />}
      emptyMessage="Confirmed places for your trip"
      accentColor="green"
      className={className}
    >
      <div className="space-y-3">
        {cards.map((card) => (
          <DraggablePlaceCard
            key={card.id}
            card={card}
            onRemove={onRemove}
            showRemoveButton
          />
        ))}
      </div>
    </DroppableColumn>
  );
}
