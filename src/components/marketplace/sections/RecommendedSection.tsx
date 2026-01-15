'use client';

import { useState } from 'react';
import { ProductRecommendation, TripContextSummary } from '@/types/marketplace';
import { EnhancedProductCard } from '../EnhancedProductCard';
import { ProductDetailModal } from '../ProductDetailModal';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecommendedSectionProps {
  products: ProductRecommendation[];
  tripSummary?: TripContextSummary | null;
  savedProductIds?: Set<string>;
}

export function RecommendedSection({
  products,
  tripSummary,
  savedProductIds = new Set()
}: RecommendedSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductRecommendation | null>(null);

  // Generate dynamic subtext based on trip context
  const getSubtext = () => {
    if (!tripSummary) {
      return 'Based on popular travel essentials';
    }

    const reasons: string[] = [];

    // Weather-based
    if (tripSummary.season === 'Winter') {
      reasons.push('Cold weather conditions');
    } else if (tripSummary.season === 'Summer') {
      reasons.push('Hot weather protection');
    }

    // Duration-based
    if (tripSummary.duration <= 3) {
      reasons.push('Short trip essentials');
    } else if (tripSummary.duration >= 7) {
      reasons.push('Extended stay preparation');
    }

    // Party-based
    if (tripSummary.travelers.toLowerCase().includes('family')) {
      reasons.push('Family travel needs');
    } else if (tripSummary.travelers.toLowerCase().includes('couple')) {
      reasons.push('Couples travel comfort');
    }

    // Destination-based
    if (tripSummary.destination) {
      reasons.push(`Perfect for ${tripSummary.destination}`);
    }

    return reasons.length > 0
      ? `Why these are suggested: ${reasons.slice(0, 3).join(' • ')}`
      : 'Personalized for your trip';
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              Recommended for Your Trip
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {getSubtext()}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.slice(0, 9).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <EnhancedProductCard
                product={product}
                onViewDetails={setSelectedProduct}
                savedToTrip={savedProductIds.has(product.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Show more indicator */}
        {products.length > 9 && (
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Showing top {Math.min(9, products.length)} of {products.length} recommendations
            </p>
          </div>
        )}
      </motion.section>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        savedToTrip={selectedProduct ? savedProductIds.has(selectedProduct.id) : false}
      />
    </>
  );
}
