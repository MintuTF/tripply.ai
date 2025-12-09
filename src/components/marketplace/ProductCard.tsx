'use client';

import { useState } from 'react';
import { Product, ProductRecommendation } from '@/types/marketplace';
import { Star, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackAffiliateClick } from '@/lib/marketplace/affiliateUtils';

interface ProductCardProps {
  product: Product | ProductRecommendation;
  compact?: boolean;
}

export function ProductCard({ product, compact = true }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    trackAffiliateClick(product.id, product.name);
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const renderStars = (rating: number, small = false) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const size = small ? 'h-3 w-3' : 'h-3.5 w-3.5';

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={cn(
            size,
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatReviewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Compact Amazon-style card
  if (compact) {
    return (
      <div
        onClick={handleClick}
        className="group w-[160px] flex-shrink-0 cursor-pointer rounded-lg border border-border/30 bg-card p-2 transition-all hover:shadow-md hover:border-primary/30"
      >
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-white mb-2">
          {!imageError ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain p-2"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-3xl">📦</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xs font-medium line-clamp-2 mb-1 text-foreground group-hover:text-primary transition-colors leading-tight">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-0.5 mb-1">
            <div className="flex">{renderStars(product.rating, true)}</div>
            <span className="text-[10px] text-muted-foreground ml-0.5">
              {formatReviewCount(product.reviewCount || 0)}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Prime-style badge */}
        <div className="mt-1 flex items-center gap-1">
          <span className="text-[10px] text-blue-600 font-medium">prime</span>
          <span className="text-[10px] text-muted-foreground">FREE delivery</span>
        </div>
      </div>
    );
  }

  // Full-size card (legacy)
  return (
    <div className="group relative flex flex-col rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-4xl">📦</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">{renderStars(product.rating)}</div>
            <span className="text-xs text-muted-foreground">
              ({formatReviewCount(product.reviewCount || 0)})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleClick}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-md active:scale-[0.98]"
        >
          View on Amazon
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
