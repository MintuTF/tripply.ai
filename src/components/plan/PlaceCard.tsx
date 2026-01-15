'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  MapPin,
  DollarSign,
  Wifi,
  Coffee,
  Utensils,
  Car,
  Waves,
  Dumbbell,
  Beer,
  Plus,
  ExternalLink,
  Heart,
  Sparkles,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Card } from '@/types';

interface PlaceCardProps {
  card: Card;
  isHovered?: boolean;
  isSelected?: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (card: Card) => void;
  onAddToTrip?: (card: Card) => void;
  className?: string;
}

// Amenity icons mapping
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3.5 w-3.5" />,
  restaurant: <Utensils className="h-3.5 w-3.5" />,
  parking: <Car className="h-3.5 w-3.5" />,
  pool: <Waves className="h-3.5 w-3.5" />,
  gym: <Dumbbell className="h-3.5 w-3.5" />,
  bar: <Beer className="h-3.5 w-3.5" />,
  breakfast: <Coffee className="h-3.5 w-3.5" />,
};

// Helper to get hotel classification
function getHotelClassification(card: Card): string {
  const payload = (typeof card.payload_json === 'string'
    ? JSON.parse(card.payload_json)
    : card.payload_json) as any;

  if (payload.types?.includes('luxury_hotel')) return 'Luxury Hotel';
  if (payload.types?.includes('resort_hotel')) return 'Resort';
  if (payload.types?.includes('boutique_hotel')) return 'Boutique Hotel';
  if (payload.types?.includes('business_hotel')) return 'Business Hotel';
  if (payload.types?.includes('airport_hotel')) return 'Airport Hotel';
  if (payload.types?.includes('motel')) return 'Motel';
  if (payload.types?.includes('bed_and_breakfast')) return 'B&B';
  if (payload.types?.includes('hostel')) return 'Hostel';
  if (payload.types?.includes('lodging')) return 'Lodging';
  if (payload.types?.includes('hotel')) return 'Hotel';

  return 'Accommodation';
}

// Helper to check if it's a great deal
function isGreatDeal(card: Card): boolean {
  const payload = (typeof card.payload_json === 'string'
    ? JSON.parse(card.payload_json)
    : card.payload_json) as any;
  const priceLevel = payload.priceLevel || payload.price_level || 0;
  const rating = payload.rating || 0;
  const userRatingsTotal = payload.userRatingsTotal || payload.review_count || payload.user_ratings_total || 0;

  return priceLevel <= 2 && rating >= 4.3 && userRatingsTotal >= 100;
}

export function PlaceCard({
  card,
  isHovered = false,
  isSelected = false,
  onHover,
  onClick,
  onAddToTrip,
  className,
}: PlaceCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const payload = (typeof card.payload_json === 'string'
    ? JSON.parse(card.payload_json)
    : card.payload_json) as any;
  const {
    name,
    rating,
    userRatingsTotal = payload.review_count || payload.user_ratings_total,
    priceLevel = payload.price_level,
    photos,
    location,
  } = payload;

  // Get cover photo
  const coverPhoto = photos && photos.length > 0
    ? photos[0]
    : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';

  // Get classification
  const classification = card.type === 'hotel' ? getHotelClassification(card) : '';

  // Check if great deal
  const greatDeal = card.type === 'hotel' && isGreatDeal(card);

  // Get amenities (example - you may have this in your data)
  const amenities = payload.amenities || ['wifi', 'parking', 'restaurant'];

  return (
    <motion.div
      initial={false}
      animate={{
        scale: isHovered ? 1.02 : 1,
        y: isHovered ? -4 : 0,
      }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => onHover?.(card.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(card)}
      className={cn(
        'relative group cursor-pointer rounded-xl overflow-hidden',
        'bg-card border border-border',
        'transition-all duration-300',
        isSelected && 'ring-2 ring-primary shadow-lg',
        isHovered && 'shadow-xl',
        className
      )}
    >
      {/* Image Section */}
      <div className="relative h-44 w-full overflow-hidden bg-muted">
        <img
          src={coverPhoto}
          alt={name}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={cn(
            'h-full w-full object-cover transition-all duration-500',
            isHovered && 'scale-110',
            !imageLoaded && 'opacity-0'
          )}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Great Deal Badge */}
        {greatDeal && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold shadow-lg"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Great Deal
          </motion.div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
          className={cn(
            'absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full',
            'backdrop-blur-md transition-all duration-200',
            isFavorited
              ? 'bg-red-500 text-white'
              : 'bg-white/20 text-white hover:bg-white/30'
          )}
        >
          <Heart className={cn('h-4 w-4', isFavorited && 'fill-current')} />
        </button>

        {/* Price Level */}
        {priceLevel && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <DollarSign
                key={i}
                className={cn(
                  'h-3 w-3',
                  i < priceLevel ? 'text-green-600' : 'text-gray-300'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title and Rating */}
        <div>
          <h3 className="font-semibold text-base text-foreground line-clamp-1 mb-1">
            {name}
          </h3>

          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3.5 w-3.5',
                      i < Math.floor(rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">
                {rating.toFixed(1)}
              </span>
              {userRatingsTotal && (
                <span className="text-xs text-muted-foreground">
                  ({userRatingsTotal.toLocaleString()})
                </span>
              )}
            </div>
          )}

          {/* Classification */}
          {classification && (
            <p className="text-xs text-muted-foreground mt-1">{classification}</p>
          )}
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 4).map((amenity) => (
              <div
                key={amenity}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-xs text-muted-foreground"
              >
                {AMENITY_ICONS[amenity] || <Coffee className="h-3.5 w-3.5" />}
                <span className="capitalize">{amenity}</span>
              </div>
            ))}
            {amenities.length > 4 && (
              <div className="flex items-center px-2 py-1 rounded-md bg-accent text-xs text-muted-foreground">
                +{amenities.length - 4} more
              </div>
            )}
          </div>
        )}

        {/* Location */}
        {location?.address && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">{location.address}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onAddToTrip?.(card);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add to Trip
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(card);
            }}
            className="flex items-center justify-center px-3 py-2 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none transition-opacity duration-300',
          'bg-gradient-to-br from-primary/5 to-transparent',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      />
    </motion.div>
  );
}
