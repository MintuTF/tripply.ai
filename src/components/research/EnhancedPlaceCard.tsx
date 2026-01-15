'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MapPin,
  Plus,
  Check,
  Heart,
  Clock,
  ExternalLink,
  Utensils,
  Hotel,
  Compass,
  Camera,
  Share2,
} from 'lucide-react';
import { useDestinationTheme } from './DestinationThemeProvider';
import { cn } from '@/lib/utils';
import type { PlaceCard } from '@/types';

interface EnhancedPlaceCardProps {
  card: PlaceCard;
  onSelect: () => void;
  onSave: () => void;
  isSaved?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  showReason?: boolean;
}

// Type-specific styling - Updated to match design spec
const typeConfig = {
  restaurant: {
    icon: Utensils,
    accentClass: 'bg-[#F97316]', // Orange from design spec
    label: 'Restaurant',
  },
  hotel: {
    icon: Hotel,
    accentClass: 'bg-[#3B82F6]', // Blue from design spec
    label: 'Hotel',
  },
  activity: {
    icon: Compass,
    accentClass: 'bg-[#10B981]', // Green from design spec
    label: 'Activity',
  },
  attraction: {
    icon: Camera,
    accentClass: 'bg-[#A855F7]', // Purple from design spec
    label: 'Attraction',
  },
  spot: {
    icon: MapPin,
    accentClass: 'bg-[#A855F7]', // Purple from design spec
    label: 'Spot',
  },
  food: {
    icon: Utensils,
    accentClass: 'bg-[#F97316]', // Orange from design spec
    label: 'Food',
  },
  default: {
    icon: MapPin,
    accentClass: 'bg-primary',
    label: 'Place',
  },
};

// Shimmer loading component
function ShimmerEffect({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer-animation" />
    </div>
  );
}

// Skeleton card for loading state
export function PlaceCardSkeleton({
  variant = 'default',
}: {
  variant?: 'default' | 'compact' | 'featured';
}) {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden bg-card',
        isCompact ? 'w-[160px]' : isFeatured ? 'w-full min-w-[280px] max-w-[420px]' : 'w-full min-w-[260px] max-w-[420px]'
      )}
    >
      {/* Image skeleton with shimmer */}
      <div
        className={cn(
          'relative bg-muted',
          isCompact ? 'h-24' : isFeatured ? 'h-[180px]' : 'h-40'
        )}
      >
        <ShimmerEffect className="absolute inset-0" />
      </div>

      {/* Content skeleton */}
      <div className={cn('p-3 space-y-2', isCompact && 'p-2')}>
        {/* Title */}
        <div className="relative h-4 bg-muted rounded overflow-hidden">
          <ShimmerEffect className="absolute inset-0" />
        </div>

        {/* Address (not on compact) */}
        {!isCompact && (
          <div className="relative h-3 w-3/4 bg-muted rounded overflow-hidden">
            <ShimmerEffect className="absolute inset-0" />
          </div>
        )}

        {/* Rating row */}
        <div className="flex items-center gap-2">
          <div className="relative h-3 w-12 bg-muted rounded overflow-hidden">
            <ShimmerEffect className="absolute inset-0" />
          </div>
          <div className="relative h-3 w-8 bg-muted rounded overflow-hidden">
            <ShimmerEffect className="absolute inset-0" />
          </div>
        </div>

        {/* Description (not on compact) */}
        {!isCompact && (
          <div className="relative h-10 bg-muted rounded overflow-hidden mt-2">
            <ShimmerEffect className="absolute inset-0" />
          </div>
        )}
      </div>
    </div>
  );
}

