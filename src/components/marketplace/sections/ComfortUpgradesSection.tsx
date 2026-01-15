'use client';

import { useState } from 'react';
import { ProductRecommendation } from '@/types/marketplace';
import { EnhancedProductCard } from '../EnhancedProductCard';
import { ProductDetailModal } from '../ProductDetailModal';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ComfortUpgradesSectionProps {
  products: ProductRecommendation[];
  savedProductIds?: Set<string>;
}

export function ComfortUpgradesSection({
  products,
  savedProductIds = new Set()
}: ComfortUpgradesSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductRecommendation | null>(null);

  if (products.length === 0) {
    return null;
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Comfort Upgrades
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Optional · Comfort focused
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Enhance your travel experience with these premium comfort items
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.slice(0, 6).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
            >
              <EnhancedProductCard
                product={product}
                onViewDetails={setSelectedProduct}
                savedToTrip={savedProductIds.has(product.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Optional helper text */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">
                These items aren't essential, but they can significantly improve your comfort
                during travel. Consider adding them if you want to elevate your experience.
              </p>
            </div>
          </div>
        </div>
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
