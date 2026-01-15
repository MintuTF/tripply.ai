'use client';

import { useState, useMemo } from 'react';
import { Card, ProductCard } from '@/types';
import { PackageOpen, ExternalLink, Trash2, ShoppingBag, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProductsBoardProps {
  tripId: string;
  cards: Card[];
  onCardDelete?: (cardId: string) => void;
}

interface ProductWithCard {
  card: Card;
  product: ProductCard;
}

/**
 * ProductsBoard - Display and manage shopping list for trip
 * Shows all product cards saved to the trip, organized by category
 */
export function ProductsBoard({ tripId, cards, onCardDelete }: ProductsBoardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter only product cards
  const productCards = useMemo(() => {
    return cards
      .filter((card) => card.type === 'product')
      .map((card) => ({
        card,
        product: card.payload_json as ProductCard,
      }));
  }, [cards]);

  // Group by category
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, ProductWithCard[]> = {};

    productCards.forEach((item) => {
      const category = item.product.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  }, [productCards]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return productCards.reduce((sum, item) => sum + (item.product.cost || item.product.price), 0);
  }, [productCards]);

  // Empty state
  if (productCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No products added yet
        </h3>
        <p className="text-sm text-gray-500 max-w-md">
          Browse the marketplace to find travel gear and essentials for your trip.
          Added products will appear here in your shopping list.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Shopping List
            </h2>
          </div>
          <p className="text-sm text-gray-600">
            {productCards.length} {productCards.length === 1 ? 'item' : 'items'} in your list
          </p>
        </div>

        {/* Total Price */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl px-6 py-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">
              Estimated Total
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${totalPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Products by Category */}
      <div className="space-y-8">
        {Object.entries(productsByCategory).map(([category, items]) => (
          <div key={category} className="space-y-4">
            {/* Category Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <PackageOpen className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {category}
              </h3>
              <span className="text-sm text-gray-500">
                ({items.length} {items.length === 1 ? 'item' : 'items'})
              </span>
            </div>

            {/* Product Grid */}
            <div className={cn(
              'grid gap-4',
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              <AnimatePresence>
                {items.map(({ card, product }) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-video bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.smartBadges && product.smartBadges.length > 0 && (
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                          {product.smartBadges.slice(0, 2).map((badge, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm text-gray-700 border border-gray-200 shadow-sm"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-3">
                      {/* Name & Rating */}
                      <div>
                        <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                          {product.name}
                        </h4>
                        {product.rating && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              <span>{product.rating.toFixed(1)}</span>
                            </div>
                            {product.reviewCount && (
                              <span className="text-gray-400">({product.reviewCount})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* WHY Bullets */}
                      {product.whyBullets && product.whyBullets.length > 0 && (
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                          <p className="text-xs font-medium text-purple-900 mb-1.5">
                            WHY THIS IS USEFUL:
                          </p>
                          <ul className="space-y-1">
                            {product.whyBullets.slice(0, 2).map((bullet, idx) => (
                              <li key={idx} className="text-xs text-purple-700 leading-relaxed">
                                • {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Price & Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            ${(product.cost || product.price).toFixed(2)}
                          </div>
                          {product.budgetTier && (
                            <div className="text-xs text-gray-500 capitalize">
                              {product.budgetTier === 'mid-range' ? 'Value' : product.budgetTier}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* View on Amazon */}
                          <a
                            href={product.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium hover:shadow-md transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View</span>
                          </a>

                          {/* Remove */}
                          {onCardDelete && (
                            <button
                              onClick={() => onCardDelete(card.id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Remove from list"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Helper */}
      <div className="mt-12 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Ready to purchase?
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              Click "View" on any product to open it on Amazon. Prices shown are estimates
              and may vary. This list helps you stay organized and not forget essentials.
            </p>
            <p className="text-xs text-gray-500">
              💡 Tip: Most travelers save 10-15% by comparing prices across different sellers
              on Amazon before purchasing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