export function EnhancedPlaceCard({
  card,
  onSelect,
  onSave,
  isSaved = false,
  variant = 'default',
  showReason = true,
}: EnhancedPlaceCardProps) {
  const { theme } = useDestinationTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [saveAnimation, setSaveAnimation] = useState(false);

  const type = (card.type as keyof typeof typeConfig) || 'default';
  const config = typeConfig[type] || typeConfig.default;
  const TypeIcon = config.icon;

  const priceLabel = card.price_level ? '$'.repeat(card.price_level) : null;

  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaveAnimation(true);
    onSave();
    setTimeout(() => setSaveAnimation(false), 600);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: card.name,
          text: card.description || `Check out ${card.name}`,
          url: card.url || window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => {
        setIsHovered(true);
        setShowActions(true);
      }}
      onHoverEnd={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
      onClick={onSelect}
      className={cn(
        'group relative rounded-xl overflow-hidden cursor-pointer bg-card border border-[#E7E5E4]',
        'transition-shadow duration-300',
        isHovered && 'shadow-depth',
        isCompact ? 'w-[160px]' : isFeatured ? 'w-full min-w-[280px] max-w-[420px]' : 'w-full min-w-[260px] max-w-[420px]'
      )}
      style={{
        boxShadow: isHovered
          ? '0 4px 20px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Image Container */}
      <div
        className={cn(
          'relative overflow-hidden',
          isCompact ? 'h-24' : isFeatured ? 'h-[180px]' : 'h-40'
        )}
      >
        {/* Shimmer skeleton while loading */}
        <AnimatePresence>
          {!imageLoaded && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50"
            >
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Image with zoom effect */}
        {card.photos?.[0] && (
          <motion.img
            src={card.photos[0]}
            alt={card.name}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              'w-full h-full object-cover',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            animate={{
              scale: isHovered ? 1.08 : 1,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}

        {/* Gradient overlay on image */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
          style={{ opacity: isHovered ? 0.6 : 0.4 }}
        />

        {/* Type Badge - bottom left */}
        <motion.div
          initial={false}
          animate={{
            backgroundColor: isHovered ? theme.primary : undefined,
          }}
          className={cn(
            'absolute bottom-2 left-2 px-2 py-1 rounded-md text-white text-xs font-medium',
            'flex items-center gap-1 backdrop-blur-sm',
            !isHovered && config.accentClass
          )}
          style={{
            padding: '4px 8px',
            borderRadius: '6px',
          }}
        >
          <TypeIcon className="h-3 w-3" />
          {!isCompact && <span>{config.label}</span>}
        </motion.div>

        {/* Action buttons container - top right */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {/* Share button (only on featured and when hovered) */}
          <AnimatePresence>
            {isFeatured && showActions && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleShare}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full backdrop-blur-sm bg-white/90 text-foreground/70 hover:bg-white hover:text-foreground transition-colors"
              >
                <Share2 className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Save Button */}
          <motion.button
            onClick={handleSave}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isHovered || isSaved ? 1 : 0,
              scale: isHovered || isSaved ? 1 : 0.8,
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'relative rounded-full backdrop-blur-sm',
              'transition-colors duration-200',
              isCompact ? 'p-1.5' : 'p-2',
              isSaved
                ? 'bg-primary text-white'
                : 'bg-white/90 text-foreground/70 hover:bg-white hover:text-foreground'
            )}
            style={{
              backgroundColor: isSaved ? theme.primary : undefined,
            }}
          >
            {/* Save animation burst */}
            <AnimatePresence>
              {saveAnimation && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{
                        scale: 2,
                        opacity: 0,
                        x: Math.cos((i * Math.PI) / 3) * 20,
                        y: Math.sin((i * Math.PI) / 3) * 20,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full -translate-x-1/2 -translate-y-1/2"
                      style={{ backgroundColor: theme.primary }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
            {isSaved ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <Check className={cn(isCompact ? 'h-3 w-3' : 'h-4 w-4')} />
              </motion.div>
            ) : (
              <Plus className={cn(isCompact ? 'h-3 w-3' : 'h-4 w-4')} />
            )}
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className={cn('p-3', isCompact && 'p-2')}>
        {/* Name */}
        <h4
          className={cn(
            'font-semibold truncate text-foreground',
            isCompact ? 'text-xs' : isFeatured ? 'text-base' : 'text-sm'
          )}
        >
          {card.name}
        </h4>

        {/* Address - only show on non-compact */}
        {!isCompact && card.address && (
          <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{card.address}</span>
          </p>
        )}

        {/* Rating, Price, Type row */}
        <div
          className={cn(
            'flex items-center gap-2 mt-2 text-muted-foreground',
            isCompact ? 'text-[10px]' : 'text-xs'
          )}
        >
          {card.rating && (
            <span className="flex items-center gap-0.5 font-medium">
              <Star
                className={cn(
                  'fill-amber-400 text-amber-400',
                  isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'
                )}
              />
              {card.rating.toFixed(1)}
              {card.review_count && !isCompact && (
                <span className="text-muted-foreground/60">
                  ({card.review_count > 999 ? '999+' : card.review_count})
                </span>
              )}
            </span>
          )}
          {priceLabel && (
            <span className="text-green-600 font-medium">{priceLabel}</span>
          )}
          {card.type && isCompact && (
            <span className="capitalize">{card.type}</span>
          )}
        </div>

        {/* Why suggested - destination themed */}
        {showReason && card.description && !isCompact && (
          <motion.p
            initial={{ opacity: 0.7 }}
            animate={{
              opacity: isHovered ? 1 : 0.7,
            }}
            className={cn(
              'mt-2 text-xs line-clamp-2 rounded-md px-2 py-1.5',
              'bg-muted/50'
            )}
            style={{
              borderLeft: `2px solid ${theme.primary}`,
            }}
          >
            {card.description}
          </motion.p>
        )}

        {/* Featured variant: Additional info */}
        {isFeatured && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {card.opening_hours && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Open now
                </span>
              )}
            </div>
            <motion.a
              href={card.url || `https://www.google.com/search?q=${encodeURIComponent(card.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: theme.primary }}
            >
              View <ExternalLink className="h-3 w-3" />
            </motion.a>
          </div>
        )}
      </div>

      {/* Hover border accent */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        style={{
          boxShadow: `inset 0 0 0 2px ${theme.primary}40`,
        }}
      />
    </motion.div>
  );
}

// Grid layout helper for the feed - Updated to match design spec
export function PlaceCardGrid({
  children,
  className,
  columns = 3,
}: {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3; // Support both 3-col (default) and 2-col (split view) layouts
}) {
  return (
    <div
      className={cn(
        'grid gap-6',
        columns === 3
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // 3 columns on desktop (1440px+)
          : 'grid-cols-1 md:grid-cols-2', // 2 columns for split view
        className
      )}
    >
      {children}
    </div>
  );
}
