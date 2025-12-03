'use client';

import { useState } from 'react';
import { Card } from '@/types';
import { cn } from '@/lib/utils';
import { Star, Heart, ExternalLink, Pin, MoreVertical } from 'lucide-react';
import { getLabelConfig } from '@/components/board/CardLabels';

interface ResultCardProps {
  card: Card;
  onSave?: (card: Card) => void;
  onCompare?: (card: Card) => void;
  onPin?: (card: Card) => void;
  variant?: 'compact' | 'default' | 'detailed';
}

/**
 * ResultCard - Universal card component for displaying search results
 * Used across stays, places, restaurants, etc.
 */
export function ResultCard({
  card,
  onSave,
  onCompare,
  onPin,
  variant = 'default'
}: ResultCardProps) {
  const [isFavorited, setIsFavorited] = useState(card.favorite || false);
  const [isPinned, setIsPinned] = useState(false);

  const data = typeof card.payload_json === 'string' ? JSON.parse(card.payload_json) : card.payload_json;

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onSave?.(card);
  };

  const handlePin = () => {
    setIsPinned(!isPinned);
    onPin?.(card);
  };

  return (
    <div
      className={cn(
        'group relative rounded-2xl border-2 bg-card transition-all duration-300 hover-lift',
        'border-border/50 hover:border-primary/30',
        'shadow-sm hover:shadow-depth',
        isPinned && 'ring-2 ring-primary shadow-glow',
        variant === 'compact' && 'p-3',
        variant === 'default' && 'p-4',
        variant === 'detailed' && 'p-6',
        'backdrop-blur-sm'
      )}
    >
      {/* Image */}
      {data.image_url && (
        <div className="relative mb-3 overflow-hidden rounded-xl">
          <img
            src={data.image_url}
            alt={data.name || data.title}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Quick Actions Overlay */}
          <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
            <button
              onClick={handleFavorite}
              className={cn(
                'rounded-full p-2.5 shadow-lg backdrop-blur-md transition-all duration-300',
                'hover:scale-110',
                isFavorited
                  ? 'bg-red-500 text-white shadow-red-500/50'
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30'
              )}
            >
              <Heart className={cn('h-4 w-4', isFavorited && 'fill-current')} />
            </button>
            <button
              onClick={handlePin}
              className={cn(
                'rounded-full p-2.5 shadow-lg backdrop-blur-md transition-all duration-300',
                'hover:scale-110',
                isPinned
                  ? 'bg-primary text-white shadow-primary/50'
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
              )}
            >
              <Pin className={cn('h-4 w-4', isPinned && 'fill-current')} />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground line-clamp-1">
              {data.name || data.title}
            </h3>
            {data.address && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {data.address}
              </p>
            )}
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Rating */}
        {data.rating && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{data.rating}</span>
            {data.review_count && (
              <span className="text-muted-foreground">({data.review_count})</span>
            )}
          </div>
        )}

        {/* Description */}
        {variant !== 'compact' && data.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Tags */}
        {variant === 'detailed' && data.tags && Array.isArray(data.tags) && (
          <div className="flex flex-wrap gap-1">
            {data.tags.slice(0, 4).map((tag: string, i: number) => (
              <span
                key={i}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* User Labels */}
        {(() => {
          const statusLabels = ['considering', 'shortlist', 'booked', 'dismissed'];
          const displayLabels = (card.labels || []).filter(l => !statusLabels.includes(l));

          if (displayLabels.length === 0) return null;

          return (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {displayLabels.slice(0, 3).map((labelId) => {
                const config = getLabelConfig(labelId, card.type);
                if (!config) return null;
                return (
                  <span
                    key={labelId}
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white',
                      config.color
                    )}
                  >
                    {config.label}
                  </span>
                );
              })}
              {displayLabels.length > 3 && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                  +{displayLabels.length - 3} more
                </span>
              )}
            </div>
          );
        })()}

        {/* Actions */}
        {variant === 'detailed' && (
          <div className="flex gap-3 pt-3">
            <button
              onClick={() => onCompare?.(card)}
              className="flex-1 rounded-xl border-2 border-border/50 bg-card px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md"
            >
              Compare
            </button>
            {data.url && (
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <ExternalLink className="h-4 w-4" />
                View
              </a>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
