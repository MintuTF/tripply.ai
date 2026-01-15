'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronDown, ChevronUp, User, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
}

interface ReviewsSectionProps {
  placeId: string;
  placeName: string;
  initialRating?: number;
  initialReviewCount?: number;
}

export function ReviewsSection({
  placeId,
  placeName,
  initialRating = 0,
  initialReviewCount = 0,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (expanded && reviews.length === 0) {
      fetchReviews();
    }
  }, [expanded]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/travel/place/${placeId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.place?.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-4 h-4',
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="border-t border-gray-100 pt-6">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">Reviews</h4>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-medium">{initialRating.toFixed(1)}</span>
              </div>
              <span>•</span>
              <span>{initialReviewCount.toLocaleString()} reviews</span>
            </div>
          </div>
        </div>
        <div className={cn(
          'w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors',
          'group-hover:bg-gray-200'
        )}>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No reviews available
                </p>
              ) : (
                <>
                  {/* Reviews List */}
                  <div className="space-y-4">
                    {displayedReviews.map((review, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-4"
                      >
                        {/* Review Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {review.authorName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {review.relativeTime}
                              </p>
                            </div>
                          </div>
                          {renderStars(review.rating)}
                        </div>

                        {/* Review Text */}
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {review.text.length > 200 && !showAll
                            ? `${review.text.slice(0, 200)}...`
                            : review.text}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Show More Button */}
                  {reviews.length > 3 && (
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="w-full py-3 text-center text-purple-600 font-medium hover:bg-purple-50 rounded-xl transition-colors"
                    >
                      {showAll
                        ? 'Show less'
                        : `Show all ${reviews.length} reviews`}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
