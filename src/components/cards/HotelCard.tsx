'use client';

import { useState } from 'react';
import { PlaceCard } from '@/types';
import { cn } from '@/lib/utils';
import { MapPin, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { RatingBadge } from './RatingBadge';
import { PriceDisplay } from './PriceDisplay';

interface HotelCardProps {
  card: PlaceCard;
  onAddToTrip?: (card: PlaceCard) => void;
  onSave?: (card: PlaceCard) => void;
  onClick?: (card: PlaceCard) => void;
}

// Curated hotel placeholder images
const HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
];

function getHotelImage(id: string): string {
  // Deterministic image selection based on hotel ID
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % HOTEL_IMAGES.length;
  return HOTEL_IMAGES[index];
}

function extractLocation(address?: string): string {
  if (!address) return 'Location unavailable';
  // Extract city from address (usually last 2-3 parts)
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ');
  }
  return address;
}

export function HotelCard({ card, onAddToTrip, onClick }: HotelCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdded(true);
    onAddToTrip?.(card);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const mainImage = card.photos?.[0] || getHotelImage(card.id);
  const fallbackImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => onClick?.(card)}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card',
        'cursor-pointer transition-all duration-200',
        'shadow-md hover:shadow-xl hover:scale-[1.02]',
        'border border-border/30'
      )}
    >
      {/* Image Section */}
      <div className="relative h-40 overflow-hidden bg-muted">
        <img
          src={imageError ? fallbackImage : mainImage}
          alt={card.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Hotel Name */}
        <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {card.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{extractLocation(card.address)}</span>
        </div>

        {/* Rating Badge */}
        {card.rating && (
          <RatingBadge
            rating={card.rating}
            reviewCount={card.review_count}
            size="sm"
          />
        )}

        {/* Price Display */}
        {card.price_per_night && (
          <PriceDisplay
            amount={card.price_per_night}
            currency={card.currency}
            period="night"
            checkInDate={card.check_in_date}
            checkOutDate={card.check_out_date}
          />
        )}

        {/* Room Type / Description */}
        {card.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {card.description}
          </p>
        )}

        {/* CTA Button */}
        <button
          onClick={handleAddToTrip}
          disabled={isAdded}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold',
            'transition-all duration-200',
            isAdded
              ? 'bg-green-500 text-white'
              : 'bg-primary text-white hover:bg-primary/90'
          )}
        >
          {isAdded ? (
            <span>Added!</span>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Shortlist</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
