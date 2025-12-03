'use client';

import { Card, PlaceReview, PlaceResult } from '@/types';
import { cn } from '@/lib/utils';
import {
  X, Star, MapPin, Phone, Globe, Clock, DollarSign,
  Navigation, Heart, Share2, Calendar, Info, MessageSquare,
  Camera, Wifi, Coffee, Dumbbell, ParkingCircle, AirVent,
  PawPrint, Flower2, Utensils, Home, Building2,
  Clock3, Ticket, ChevronLeft, ChevronRight, User, Loader2, Hotel
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { PriceComparisonModal } from './PriceComparisonModal';

interface FloatingCardDetailProps {
  card: Card | null;
  onClose: () => void;
  onAddToTrip?: (card: Card) => void;
}

type TabType = 'overview' | 'reviews' | 'photos';

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
  'Restaurant': Utensils,
  'Room service': Home,
};

function getClassification(card: Card): string {
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

export function FloatingCardDetail({ card, onClose, onAddToTrip }: FloatingCardDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(card?.favorite || false);
  const [placeDetails, setPlaceDetails] = useState<PlaceResult | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<'all' | 'latest'>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [priceComparisonOpen, setPriceComparisonOpen] = useState(false);

  // Calculate photos array before any conditional returns
  // Prioritize photos from placeDetails (up to 10) over card photos (usually 1)
  const photos = placeDetails?.photos || (card
    ? (typeof card.payload_json === 'string'
        ? JSON.parse(card.payload_json)
        : card.payload_json).photos || []
    : []);

  // Lightbox handlers - must be defined before any conditional returns
  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const nextPhoto = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [lightboxOpen, closeLightbox, nextPhoto, prevPhoto]);

  // Fetch full place details when card changes
  useEffect(() => {
    if (!card) return;

    const payload = typeof card.payload_json === 'string'
      ? JSON.parse(card.payload_json)
      : card.payload_json;

    const fetchPlaceDetails = async () => {
      const placeId = payload.place_id;

      if (!placeId) {
        setPlaceDetails(null);
        return;
      }

      setIsLoadingDetails(true);
      try {
        const response = await fetch(`/api/places/details?place_id=${encodeURIComponent(placeId)}`);
        if (!response.ok) {
          // Silently fail - card will display existing payload data
          setPlaceDetails(null);
          return;
        }

        const data = await response.json();
        setPlaceDetails(data.place);
      } catch {
        // Silently fail - card will display existing payload data
        setPlaceDetails(null);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchPlaceDetails();
  }, [card]);

  if (!card) return null;

  const payload = typeof card.payload_json === 'string'
    ? JSON.parse(card.payload_json)
    : card.payload_json;
  const heroImage = photos[currentPhotoIndex] || payload.image_url ||
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop';

  const classification = getClassification(card);


  // Generate booking data for hotels (uses real Amadeus pricing if available)
  const getBookingPrice = () => {
    if (card.type !== 'hotel') return null;

    // Prefer real Amadeus price
    if (payload.amadeus_price) {
      return Math.floor(payload.amadeus_price);
    }

    // Check for cost field (single price from SerpAPI or Google Places)
    if (payload.cost) return payload.cost;

    // Fall back to price_range minimum (legacy support)
    if (payload.price_range) {
      return Math.floor(payload.price_range[0]);
    }

    return null; // Don't show booking section if no price available
  };

  const getBookingDates = () => {
    // Use Amadeus dates if available
    if (payload.amadeus_check_in && payload.amadeus_check_out) {
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
      return `${formatDate(payload.amadeus_check_in)} – ${formatDate(payload.amadeus_check_out)}`;
    }

    // Otherwise generate default dates (tomorrow and day after)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return `${formatDate(tomorrow)} – ${formatDate(dayAfter)}`;
  };

  const getCurrency = () => {
    return payload.amadeus_currency || payload.currency || 'USD';
  };

  const bookingPrice = getBookingPrice();
  const bookingDates = getBookingDates();
  const currency = getCurrency();

  const tabs: { id: TabType; label: string; icon: typeof Info }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'photos', label: 'Photos', icon: Camera },
  ];

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const toggleReviewExpansion = (index: number) => {
    setExpandedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key="card-detail"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={cn(
            'fixed right-0 md:right-4 top-4 bottom-4',
            'w-full md:w-[420px]',
            'rounded-none md:rounded-2xl',
            'overflow-hidden flex flex-col z-50',
            'bg-background shadow-2xl border-2 border-border'
          )}
        >
          <div className="relative h-[300px] md:h-[350px] flex-shrink-0">
            <img
              src={heroImage}
              alt={payload.name}
              className="h-full w-full object-cover rounded-t-none md:rounded-t-2xl"
            />

            {photos.length > 1 && (
              <>
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6 text-foreground" />
                </button>
                <button
                  onClick={handleNextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-6 w-6 text-foreground" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {photos.map((_: string, index: number) => (
                    <div
                      key={index}
                      className={cn(
                        'h-2 rounded-full transition-all',
                        index === currentPhotoIndex
                          ? 'w-8 bg-white'
                          : 'w-2 bg-white/50'
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white transition-colors cursor-pointer"
            >
              <X className="h-6 w-6 text-foreground" />
            </button>

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="border-b-2 border-border p-6 space-y-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {payload.name}
                </h1>

                <p className="text-base text-muted-foreground mb-2">
                  {classification}
                </p>

                {payload.rating && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-foreground">{payload.rating}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-4 w-4',
                              star <= Math.floor(payload.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            )}
                          />
                        ))}
                      </div>
                      {payload.review_count && (
                        <span className="text-xs text-muted-foreground">
                          ({payload.review_count.toLocaleString()})
                        </span>
                      )}
                    </div>
                    {onAddToTrip && (
                      <button
                        onClick={() => onAddToTrip(card)}
                        className="flex items-center gap-1.5 rounded-lg gradient-primary text-white px-2.5 py-1 text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Add to Trip</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-b-2 border-border">
              <div className="flex gap-1 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Location & Contact Section */}
                      <div className="space-y-3">
                        {payload.address && (
                          <div className="flex items-start gap-3 text-foreground">
                            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{payload.address}</span>
                          </div>
                        )}

                        {payload.phone && (
                          <div className="flex items-center gap-3 text-foreground">
                            <Phone className="h-5 w-5 text-primary" />
                            <span className="text-sm">{payload.phone}</span>
                          </div>
                        )}

                        {payload.website && (
                          <div className="flex items-center gap-3 text-foreground">
                            <Globe className="h-5 w-5 text-primary" />
                            <a
                              href={payload.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}

                        {payload.opening_hours && (
                          <div className="flex items-center gap-3 text-foreground">
                            <Clock className="h-5 w-5 text-primary" />
                            <span className="text-sm">{payload.opening_hours}</span>
                          </div>
                        )}
                      </div>

                      {(placeDetails?.editorial_summary || payload.description) && (
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-3">About</h3>
                          <div className="space-y-3">
                            {(placeDetails?.editorial_summary || payload.description || '')
                              .split('\n')
                              .filter((p: string) => p.trim())
                              .map((paragraph: string, index: number) => (
                                <p key={index} className="text-sm text-foreground leading-relaxed">
                                  {paragraph}
                                </p>
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {card.type === 'hotel' && (
                        <>
                          {payload.amenities && payload.amenities.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-3">Amenities</h3>
                              <div className="grid grid-cols-2 gap-3">
                                {payload.amenities.map((amenity: string, index: number) => {
                                  const Icon = AMENITY_ICONS[amenity] || Building2;
                                  return (
                                    <div key={index} className="flex items-center gap-2 text-foreground">
                                      <Icon className="h-5 w-5 text-primary" />
                                      <span className="text-sm">{amenity}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {card.type === 'food' && (
                        <>
                          {payload.cuisine_type && (
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2">Cuisine</h3>
                              <p className="text-sm text-foreground">{payload.cuisine_type}</p>
                            </div>
                          )}

                          {payload.dietary_tags && payload.dietary_tags.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2">Dietary Options</h3>
                              <div className="flex flex-wrap gap-2">
                                {payload.dietary_tags.map((tag: string, index: number) => (
                                  <span key={index} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {card.type === 'activity' && (
                        <>
                          {payload.duration && (
                            <div className="flex items-center gap-2 text-foreground">
                              <Clock3 className="h-5 w-5 text-primary" />
                              <span className="text-sm font-medium">Duration: {payload.duration}</span>
                            </div>
                          )}

                          {payload.type && (
                            <div className="flex items-center gap-2 text-foreground">
                              <Ticket className="h-5 w-5 text-primary" />
                              <span className="text-sm font-medium">Type: {payload.type}</span>
                            </div>
                          )}
                        </>
                      )}

                      {card.type === 'spot' && (
                        <>
                          {payload.opening_hours && (
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2">Hours</h3>
                              <div className="flex items-center gap-2 text-foreground">
                                <Clock className="h-5 w-5 text-primary" />
                                <span className="text-sm">{payload.opening_hours}</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-6">
                      {payload.rating && (placeDetails?.review_count || payload.review_count) ? (
                        <>
                          {/* Rating Summary with Distribution */}
                          <div className="flex items-center gap-6">
                            {/* Overall Rating */}
                            <div className="flex-shrink-0 text-center">
                              <div className="text-5xl font-bold text-foreground mb-1">
                                {payload.rating.toFixed(1)}
                              </div>
                              <div className="flex items-center justify-center gap-0.5 mb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      'h-4 w-4',
                                      star <= Math.round(payload.rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    )}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {(placeDetails?.review_count || payload.review_count).toLocaleString()} reviews
                              </p>
                            </div>

                            {/* Rating Distribution Bars */}
                            <div className="flex-1 space-y-1">
                              {[5, 4, 3, 2, 1].map((starLevel) => {
                                // Calculate approximate distribution based on overall rating
                                // This is a simplified approach - real data would come from API
                                const percentage = starLevel === Math.round(payload.rating) ? 70 :
                                                  starLevel === Math.round(payload.rating) - 1 ? 20 :
                                                  starLevel === Math.round(payload.rating) + 1 ? 5 : 3;

                                return (
                                  <div key={starLevel} className="flex items-center gap-2">
                                    <span className="text-xs text-foreground w-2">{starLevel}</span>
                                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-yellow-400 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Reviews List */}
                          {isLoadingDetails ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : placeDetails?.reviews && placeDetails.reviews.length > 0 ? (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                              {placeDetails.reviews.map((review, index) => (
                                <div key={index} className="pb-4 border-b border-border last:border-0">
                                  <div className="flex items-start gap-3">
                                    {/* Profile Photo */}
                                    {review.profile_photo_url ? (
                                      <img
                                        src={review.profile_photo_url}
                                        alt={review.author_name}
                                        className="w-10 h-10 rounded-full flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg font-bold text-primary">
                                          {review.author_name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}

                                    {/* Review Content */}
                                    <div className="flex-1 min-w-0">
                                      {/* Author Name */}
                                      <h4 className="font-semibold text-foreground text-sm mb-1">
                                        {review.author_name}
                                      </h4>

                                      {/* Rating and Time */}
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="flex items-center gap-0.5">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                              key={star}
                                              className={cn(
                                                'h-3.5 w-3.5',
                                                star <= review.rating
                                                  ? 'fill-yellow-400 text-yellow-400'
                                                  : 'text-gray-300'
                                              )}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {review.relative_time_description}
                                        </span>
                                      </div>

                                      {/* Review Text */}
                                      <div className="space-y-2">
                                        <p className="text-sm text-foreground leading-relaxed">
                                          {expandedReviews.has(index) || review.text.length <= 200
                                            ? review.text
                                            : `${review.text.substring(0, 200)}...`}
                                        </p>
                                        {review.text.length > 200 && (
                                          <button
                                            onClick={() => toggleReviewExpansion(index)}
                                            className="text-sm text-primary hover:underline font-medium"
                                          >
                                            {expandedReviews.has(index) ? 'Show less' : 'More'}
                                          </button>
                                        )}

                                        {/* Review Photos */}
                                        {review.photos && review.photos.length > 0 && (
                                          <div className="grid grid-cols-2 gap-2 mt-3">
                                            {review.photos.map((photo, photoIndex) => (
                                              <div
                                                key={photoIndex}
                                                className="aspect-square cursor-pointer overflow-hidden rounded-lg"
                                              >
                                                <img
                                                  src={photo}
                                                  alt={`Review photo ${photoIndex + 1}`}
                                                  className="h-full w-full object-cover hover:scale-105 transition-transform"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No detailed reviews available
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No reviews available yet
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'photos' && (
                    <div className="space-y-4">
                      {photos.length > 0 ? (
                        <>
                          {/* Category Filters */}
                          <div className="flex gap-2 border-b border-border pb-3">
                            <button
                              onClick={() => setSelectedPhotoCategory('all')}
                              className={cn(
                                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                                selectedPhotoCategory === 'all'
                                  ? 'bg-primary text-white'
                                  : 'bg-muted text-foreground hover:bg-muted/80'
                              )}
                            >
                              All ({photos.length})
                            </button>
                            <button
                              onClick={() => setSelectedPhotoCategory('latest')}
                              className={cn(
                                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                                selectedPhotoCategory === 'latest'
                                  ? 'bg-primary text-white'
                                  : 'bg-muted text-foreground hover:bg-muted/80'
                              )}
                            >
                              Latest
                            </button>
                          </div>

                          {/* Photo Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            {photos.map((photo: string, index: number) => (
                              <motion.div
                                key={index}
                                whileHover={{ scale: 1.03 }}
                                className="aspect-square cursor-pointer overflow-hidden rounded-lg"
                                onClick={() => openLightbox(index)}
                              >
                                <img
                                  src={photo}
                                  alt={`${payload.name} - Photo ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </motion.div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No additional photos available
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && photos.length > 0 && (
        <motion.div
          key="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 p-3 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Photo Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="text-white font-medium">
              {lightboxIndex + 1} / {photos.length}
            </span>
          </div>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 hover:bg-white/20 p-3 transition-colors"
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
          )}

          {/* Photo */}
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex]}
              alt={`${payload.name} - Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 hover:bg-white/20 p-3 transition-colors"
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          )}
        </motion.div>
      )}

      {/* Price Comparison Modal */}
      {card && card.type === 'hotel' && (
        <PriceComparisonModal
          isOpen={priceComparisonOpen}
          onClose={() => setPriceComparisonOpen(false)}
          hotelName={payload.name}
          location={payload.address || payload.city || payload.location || 'Unknown location'}
          checkIn={payload.amadeus_check_in || (() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
          })()}
          checkOut={payload.amadeus_check_out || (() => {
            const dayAfter = new Date();
            dayAfter.setDate(dayAfter.getDate() + 2);
            return dayAfter.toISOString().split('T')[0];
          })()}
          adults={2}
          propertyToken={payload.serpapi_property_token}
        />
      )}
    </AnimatePresence>
  );
}
