'use client';

import { Card } from '@/types';
import { cn } from '@/lib/utils';
import { Star, Wifi, Coffee, Dumbbell, ParkingCircle, AirVent, PawPrint, Flower2, ImageOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface PlaceListItemProps {
  card: Card;
  isHovered?: boolean;
  isSelected?: boolean;
  onHover?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
  onAddToTrip?: () => void;
  onToggleFavorite?: () => void;
}

// Helper function to get hotel classification
function getHotelClassification(card: Card): string {
  const payload = typeof card.payload_json === 'string'
    ? JSON.parse(card.payload_json)
    : card.payload_json;

  if (card.type === 'hotel') {
    const avgPrice = payload.cost ||
      (payload.price_range ? (payload.price_range[0] + payload.price_range[1]) / 2 : 0);

    if (avgPrice >= 400) return '5-star hotel';
    if (avgPrice >= 250) return '4-star hotel';
    if (avgPrice >= 150) return '3-star hotel';
    if (avgPrice >= 80) return '2-star hotel';
    return 'Budget lodging';
  }

  if (card.type === 'food') {
    if (payload.price_level === 4) return 'Fine dining';
    if (payload.price_level === 3) return 'Upscale restaurant';
    if (payload.price_level === 2) return 'Mid-range dining';
    return 'Casual dining';
  }

  if (card.type === 'activity') return 'Activity';
  if (card.type === 'spot') return payload.type || 'Attraction';

  return card.type;
}

// Helper function to check if it's a great deal
function isGreatDeal(card: Card, allCards: Card[]): boolean {
  const payload = typeof card.payload_json === 'string'
    ? JSON.parse(card.payload_json)
    : card.payload_json;

  const price = payload.cost ||
    (payload.price_range ? (payload.price_range[0] + payload.price_range[1]) / 2 : null);

  if (!price) return false;

  // Calculate average price for same type
  const sameTypeCards = allCards.filter(c => c.type === card.type);
  const prices = sameTypeCards
    .map(c => {
      const p = typeof c.payload_json === 'string' ? JSON.parse(c.payload_json) : c.payload_json;
      return p.cost || (p.price_range ? (p.price_range[0] + p.price_range[1]) / 2 : null);
    })
    .filter(Boolean) as number[];

  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Great deal if 30% below average
  return price < avgPrice * 0.7;
}

// Amenity icon mapping
const AMENITY_ICONS: Record<string, typeof Wifi> = {
  'Free WiFi': Wifi,
  'WiFi': Wifi,
  'Breakfast': Coffee,
  'Gym': Dumbbell,
  'Parking': ParkingCircle,
  'Air-conditioned': AirVent,
  'Pet-friendly': PawPrint,
  'Spa': Flower2,
  'Pool': Flower2,
};

export function PlaceListItem({
  card,
  isHovered,
  isSelected,
  onHover,
  onLeave,
  onClick,
  onAddToTrip,
  onToggleFavorite,
}: PlaceListItemProps) {
  const [isFavorited, setIsFavorited] = useState(card.favorite || false);
  const [imageError, setImageError] = useState(false);

  const payload = typeof card.payload_json === 'string'
    ? JSON.parse(card.payload_json)
    : card.payload_json;

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onToggleFavorite?.();
  };

  const handleAddToTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToTrip?.();
  };

  // Get only the first photo (no carousel in list view, no default fallback)
  const coverPhoto = payload.photos?.[0] || payload.image_url || null;
  const hasPhoto = !!coverPhoto && !imageError;

  // Image loading state
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const handleImageError = () => {
    console.log(`[PlaceListItem] Image error for ${payload.name}:`, coverPhoto);
    setImageError(true);
    setIsImageLoading(false);
  };

  // Debug: log photo availability
  useEffect(() => {
    console.log(`[PlaceListItem] ${payload.name}: photos=${payload.photos?.length || 0}, coverPhoto=${!!coverPhoto}`);
  }, [payload.name, payload.photos, coverPhoto]);

  const classification = getHotelClassification(card);
  const greatDeal = false; // Will be calculated in sidebar with all cards

  // Get amenities with icons
  const amenities = payload.amenities || payload.dietary_tags || [];
  const displayAmenities = amenities.slice(0, 4);

  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      whileHover={{ scale: 1.002 }}
      whileTap={{ scale: 0.998 }}
      className={cn(
        'relative cursor-pointer rounded-lg border bg-card overflow-hidden',
        'transition-all duration-200',
        isHovered && 'border-primary shadow-lg ring-2 ring-primary/10',
        isSelected && 'border-primary bg-primary/5',
        !isHovered && !isSelected && 'border-border hover:border-primary/30 hover:shadow-md'
      )}
    >
      {/* Header with title */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          {/* Title */}
          <h3 className="font-semibold text-[17px] text-foreground line-clamp-2 leading-snug">
            {payload.name}
          </h3>
        </div>

        {/* Rating & Review Count */}
        {payload.rating && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="font-semibold text-[15px] text-foreground">{payload.rating}</span>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3.5 w-3.5',
                  i < Math.floor(payload.rating || 0)
                    ? 'fill-yellow-500 text-yellow-500'
                    : 'text-gray-300 dark:text-gray-600'
                )}
              />
            ))}
            {payload.review_count && (
              <span className="text-[13px] text-muted-foreground ml-0.5">
                ({payload.review_count.toLocaleString()})
              </span>
            )}
          </div>
        )}

        {/* Classification */}
        <p className="text-[14px] text-muted-foreground mt-1">
          {classification}
        </p>

        {/* Cuisine Type for food cards */}
        {card.type === 'food' && payload.cuisine_type && (
          <p className="text-[14px] text-muted-foreground mt-1">
            {payload.cuisine_type}
          </p>
        )}

      </div>

      {/* Amenities Row */}
      {displayAmenities.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          {displayAmenities.map((amenity: string, i: number) => {
            const Icon = AMENITY_ICONS[amenity];
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 text-muted-foreground"
                title={amenity}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="text-[13px]">{Icon ? amenity.split(' ')[0] : amenity}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Deal Badge */}
      {greatDeal && (
        <div className="px-4 pb-3">
          <div className="inline-flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-1.5">
            <span className="text-[12px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
              GREAT DEAL
            </span>
            <span className="text-[13px] text-green-600 dark:text-green-500">
              28% less than usual
            </span>
          </div>
        </div>
      )}

      {/* Photo Section at Bottom */}
      <div className="relative h-[120px] w-full overflow-hidden border-t border-border">
        {/* Loading skeleton */}
        {coverPhoto && isImageLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}

        {/* Actual image */}
        {hasPhoto && coverPhoto && (
          <img
            src={coverPhoto}
            alt={payload.name}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              isImageLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* No photo placeholder */}
        {(!coverPhoto || imageError) && (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <ImageOff className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Hover overlay */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
}
