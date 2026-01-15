'use client';

import { useState } from 'react';
import { ProductRecommendation } from '@/types/marketplace';
import { X, Star, ExternalLink, Check, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { trackAffiliateClick } from '@/lib/marketplace/affiliateUtils';
import { useTripContext } from '@/context/TripContext';

interface ProductDetailModalProps {
  product: ProductRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  savedToTrip?: boolean;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  savedToTrip = false
}: ProductDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addedToTrip, setAddedToTrip] = useState(savedToTrip);

  const { addCard } = useTripContext();

  if (!product) return null;

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
            'h-4 w-4',
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
  const handleAddToTrip = async () => {
    if (addedToTrip || !addCard) return;

    setIsAdding(true);

    // Add to trip context
    addCard({
      type: 'product',
      payload_json: {
        product_id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        affiliateUrl: product.affiliateUrl,
        category: product.category,
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

  // Handle Amazon link
  const handleViewOnAmazon = () => {
    trackAffiliateClick(product.id, product.name);
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Content */}
              <div className="grid md:grid-cols-2 gap-6 p-6">
                {/* Left: Image & Badges */}
                <div className="space-y-4">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {!imageError ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-6"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <span className="text-8xl">📦</span>
                      </div>
                    )}

                    {/* Smart Badges */}
                    {product.smartBadges && product.smartBadges.length > 0 && (
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.smartBadges.map((badge, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm shadow-md text-sm font-medium text-gray-800 border border-gray-100"
                          >
                            {badge}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category & Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                      {product.category}
                    </span>
                    {product.tags?.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Product Details */}
                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                      {product.name}
                    </h2>
                  </div>

                  {/* Rating & Reviews */}
                  {product.rating && (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {renderStars(product.rating)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {product.rating.toFixed(1)}
                      </span>
                      {product.reviewCount && (
                        <span className="text-sm text-gray-500">
                          ({formatReviewCount(product.reviewCount)} reviews)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Prime eligible
                    </span>
                  </div>

                  {/* Actions - Moved to top */}
                  <div className="space-y-3 pt-2">
                    {/* Add to Trip */}
                    <button
                      onClick={handleAddToTrip}
                      disabled={addedToTrip || isAdding}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all',
                        addedToTrip
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-200',
                        isAdding && 'scale-95'
                      )}
                    >
                      <AnimatePresence mode="wait">
                        {addedToTrip ? (
                          <motion.div
                            key="added"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-2"
                          >
                            <Check className="w-5 h-5" />
                            <span>Added to Your Trip</span>
                          </motion.div>
                        ) : isAdding ? (
                          <motion.div
                            key="adding"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                          />
                        ) : (
                          <motion.div
                            key="add"
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-5 h-5" />
                            <span>Add to Trip</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>

                    {/* View on Amazon */}
                    <button
                      onClick={handleViewOnAmazon}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>View on Amazon</span>
                    </button>
                  </div>

                  {/* WHY Section */}
                  {product.whyBullets && product.whyBullets.length > 0 && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                      <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-3">
                        Why this is useful for your trip
                      </h3>
                      <ul className="space-y-2">
                        {product.whyBullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>
                            <span className="leading-relaxed">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Description */}
                  {product.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Product Description
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {/* Footer note */}
                  <p className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100">
                    Prices may vary. Clicking will open Amazon in a new tab.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
