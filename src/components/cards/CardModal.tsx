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
  Utensils,
  Hotel,
  Activity,
  Wifi,
  Coffee,
  Info,
  Image as ImageIcon,
  Map as MapIcon,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapView } from '@/components/map/MapView';
import { PhotoGallery } from '@/components/gallery/PhotoGallery';
import { ReviewsPanel } from '@/components/reviews/ReviewsPanel';

interface CardModalProps {
  card: PlaceCard;
  onClose: () => void;
  onAddToTrip?: (card: PlaceCard) => void;
  onSave?: (card: PlaceCard) => void;
}

type TabType = 'overview' | 'photos' | 'map' | 'reviews';

export function CardModal({ card, onClose, onAddToTrip, onSave }: CardModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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


  // Mock reviews data (in production, fetch from API)
  const mockReviews = [
    {
      id: '1',
      author: 'Sarah Johnson',
      rating: 5,
      date: '2024-09-15',
      text: 'Absolutely amazing experience! The location was perfect, staff was incredibly friendly, and the amenities exceeded our expectations. Would definitely recommend to anyone visiting the area.',
      helpful_count: 24,
    },
    {
      id: '2',
      author: 'Michael Chen',
      rating: 4,
      date: '2024-08-22',
      text: 'Great place overall. Very clean and well-maintained. The only minor issue was the noise from the street, but otherwise perfect.',
      helpful_count: 12,
    },
    {
      id: '3',
      author: 'Emma Williams',
      rating: 5,
      date: '2024-07-10',
      text: 'This place is a hidden gem! Everything was exactly as described. The attention to detail was impressive.',
      helpful_count: 8,
    },
  ];

  // Tabs configuration
  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Info },
    { id: 'photos' as TabType, label: 'Photos', icon: ImageIcon, show: card.photos.length > 0 },
    { id: 'map' as TabType, label: 'Location', icon: MapIcon, show: !!card.coordinates },
    { id: 'reviews' as TabType, label: 'Reviews', icon: MessageSquare, show: !!card.rating },
  ].filter(tab => tab.show !== false);

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
          <div className="flex flex-col max-h-[90vh]">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 border-b border-border/50 p-6 bg-card/50">
              {/* Type Badge & Save Button */}
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary capitalize">
                  {getIcon()}
                  {card.type}
                </span>
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

              {/* Title */}
              <h2 className="text-3xl font-bold text-foreground mb-4">{card.name}</h2>

              {/* Rating, Reviews, Price */}
              <div className="flex flex-wrap items-center gap-4">
                {card.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-foreground">{card.rating.toFixed(1)}</span>
                    </div>
                    {card.review_count && (
                      <span className="text-sm text-muted-foreground">
                        {card.review_count.toLocaleString()} reviews
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex-shrink-0 border-b border-border/50 bg-background">
              <div className="flex gap-1 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-300 border-b-2',
                        activeTab === tab.id
                          ? 'text-primary border-primary'
                          : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Address */}
                  {card.address && (
                    <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                      <MapPin className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                      <p className="text-foreground/90">{card.address}</p>
                    </div>
                  )}

                  {/* Type-specific Details */}
                  <div className="space-y-4">
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

                    {/* Activity: Duration */}
                    {card.type === 'activity' && card.duration && (
                      <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{card.duration}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {card.description && (
                    <div>
                      <h3 className="mb-2 font-semibold text-foreground">About</h3>
                      <p className="text-foreground/80 leading-relaxed">{card.description}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'photos' && (
                <PhotoGallery photos={card.photos} placeName={card.name} />
              )}

              {activeTab === 'map' && card.coordinates && (
                <div className="space-y-4">
                  <MapView
                    places={[card]}
                    center={card.coordinates}
                    zoom={15}
                    height="500px"
                  />
                  {card.address && (
                    <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                      <MapPin className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                      <p className="text-foreground/90">{card.address}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <ReviewsPanel
                  reviews={mockReviews}
                  averageRating={card.rating || 0}
                  totalReviews={card.review_count || mockReviews.length}
                  ratingBreakdown={{
                    5: 45,
                    4: 30,
                    3: 15,
                    2: 7,
                    1: 3,
                  }}
                />
              )}
            </div>

            {/* Footer - Fixed */}
            <div className="flex-shrink-0 border-t border-border/50 p-6 bg-card/50">
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
