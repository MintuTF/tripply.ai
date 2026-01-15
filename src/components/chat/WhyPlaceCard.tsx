'use client';

import { useState } from 'react';
import { PlaceCard } from '@/types';
import { cn } from '@/lib/utils';
import { Star, MapPin, Clock, Heart, ExternalLink, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export interface WhyPlaceCardProps {
  place: PlaceCard;
  whyTags?: string[];
  whyBullets?: string[];
  onSave?: () => void;
  onViewDetails?: () => void;
  isSaved?: boolean;
  compact?: boolean;
}

// Fallback images for different place types
const FALLBACK_IMAGES: Record<string, string> = {
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
  activity: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&h=300&fit=crop',
  location: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=300&fit=crop',
};

function formatPriceLevel(level?: number): string {
  if (!level) return '';
  return '$'.repeat(Math.min(level, 4));
}

export function WhyPlaceCard({
  place,
  whyTags = [],
  whyBullets = [],
  onSave,
  onViewDetails,
  isSaved = false,
  compact = false,
}: WhyPlaceCardProps) {
  const [imageError, setImageError] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSaved) {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
    onSave?.();
  };

  const mainImage = place.photos?.[0] || FALLBACK_IMAGES[place.type] || FALLBACK_IMAGES.location;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900',
        'border border-gray-100 dark:border-gray-800',
        'shadow-sm hover:shadow-lg transition-all duration-300',
        compact ? 'w-64 flex-shrink-0' : 'w-full max-w-sm'
      )}
    >
      {/* Image Section */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={imageError ? FALLBACK_IMAGES[place.type] || FALLBACK_IMAGES.location : mainImage}
          alt={place.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* WHY Tags - Top of image */}
        {whyTags.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {whyTags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full bg-white/90 dark:bg-gray-900/90 text-xs font-medium text-gray-700 dark:text-gray-300 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={cn(
            'absolute top-3 right-3 p-2 rounded-full transition-all',
            isSaved || justSaved
              ? 'bg-pink-500 text-white'
              : 'bg-white/90 dark:bg-gray-900/90 text-gray-600 dark:text-gray-400 hover:bg-pink-50 hover:text-pink-500'
          )}
        >
          {justSaved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} />
          )}
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Place Name */}
        <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
          {place.name}
        </h3>

        {/* Meta Row: Rating, Price, Duration */}
        <div className="flex items-center gap-3 text-sm">
          {place.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-gray-900 dark:text-white">
                {place.rating.toFixed(1)}
              </span>
              {place.review_count && (
                <span className="text-gray-500 dark:text-gray-400">
                  ({place.review_count > 1000 ? `${(place.review_count / 1000).toFixed(1)}k` : place.review_count})
                </span>
              )}
            </div>
          )}

          {place.price_level && (
            <span className="text-gray-500 dark:text-gray-400">
              {formatPriceLevel(place.price_level)}
            </span>
          )}

          {place.duration && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{place.duration}</span>
            </div>
          )}
        </div>

        {/* WHY Section */}
        {whyBullets.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">
              Why this fits your trip
            </p>
            <ul className="space-y-1">
              {whyBullets.slice(0, 3).map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span className="text-purple-500 mt-1">•</span>
                  <span className="line-clamp-1">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            View Details
          </button>

          {place.url && (
            <a
              href={place.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Open website"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Compact horizontal card variant for inline display
 */
export function WhyPlaceCardCompact({
  place,
  whyTags = [],
  onSave,
  onViewDetails,
  isSaved = false,
}: Omit<WhyPlaceCardProps, 'whyBullets' | 'compact'>) {
  const [imageError, setImageError] = useState(false);

  const mainImage = place.photos?.[0] || FALLBACK_IMAGES[place.type] || FALLBACK_IMAGES.location;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onViewDetails?.()}
      className={cn(
        'flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-gray-900',
        'border border-gray-100 dark:border-gray-800',
        'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden">
        <img
          src={imageError ? FALLBACK_IMAGES[place.type] : mainImage}
          alt={place.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {place.name}
        </h4>

        <div className="flex items-center gap-2 mt-0.5">
          {place.rating && (
            <div className="flex items-center gap-0.5 text-xs">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-gray-600 dark:text-gray-400">{place.rating.toFixed(1)}</span>
            </div>
          )}

          {whyTags.length > 0 && (
            <span className="text-xs text-purple-600 dark:text-purple-400 truncate">
              {whyTags[0]}
            </span>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSave?.();
        }}
        className={cn(
          'p-1.5 rounded-full transition-colors',
          isSaved
            ? 'text-pink-500'
            : 'text-gray-400 hover:text-pink-500'
        )}
      >
        <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} />
      </button>
    </motion.div>
  );
}
