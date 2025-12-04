'use client';

import { Card } from '@/types';
import { cn } from '@/lib/utils';

interface ResultCardProps {
  card: Card;
  onSave?: (card: Card) => void;
  onCompare?: (card: Card) => void;
  onPin?: (card: Card) => void;
  variant?: 'compact' | 'default' | 'detailed';
}

/**
 * Convert price level (1-4) to $ symbols
 */
function getPriceSymbols(level: number | undefined): string {
  if (!level) return '';
  return '$'.repeat(Math.min(Math.max(level, 1), 4));
}

/**
 * Extract city and country from address or use provided city/country fields
 */
function getLocation(data: Record<string, unknown>): string {
  if (data.city && data.country) {
    return `${data.city}, ${data.country}`;
  }
  if (data.address && typeof data.address === 'string') {
    // Try to extract city, country from address (last two parts)
    const parts = data.address.split(',').map((p: string) => p.trim());
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
    }
    return data.address;
  }
  return '';
}

/**
 * Get the type/category info for the card (cuisine type, activity type, etc.)
 */
function getTypeInfo(data: Record<string, unknown>, cardType: string): string | null {
  // Restaurant: cuisine_type
  if (data.cuisine_type) return data.cuisine_type as string;
  // Activity/Spot: type
  if (data.type && cardType !== 'hotel') return data.type as string;
  return null;
}

/**
 * ResultCard - Universal card component for displaying search results
 * Horizontal layout: image thumbnail on left, content on right
 */
export function ResultCard({
  card,
  variant = 'default'
}: ResultCardProps) {
  const data = typeof card.payload_json === 'string' ? JSON.parse(card.payload_json) : card.payload_json;

  const name = data.name || data.title || 'Untitled';
  const location = getLocation(data);
  const priceLevel = data.price_level as number | undefined;
  const priceRange = data.price_range as [number, number] | undefined;
  const typeInfo = getTypeInfo(data, card.type);
  const description = data.description || data.notes;
  const photos = data.photos as string[] | undefined;
  const hasPhoto = photos && photos.length > 0;

  // Build the price/type line
  let priceTypeText = '';
  if (priceLevel) {
    priceTypeText = getPriceSymbols(priceLevel);
  } else if (priceRange && priceRange[0] > 0) {
    // For hotels, estimate price level from range
    const avgPrice = (priceRange[0] + priceRange[1]) / 2;
    if (avgPrice < 100) priceTypeText = '$';
    else if (avgPrice < 200) priceTypeText = '$$';
    else if (avgPrice < 400) priceTypeText = '$$$';
    else priceTypeText = '$$$$';
  }
  if (typeInfo) {
    priceTypeText = priceTypeText ? `${priceTypeText}    ${typeInfo}` : typeInfo;
  }

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-card transition-all duration-200',
        'border-border/50 hover:border-border',
        'shadow-sm hover:shadow-md',
        'flex flex-row gap-3',
        variant === 'compact' && 'p-2',
        variant === 'default' && 'p-3',
        variant === 'detailed' && 'p-4'
      )}
    >
      {/* Image Thumbnail */}
      {hasPhoto && (
        <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
          <img
            src={photos[0]}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center min-w-0 gap-0.5">
        {/* Name */}
        <h3 className="font-semibold text-foreground truncate text-sm">
          {name}
        </h3>

        {/* Location */}
        {location && (
          <p className="text-xs text-muted-foreground truncate">
            {location}
          </p>
        )}

        {/* Price & Type */}
        {priceTypeText && (
          <p className="text-xs text-muted-foreground">
            {priceTypeText}
          </p>
        )}

        {/* Description */}
        {variant !== 'compact' && description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
