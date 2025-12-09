'use client';

import { useState } from 'react';
import { PlaceCard } from '@/types';
import { cn } from '@/lib/utils';
import { MapPin, Plus, Clock, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { RatingBadge } from './RatingBadge';

interface ActivityCardProps {
  card: PlaceCard;
  onAddToTrip?: (card: PlaceCard) => void;
  onSave?: (card: PlaceCard) => void;
  onClick?: (card: PlaceCard) => void;
}

// Curated activity/attraction placeholder images
const ACTIVITY_IMAGES = [
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop',
];

function getActivityImage(id: string): string {
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % ACTIVITY_IMAGES.length;
  return ACTIVITY_IMAGES[index];
}

function extractLocation(address?: string): string {
  if (!address) return 'Location unavailable';
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ');
  }
  return address;
}

function formatPrice(price?: number, currency: string = 'USD'): string {
  if (!price) return '';
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    JPY: '\u00A5',
    AUD: 'A$',
    CAD: 'C$',
  };
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${Math.round(price).toLocaleString()}`;
}

export function ActivityCard({ card, onAddToTrip, onClick }: ActivityCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdded(true);
    onAddToTrip?.(card);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const mainImage = card.photos?.[0] || getActivityImage(card.id);
  const fallbackImage = 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&h=300&fit=crop';

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
        {/* Activity Name */}
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

        {/* Duration & Price Row */}
        <div className="flex items-center gap-4 text-sm">
          {card.duration && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{card.duration}</span>
            </div>
          )}
          {card.price && (
            <div className="flex items-center gap-1.5 text-green-600 font-semibold">
              <Ticket className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatPrice(card.price, card.currency)}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
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
