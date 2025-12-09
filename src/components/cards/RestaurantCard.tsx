'use client';

import { useState } from 'react';
import { PlaceCard } from '@/types';
import { cn } from '@/lib/utils';
import { MapPin, Plus, Utensils, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { RatingBadge } from './RatingBadge';

interface RestaurantCardProps {
  card: PlaceCard;
  onAddToTrip?: (card: PlaceCard) => void;
  onSave?: (card: PlaceCard) => void;
  onClick?: (card: PlaceCard) => void;
}

// Curated restaurant placeholder images
const RESTAURANT_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
];

function getRestaurantImage(id: string): string {
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % RESTAURANT_IMAGES.length;
  return RESTAURANT_IMAGES[index];
}

function extractLocation(address?: string): string {
  if (!address) return 'Location unavailable';
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ');
  }
  return address;
}

function getPriceLevelDisplay(priceLevel?: number): string {
  if (!priceLevel) return '';
  return '$'.repeat(priceLevel);
}

export function RestaurantCard({ card, onAddToTrip, onClick }: RestaurantCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdded(true);
    onAddToTrip?.(card);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const mainImage = card.photos?.[0] || getRestaurantImage(card.id);
  const fallbackImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';

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
        {/* Restaurant Name & Cuisine */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {card.name}
          </h3>
          {card.price_level && (
            <span className="text-sm font-semibold text-green-600 flex-shrink-0">
              {getPriceLevelDisplay(card.price_level)}
            </span>
          )}
        </div>

        {/* Cuisine Type */}
        {card.cuisine_type && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Utensils className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{card.cuisine_type}</span>
          </div>
        )}

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

        {/* Opening Hours */}
        {card.opening_hours && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">{card.opening_hours.split(',')[0]}</span>
          </div>
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
