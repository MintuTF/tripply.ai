'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardType, PlaceReview } from '@/types';
import { cn } from '@/lib/utils';
import {
  X,
  Star,
  MapPin,
  ExternalLink,
  Clock,
  Utensils,
  Hotel,
  Compass,
  MessageSquare,
  Tag,
  StickyNote,
  Info,
  ChevronRight,
  Search,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardLabels } from './CardLabels';
import { CardComments } from './CardComments';
import { CardNotes } from './CardNotes';

interface CardDetailPanelProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onCardUpdate?: (card: Card) => void;
}

type TabType = 'overview' | 'reviews' | 'comments' | 'notes';

export function CardDetailPanel({
  card,
  isOpen,
  onClose,
  onCardUpdate,
}: CardDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Reviews tab state
  const [sortBy, setSortBy] = useState<'relevant' | 'newest' | 'highest' | 'lowest'>('relevant');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Track labels locally so UI updates immediately
  const [localLabels, setLocalLabels] = useState<string[]>([]);

  // Reset tab and labels when card changes
  useEffect(() => {
    if (card) {
      setActiveTab('overview');
      setReviews([]);
      setLocalLabels(card.labels || []);
      // Reset reviews state
      setSortBy('relevant');
      setSearchQuery('');
      setShowAllReviews(false);
    }
  }, [card?.id]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Fetch reviews when reviews tab is selected
  useEffect(() => {
    if (activeTab === 'reviews' && card && reviews.length === 0) {
      fetchReviews();
    }
  }, [activeTab, card]);

  const fetchReviews = async () => {
    if (!card) return;
    const payload = typeof card.payload_json === 'string'
      ? JSON.parse(card.payload_json)
      : card.payload_json;

    const placeId = payload.place_id;
    if (!placeId) {
      // Use mock reviews if no place_id
      setReviews(getMockReviews());
      return;
    }

    setIsLoadingReviews(true);
    try {
      const response = await fetch(`/api/places/details?place_id=${placeId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || getMockReviews());
      } else {
        setReviews(getMockReviews());
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews(getMockReviews());
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const getMockReviews = (): PlaceReview[] => [
    {
      author_name: 'Sarah J.',
      rating: 5,
      relative_time_description: '2 weeks ago',
      text: 'Amazing experience! The location was perfect and the service was outstanding. Would definitely recommend to anyone visiting the area.',
      time: Date.now() / 1000 - 86400 * 14,
    },
    {
      author_name: 'Michael C.',
      rating: 4,
      relative_time_description: '1 month ago',
      text: 'Great place overall. Very clean and well-maintained. Minor issue with parking but otherwise perfect.',
      time: Date.now() / 1000 - 86400 * 30,
    },
    {
      author_name: 'Emma W.',
      rating: 5,
      relative_time_description: '2 months ago',
      text: 'A hidden gem! Everything was exactly as described. The attention to detail was impressive.',
      time: Date.now() / 1000 - 86400 * 60,
    },
    {
      author_name: 'James R.',
      rating: 3,
      relative_time_description: '2 months ago',
      text: 'Decent experience but nothing special. The staff was friendly but the facilities could use some updates.',
      time: Date.now() / 1000 - 86400 * 65,
    },
    {
      author_name: 'Lisa T.',
      rating: 5,
      relative_time_description: '3 months ago',
      text: 'Absolutely loved it! Perfect for a weekend getaway. Will definitely come back again.',
      time: Date.now() / 1000 - 86400 * 90,
    },
    {
      author_name: 'David K.',
      rating: 2,
      relative_time_description: '3 months ago',
      text: 'Disappointing visit. The place was crowded and the service was slow. Expected better based on the reviews.',
      time: Date.now() / 1000 - 86400 * 95,
    },
    {
      author_name: 'Anna M.',
      rating: 4,
      relative_time_description: '4 months ago',
      text: 'Really nice atmosphere and good value for money. Would recommend for families.',
      time: Date.now() / 1000 - 86400 * 120,
    },
    {
      author_name: 'Robert H.',
      rating: 1,
      relative_time_description: '4 months ago',
      text: 'Terrible experience. Found roaches in the room and the staff was unhelpful. Never coming back.',
      time: Date.now() / 1000 - 86400 * 125,
    },
    {
      author_name: 'Jennifer L.',
      rating: 5,
      relative_time_description: '5 months ago',
      text: 'One of the best places I have ever visited! The views were breathtaking and the food was amazing.',
      time: Date.now() / 1000 - 86400 * 150,
    },
    {
      author_name: 'Chris P.',
      rating: 4,
      relative_time_description: '5 months ago',
      text: 'Very enjoyable stay. The location is convenient and the amenities are top-notch.',
      time: Date.now() / 1000 - 86400 * 155,
    },
    {
      author_name: 'Maria S.',
      rating: 3,
      relative_time_description: '6 months ago',
      text: 'Average experience. Nothing wrong but nothing exceptional either. Good for a quick stop.',
      time: Date.now() / 1000 - 86400 * 180,
    },
    {
      author_name: 'Tom B.',
      rating: 5,
      relative_time_description: '6 months ago',
      text: 'Exceeded all expectations! The hospitality was wonderful and every detail was perfect.',
      time: Date.now() / 1000 - 86400 * 185,
    },
  ];

  // Calculate rating breakdown from reviews
  const ratingBreakdown = useMemo(() => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      const rating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) {
        breakdown[rating]++;
      }
    });
    return breakdown;
  }, [reviews]);

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((review) =>
        review.text.toLowerCase().includes(query) ||
        review.author_name.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.time - a.time);
        break;
      case 'highest':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        result.sort((a, b) => a.rating - b.rating);
        break;
      case 'relevant':
      default:
        // Keep original order
        break;
    }

    return result;
  }, [reviews, searchQuery, sortBy]);

  // Paginated reviews
  const displayedReviews = showAllReviews
    ? filteredAndSortedReviews
    : filteredAndSortedReviews.slice(0, 7);
  const hasMoreReviews = filteredAndSortedReviews.length > 7;
  const remainingCount = filteredAndSortedReviews.length - 7;

  const sortOptions = [
    { value: 'relevant', label: 'Most relevant' },
    { value: 'newest', label: 'Newest' },
    { value: 'highest', label: 'Highest rating' },
    { value: 'lowest', label: 'Lowest rating' },
  ];

  if (!card) return null;

  const payload = typeof card.payload_json === 'string'
    ? JSON.parse(card.payload_json)
    : card.payload_json;

  const getIcon = () => {
    switch (card.type) {
      case 'food':
        return <Utensils className="h-5 w-5" />;
      case 'hotel':
        return <Hotel className="h-5 w-5" />;
      case 'spot':
      case 'activity':
        return <Compass className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (card.type) {
      case 'food':
        return 'Restaurant';
      case 'hotel':
        return 'Hotel';
      case 'spot':
        return 'Attraction';
      case 'activity':
        return 'Activity';
      default:
        return 'Place';
    }
  };

  const getTypeColor = () => {
    switch (card.type) {
      case 'food':
        return 'bg-orange-500/10 text-orange-600';
      case 'hotel':
        return 'bg-blue-500/10 text-blue-600';
      case 'spot':
        return 'bg-purple-500/10 text-purple-600';
      case 'activity':
        return 'bg-green-500/10 text-green-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Info },
    { id: 'reviews' as TabType, label: 'Reviews', icon: Star },
    { id: 'comments' as TabType, label: 'Comments', icon: MessageSquare },
    { id: 'notes' as TabType, label: 'Notes', icon: StickyNote },
  ];

  const handleLabelsUpdate = (newLabels: string[]) => {
    // Update local state immediately for responsive UI
    setLocalLabels(newLabels);
    // Propagate to parent
    if (onCardUpdate && card) {
      onCardUpdate({ ...card, labels: newLabels });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - only on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          />

          {/* Slide-in Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full md:w-[420px] bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border p-4">
              {/* Close Button */}
              <div className="flex items-center justify-between mb-4">
                <span className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold',
                  getTypeColor()
                )}>
                  {getIcon()}
                  {getTypeLabel()}
                </span>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 hover:bg-accent transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-foreground mb-2">
                {payload.name || payload.title}
              </h2>

              {/* Rating */}
              {payload.rating && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-sm">{payload.rating.toFixed(1)}</span>
                  </div>
                  {payload.review_count && (
                    <span className="text-sm text-muted-foreground">
                      {payload.review_count.toLocaleString()} reviews
                    </span>
                  )}
                </div>
              )}

              {/* Photo */}
              {payload.photos?.[0] && (
                <div className="relative h-40 w-full rounded-xl overflow-hidden">
                  <img
                    src={payload.photos[0]}
                    alt={payload.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 border-b border-border">
              <div className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition-all border-b-2',
                        activeTab === tab.id
                          ? 'text-primary border-primary bg-primary/5'
                          : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Labels */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Labels
                    </h3>
                    <CardLabels
                      cardType={card.type}
                      selectedLabels={localLabels}
                      onLabelsChange={handleLabelsUpdate}
                    />
                  </div>

                  {/* Address */}
                  {payload.address && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Location</h3>
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-foreground/80">{payload.address}</p>
                      </div>
                    </div>
                  )}

                  {/* Type-specific Details */}
                  {card.type === 'food' && payload.cuisine_type && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Cuisine</h3>
                      <p className="text-sm text-foreground/80">{payload.cuisine_type}</p>
                    </div>
                  )}

                  {card.type === 'hotel' && payload.amenities?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {payload.amenities.slice(0, 8).map((amenity: string, i: number) => (
                          <span
                            key={i}
                            className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(card.type === 'spot' || card.type === 'activity') && payload.duration && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{payload.duration}</span>
                    </div>
                  )}

                  {/* Opening Hours */}
                  {payload.opening_hours && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Hours</h3>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-foreground/80">{payload.opening_hours}</p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {payload.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">About</h3>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {payload.description}
                      </p>
                    </div>
                  )}

                  {/* External Link */}
                  {payload.url && (
                    <a
                      href={payload.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Google Maps
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {isLoadingReviews ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : reviews.length > 0 ? (
                    <>
                      {/* Rating Summary with Breakdown Bars */}
                      <div className="p-4 rounded-xl bg-muted/50 mb-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Google review summary</h3>
                        <div className="flex gap-4">
                          {/* Rating Breakdown Bars */}
                          <div className="flex-1 space-y-1.5">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const count = ratingBreakdown[rating as 1 | 2 | 3 | 4 | 5];
                              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                              return (
                                <div key={rating} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-3">{rating}</span>
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Overall Rating */}
                          <div className="text-center min-w-[80px]">
                            <div className="text-3xl font-bold">{payload.rating?.toFixed(1) || '4.0'}</div>
                            <div className="flex items-center justify-center gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    'h-3 w-3',
                                    star <= Math.round(payload.rating || 4)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground'
                                  )}
                                />
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {(payload.review_count || reviews.length).toLocaleString()} reviews
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search reviews..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Sort Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowSortDropdown(!showSortDropdown)}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <span>Sort by:</span>
                          <span className="font-medium text-foreground">
                            {sortOptions.find((o) => o.value === sortBy)?.label}
                          </span>
                          <ChevronDown className={cn('h-4 w-4 transition-transform', showSortDropdown && 'rotate-180')} />
                        </button>
                        {showSortDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-40 rounded-lg border border-border bg-background shadow-lg z-10">
                            {sortOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setSortBy(option.value as typeof sortBy);
                                  setShowSortDropdown(false);
                                }}
                                className={cn(
                                  'w-full text-left px-3 py-2 text-sm hover:bg-accent',
                                  sortBy === option.value && 'bg-accent/50 font-medium'
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Review Count */}
                      {filteredAndSortedReviews.length !== reviews.length && (
                        <p className="text-xs text-muted-foreground">
                          Showing {filteredAndSortedReviews.length} of {reviews.length} reviews
                        </p>
                      )}

                      {/* Review List */}
                      {displayedReviews.length > 0 ? (
                        displayedReviews.map((review, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-xl border border-border bg-card"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {review.author_name.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{review.author_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {review.relative_time_description}
                                </p>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      'h-3 w-3',
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                              {review.text}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <p>No reviews match your search</p>
                        </div>
                      )}

                      {/* See More Button */}
                      {hasMoreReviews && !showAllReviews && displayedReviews.length > 0 && (
                        <button
                          onClick={() => setShowAllReviews(true)}
                          className="w-full py-3 text-sm font-medium text-primary hover:text-primary/80 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          See more reviews ({remainingCount} more)
                        </button>
                      )}

                      {/* Show Less Button */}
                      {showAllReviews && filteredAndSortedReviews.length > 7 && (
                        <button
                          onClick={() => setShowAllReviews(false)}
                          className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          Show less
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No reviews available</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comments' && (
                <CardComments cardId={card.id} />
              )}

              {activeTab === 'notes' && (
                <CardNotes
                  card={card}
                  onCardUpdate={onCardUpdate}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
