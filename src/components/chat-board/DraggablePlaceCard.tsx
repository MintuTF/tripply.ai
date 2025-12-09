'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PlaceCard } from '@/types';
import { cn } from '@/lib/utils';
import {
  Star,
  MapPin,
  GripVertical,
  Plus,
  Check,
  X,
  Hotel,
  Utensils,
  Camera,
  Compass,
} from 'lucide-react';

interface DraggablePlaceCardProps {
  card: PlaceCard;
  onAddToShortlist?: (card: PlaceCard) => void;
  onConfirm?: (card: PlaceCard) => void;
  onRemove?: (cardId: string) => void;
  showAddButton?: boolean;
  showConfirmButton?: boolean;
  showRemoveButton?: boolean;
  isDraggable?: boolean;
}

const TypeIcons = {
  hotel: Hotel,
  restaurant: Utensils,
  activity: Camera,
  location: Compass,
};

export function DraggablePlaceCard({
  card,
  onAddToShortlist,
  onConfirm,
  onRemove,
  showAddButton = false,
  showConfirmButton = false,
  showRemoveButton = false,
  isDraggable = true,
}: DraggablePlaceCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card, type: 'place-card' },
    disabled: !isDraggable,
  });

  // Open Google Maps with the place location
  const openInGoogleMaps = () => {
    let query = '';
    if (card.latitude && card.longitude) {
      // Use coordinates if available
      query = `${card.latitude},${card.longitude}`;
    } else if (card.address) {
      // Fall back to address + name for better search
      query = `${card.name}, ${card.address}`;
    } else {
      // Just use the name
      query = card.name;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const TypeIcon = TypeIcons[card.type] || Compass;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={openInGoogleMaps}
      className={cn(
        'group rounded-xl border border-border bg-card overflow-hidden transition-all',
        isDragging && 'opacity-50 shadow-xl ring-2 ring-primary',
        'cursor-pointer hover:border-primary/50 hover:shadow-md'
      )}
    >
      {/* Image */}
      {card.photos && card.photos.length > 0 && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={card.photos[0]}
            alt={card.name}
            className="w-full h-full object-cover"
          />
          {/* Drag handle overlay */}
          {isDraggable && (
            <div
              {...listeners}
              {...attributes}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          {/* Type badge */}
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-black/50 text-white text-xs flex items-center gap-1">
            <TypeIcon className="h-3 w-3" />
            {card.type}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <h4 className="font-semibold text-sm text-foreground line-clamp-1">
          {card.name}
        </h4>

        {card.address && (
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 line-clamp-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {card.address}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between">
          {/* Rating */}
          {card.rating && (
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{card.rating}</span>
              {card.review_count && (
                <span className="text-muted-foreground">
                  ({card.review_count.toLocaleString()})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          {card.price_level && (
            <span className="text-xs text-muted-foreground">
              {'$'.repeat(card.price_level)}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {(showAddButton || showConfirmButton || showRemoveButton) && (
          <div className="mt-3 flex gap-2">
            {showAddButton && onAddToShortlist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToShortlist(card);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Shortlist
              </button>
            )}
            {showConfirmButton && onConfirm && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirm(card);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Confirm
              </button>
            )}
            {showRemoveButton && onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(card.id);
                }}
                className="flex items-center justify-center p-1.5 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
