'use client';

import { useState } from 'react';
import { ShoppingBag, X, ChevronDown, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTripContext } from '@/context/TripContext';
import { ProductCard as ProductCardType } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function FloatingProductCart() {
  const [isOpen, setIsOpen] = useState(false);
  const { cards, deleteCard } = useTripContext();
  const params = useParams();
  const citySlug = params?.citySlug as string;

  // Filter only product cards and ensure unique IDs
  const productCards = cards
    .filter((card) => card.type === 'product')
    .filter((card, index, self) =>
      index === self.findIndex((c) => c.id === card.id)
    );
  const productCount = productCards.length;

  // Calculate total price
  const totalPrice = productCards.reduce((sum, card) => {
    const payload = card.payload_json as ProductCardType;
    return sum + (payload.price || 0);
  }, 0);

  // Don't show if no products
  if (productCount === 0) {
    return null;
  }

  const handleRemoveProduct = (cardId: string) => {
    deleteCard(cardId);
  };

  return (
    <div className="fixed top-20 right-2 md:right-6 z-[45]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute top-14 right-0 w-[95vw] max-w-sm md:w-80',
              'bg-white dark:bg-gray-900 rounded-2xl',
              'border border-gray-200 dark:border-gray-700',
              'shadow-2xl overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-purple-600" />
                  Your Cart
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {productCount} item{productCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Product List */}
            <div className="overflow-y-auto max-h-[50vh] md:max-h-72 divide-y divide-gray-100 dark:divide-gray-800">
              {productCards.map((card, index) => {
                const product = card.payload_json as ProductCardType;
                return (
                  <div
                    key={card.id || `product-${index}`}
                    className="p-3 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {product.name}
                      </h4>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                        ${product.price?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveProduct(card.id)}
                      className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <Link
                href={citySlug ? `/travel/${citySlug}/board` : '/trips'}
                className={cn(
                  'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl',
                  'bg-gradient-to-r from-purple-600 to-pink-600',
                  'text-white text-sm font-medium',
                  'hover:shadow-lg hover:shadow-purple-300/50 transition-shadow'
                )}
              >
                <ExternalLink className="w-4 h-4" />
                View All on Board
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full',
          'bg-gradient-to-r from-purple-600 to-pink-600',
          'text-white shadow-lg shadow-purple-300/50',
          'hover:shadow-xl hover:shadow-purple-400/50',
          'transition-shadow duration-300'
        )}
      >
        <div className="relative">
          <ShoppingBag className="h-5 w-5" />
          <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-white text-purple-600 text-xs font-bold shadow-sm">
            {productCount > 9 ? '9+' : productCount}
          </span>
        </div>
        {isOpen && (
          <ChevronDown className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 text-white/70" />
        )}
      </motion.button>
    </div>
  );
}
