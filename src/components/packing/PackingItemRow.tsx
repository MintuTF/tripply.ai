'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PackingItem } from '@/types/packing';
import { generateAffiliateUrl } from '@/lib/marketplace/affiliateUtils';

interface PackingItemRowProps {
  item: PackingItem;
  onTogglePacked: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export function PackingItemRow({
  item,
  onTogglePacked,
  onUpdateQuantity,
  onRemoveItem,
}: PackingItemRowProps) {
  const [showProduct, setShowProduct] = useState(false);

  const hasProduct = !!item.linkedProduct;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'group rounded-xl border transition-all',
        item.isPacked
          ? 'bg-muted/50 border-muted'
          : 'bg-card border-border hover:border-primary/30'
      )}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Checkbox */}
        <button
          onClick={() => onTogglePacked(item.id)}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all flex-shrink-0',
            item.isPacked
              ? 'bg-primary border-primary'
              : 'border-muted-foreground/30 hover:border-primary'
          )}
        >
          {item.isPacked && <Check className="h-4 w-4 text-white" />}
        </button>

        {/* Item info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-medium transition-all',
                item.isPacked && 'line-through text-muted-foreground'
              )}
            >
              {item.name}
            </span>
            {item.isEssential && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                Essential
              </span>
            )}
          </div>
          {item.aiReason && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              {item.aiReason}
            </div>
          )}
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Shop button */}
        {hasProduct && (
          <button
            onClick={() => setShowProduct(!showProduct)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all',
              showProduct
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Shop</span>
            {showProduct ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {/* Delete button */}
        <button
          onClick={() => onRemoveItem(item.id)}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Product card (expanded) */}
      {hasProduct && showProduct && item.linkedProduct && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border"
        >
          <div className="p-3 bg-accent/30">
            <div className="flex gap-3">
              {item.linkedProduct.image && (
                <img
                  src={item.linkedProduct.image}
                  alt={item.linkedProduct.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.linkedProduct.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium">{item.linkedProduct.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({item.linkedProduct.reviewCount.toLocaleString()} reviews)
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-primary">
                    ${item.linkedProduct.price.toFixed(2)}
                  </span>
                  <a
                    href={generateAffiliateUrl(item.linkedProduct.affiliateUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Buy on Amazon
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
