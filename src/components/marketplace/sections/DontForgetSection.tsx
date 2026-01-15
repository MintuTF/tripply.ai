'use client';

import { useState } from 'react';
import { ProductRecommendation } from '@/types/marketplace';
import { EnhancedProductCard } from '../EnhancedProductCard';
import { ProductDetailModal } from '../ProductDetailModal';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DontForgetSectionProps {
  products: ProductRecommendation[];
  savedProductIds?: Set<string>;
}

export function DontForgetSection({
  products,
  savedProductIds = new Set()
}: DontForgetSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductRecommendation | null>(null);

  if (products.length === 0) {
    return null;
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Don't Forget These
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Commonly overlooked essentials that travelers often forget
          </p>
        </div>

        {/* Product Grid - More compact */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {products.slice(0, 6).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <EnhancedProductCard
                product={product}
                onViewDetails={setSelectedProduct}
                savedToTrip={savedProductIds.has(product.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Helper text */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-orange-900 font-medium mb-1">
                Essential checklist items
              </p>
              <p className="text-xs text-orange-700 leading-relaxed">
                These items are frequently forgotten but can make or break your trip.
                Add them to your packing list to stay prepared.
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
