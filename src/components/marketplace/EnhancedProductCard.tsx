'use client';

import { useState } from 'react';
import { ProductRecommendation } from '@/types/marketplace';
import { Star, ChevronDown, ChevronUp, Check, ExternalLink, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { trackAffiliateClick } from '@/lib/marketplace/affiliateUtils';
import { useTripContext } from '@/context/TripContext';

interface EnhancedProductCardProps {
  product: ProductRecommendation;
  onViewDetails?: (product: ProductRecommendation) => void;
  savedToTrip?: boolean;
}

export function EnhancedProductCard({
  product,
  onViewDetails,
  savedToTrip = false
}: EnhancedProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [whyExpanded, setWhyExpanded] = useState(true); // Desktop: always expanded
  const [isAdding, setIsAdding] = useState(false);
  const [addedToTrip, setAddedToTrip] = useState(savedToTrip);

  const { addCard } = useTripContext();

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Format review count
  const formatReviewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Render stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < fullStars
              ? 'fill-yellow-400 text-yellow-400'
              : i === fullStars && hasHalfStar
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-gray-300'
          )}
        />
      );
    }
    return stars;
  };

  // Handle Add to Trip
  const handleAddToTrip = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (addedToTrip || !addCard) return;

    setIsAdding(true);

    // Add to trip context with complete ProductCard data
    addCard({
      type: 'product',
      payload_json: {
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        image: product.image,
        price: product.price,
        affiliateUrl: product.affiliateUrl,
        category: product.category,
        rating: product.rating,
        reviewCount: product.reviewCount,
        budgetTier: product.budgetTier,
        whyBullets: product.whyBullets,
        smartBadges: product.smartBadges,
        cost: product.price, // Default to price, user can update later
        currency: 'USD',
      },
      labels: [],
      favorite: false,
    });

    // Animate checkmark
    setTimeout(() => {
      setIsAdding(false);
      setAddedToTrip(true);
    }, 800);
  };

  // Handle View Details
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(product);
    } else {
      // Fallback: open affiliate link
      trackAffiliateClick(product.id, product.name);
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-xl border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all overflow-hidden"
      role="article"
      aria-label={`Product: ${product.name}`}
    >
      {/* Product Image with Smart Badges */}
      <div className="relative aspect-square bg-white overflow-hidden">
        {/* Image */}
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <span className="text-6xl">📦</span>
          </div>
        )}

        {/* Smart Badges Overlay (top-left) */}
        {product.smartBadges && product.smartBadges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {product.smartBadges.slice(0, 2).map((badge, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-sm shadow-md text-xs font-medium text-gray-800 border border-gray-100"
              >
                {badge}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Rating & Reviews */}
        {product.rating && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {renderStars(product.rating)}
            </div>
            <span className="text-xs text-gray-600">
              {product.rating.toFixed(1)}
            </span>
            {product.reviewCount && (
              <span className="text-xs text-gray-400">
                ({formatReviewCount(product.reviewCount)})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs text-gray-500">
            Prime eligible
          </span>
        </div>

        {/* WHY THIS IS USEFUL Section */}
        {product.whyBullets && product.whyBullets.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => setWhyExpanded(!whyExpanded)}
              className="w-full flex items-center justify-between text-left mb-2 lg:cursor-default marketplace-focus-visible"
              aria-expanded={whyExpanded}
              aria-controls={`why-section-${product.id}`}
              aria-label={`${whyExpanded ? 'Collapse' : 'Expand'} why this product is useful`}
            >
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                Why this is useful
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-purple-500 transition-transform lg:hidden',
                  whyExpanded && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence initial={false}>
              {whyExpanded && (
                <motion.ul
                  id={`why-section-${product.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  {product.whyBullets.slice(0, 3).map((bullet, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-2 text-xs text-gray-600"
                    >
                      <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>
                      <span className="leading-relaxed">{bullet}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {/* Add to Trip (Primary) */}
          <button
            onClick={handleAddToTrip}
            disabled={addedToTrip || isAdding}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all marketplace-focus-visible',
              addedToTrip
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-md hover:shadow-purple-200',
              isAdding && 'scale-95'
            )}
            aria-label={addedToTrip ? `${product.name} added to trip` : `Add ${product.name} to trip`}
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              {addedToTrip ? (
                <motion.div
                  key="added"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Added</span>
                </motion.div>
              ) : isAdding ? (
                <motion.div
                  key="adding"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                />
              ) : (
                <motion.div
                  key="add"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Trip</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* View Details (Secondary) */}
          <button
            onClick={handleViewDetails}
            className="flex-shrink-0 p-2.5 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-600 hover:text-purple-700 transition-all marketplace-focus-visible"
            aria-label={`View details for ${product.name}`}
            title="View details"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
