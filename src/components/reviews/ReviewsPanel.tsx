'use client';

import { useState } from 'react';
import { Star, ThumbsUp, MessageCircle, Filter, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  text: string;
  helpful_count?: number;
  photos?: string[];
}

interface ReviewsPanelProps {
  reviews: Review[];
  averageRating?: number;
  totalReviews?: number;
  ratingBreakdown?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export function ReviewsPanel({
  reviews,
  averageRating = 0,
  totalReviews = 0,
  ratingBreakdown
}: ReviewsPanelProps) {
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  // Filter and sort reviews
  const filteredAndSortedReviews = reviews
    .filter(review => filterRating === null || review.rating === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'helpful':
          return (b.helpful_count || 0) - (a.helpful_count || 0);
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  const toggleReviewExpanded = (reviewId: string) => {
    const newSet = new Set(expandedReviews);
    if (newSet.has(reviewId)) {
      newSet.delete(reviewId);
    } else {
      newSet.add(reviewId);
    }
    setExpandedReviews(newSet);
  };

  // Calculate rating distribution percentages
  const getRatingPercentage = (rating: number) => {
    if (!ratingBreakdown || totalReviews === 0) return 0;
    return Math.round((ratingBreakdown[rating as keyof typeof ratingBreakdown] / totalReviews) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Average Rating */}
        <div className="bg-card/50 rounded-xl p-6 border border-border/50">
          <div className="text-center">
            <div className="text-5xl font-bold text-foreground mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 ${
                    i < Math.floor(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on {totalReviews.toLocaleString()} reviews
            </p>
          </div>
        </div>

        {/* Rating Breakdown */}
        {ratingBreakdown && (
          <div className="bg-card/50 rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold text-foreground mb-4">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    filterRating === rating
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <span className="text-sm font-medium w-12">{rating} star</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${getRatingPercentage(rating)}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {getRatingPercentage(rating)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating">Highest Rating</option>
          </select>
        </div>

        {filterRating && (
          <button
            onClick={() => setFilterRating(null)}
            className="text-sm text-primary hover:underline"
          >
            Clear filter
          </button>
        )}

        <div className="ml-auto text-sm text-muted-foreground">
          Showing {filteredAndSortedReviews.length} of {reviews.length} reviews
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedReviews.map((review) => {
            const isExpanded = expandedReviews.has(review.id);
            const isLongReview = review.text.length > 300;
            const displayText = isExpanded || !isLongReview
              ? review.text
              : review.text.slice(0, 300) + '...';

            return (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card rounded-xl p-6 border border-border/50"
              >
                {/* Review Header */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {review.avatar ? (
                      <img
                        src={review.avatar}
                        alt={review.author}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      review.author.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate">
                        {review.author}
                      </h4>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(review.date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap">
                  {displayText}
                </p>

                {/* Read More Toggle */}
                {isLongReview && (
                  <button
                    onClick={() => toggleReviewExpanded(review.id)}
                    className="text-sm text-primary hover:underline font-medium mb-4"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}

                {/* Review Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto">
                    {review.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        className="h-24 w-24 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </div>
                )}

                {/* Review Footer */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <button className="flex items-center gap-2 hover:text-primary transition-colors">
                    <ThumbsUp className="h-4 w-4" />
                    <span>Helpful {review.helpful_count ? `(${review.helpful_count})` : ''}</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-primary transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    <span>Reply</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredAndSortedReviews.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No reviews match your filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
