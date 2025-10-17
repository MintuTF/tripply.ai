'use client';

import { useState, useEffect } from 'react';
import { PlaceCard } from '@/types';
import { cn } from '@/lib/utils';
import {
  X,
  Star,
  MapPin,
  ExternalLink,
  Plus,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Utensils,
  Hotel,
  Activity,
  Wifi,
  Coffee,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardModalProps {
  card: PlaceCard;
  onClose: () => void;
  onAddToTrip?: (card: PlaceCard) => void;
  onSave?: (card: PlaceCard) => void;
}

export function CardModal({ card, onClose, onAddToTrip, onSave }: CardModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.(card);
  };

  const handleAddToTrip = () => {
    setIsAdded(true);
    onAddToTrip?.(card);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const nextImage = () => {
    if (card.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % card.photos.length);
    }
  };

  const prevImage = () => {
    if (card.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + card.photos.length) % card.photos.length);
    }
  };

  const getIcon = () => {
    switch (card.type) {
      case 'restaurant':
        return <Utensils className="h-5 w-5" />;
      case 'hotel':
        return <Hotel className="h-5 w-5" />;
      case 'activity':
        return <Activity className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  const priceDisplay = card.price_range
    ? `$${card.price_range[0]}-${card.price_range[1]}/night`
    : card.price_level
    ? '$'.repeat(card.price_level)
    : card.price
    ? `$${card.price}`
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-background shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/70 hover:scale-110"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Scrollable Content */}
          <div className="max-h-[90vh] overflow-y-auto">
            {/* Image Gallery */}
            {card.photos && card.photos.length > 0 && (
              <div className="relative h-96 bg-muted">
                <img
                  src={card.photos[currentImageIndex] || '/placeholder-location.jpg'}
                  alt={card.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-location.jpg';
                  }}
                />

                {/* Image Navigation */}
                {card.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/70 hover:scale-110"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/70 hover:scale-110"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                      {card.photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImageIndex(i)}
                          className={cn(
                            'h-2 rounded-full transition-all duration-300',
                            i === currentImageIndex
                              ? 'w-8 bg-white'
                              : 'w-2 bg-white/50 hover:bg-white/75'
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Type Badge */}
                <div className="absolute left-4 top-4">
                  <span className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-gray-800/90 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur-md capitalize">
                    {getIcon()}
                    {card.type}
                  </span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h2 className="text-3xl font-bold text-foreground">{card.name}</h2>
                  <button
                    onClick={handleSave}
                    className={cn(
                      'rounded-full p-3 transition-all duration-300',
                      isSaved
                        ? 'bg-primary text-white shadow-lg shadow-primary/50'
                        : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    )}
                  >
                    <Bookmark className={cn('h-5 w-5', isSaved && 'fill-current')} />
                  </button>
                </div>

                {/* Rating & Price */}
                <div className="flex flex-wrap items-center gap-4">
                  {card.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-foreground">{card.rating.toFixed(1)}</span>
                      </div>
                      {card.review_count && (
                        <span className="text-sm text-muted-foreground">
                          {card.review_count} reviews
                        </span>
                      )}
                    </div>
                  )}
                  {priceDisplay && (
                    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
                      <span className="font-bold text-primary">{priceDisplay}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {card.address && (
                <div className="mb-6 flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                  <MapPin className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                  <p className="text-foreground/90">{card.address}</p>
                </div>
              )}

              {/* Type-specific Details */}
              <div className="mb-6 space-y-4">
                {/* Restaurant: Cuisine & Hours */}
                {card.type === 'restaurant' && (
                  <div className="space-y-3">
                    {card.cuisine_type && (
                      <div className="flex items-center gap-3">
                        <Utensils className="h-5 w-5 text-muted-foreground" />
                        <span className="text-foreground/90">{card.cuisine_type}</span>
                      </div>
                    )}
                    {card.opening_hours && (
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                        <div className="text-sm text-foreground/80">
                          {card.opening_hours.split(',').map((hour, i) => (
                            <div key={i}>{hour.trim()}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Hotel: Amenities */}
                {card.type === 'hotel' && card.amenities && card.amenities.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold text-foreground">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {card.amenities.map((amenity, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground"
                        >
                          {amenity === 'WiFi' && <Wifi className="h-4 w-4" />}
                          {amenity === 'Breakfast' && <Coffee className="h-4 w-4" />}
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity: Duration & Price */}
                {card.type === 'activity' && (
                  <div className="flex flex-wrap gap-4">
                    {card.duration && (
                      <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{card.duration}</span>
                      </div>
                    )}
                    {card.price && (
                      <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-primary">${card.price}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {card.description && (
                <div className="mb-6">
                  <h3 className="mb-2 font-semibold text-foreground">About</h3>
                  <p className="text-foreground/80 leading-relaxed">{card.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToTrip}
                  disabled={isAdded}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold',
                    'transition-all duration-300',
                    isAdded
                      ? 'bg-green-500 text-white'
                      : 'gradient-primary text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                  )}
                >
                  {isAdded ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        ✓
                      </motion.div>
                      <span>Added to Trip!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span>Add to Trip</span>
                    </>
                  )}
                </button>

                {card.url && (
                  <a
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-border/50 bg-card px-6 py-4 text-base font-semibold transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02]"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>View Details</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
