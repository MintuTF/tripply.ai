'use client';

import { useRef, useState, useEffect } from 'react';
import { Product, ProductRecommendation } from '@/types/marketplace';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorizontalProductRowProps {
  title: string;
  products: (Product | ProductRecommendation)[];
  itemsPerPage?: number;
}

export function HorizontalProductRow({
  title,
  products,
  itemsPerPage = 6,
}: HorizontalProductRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      // Calculate current page based on scroll position
      const cardWidth = 176; // 160px card + 16px gap
      const visibleCards = Math.floor(clientWidth / cardWidth);
      const currentFirstCard = Math.floor(scrollLeft / cardWidth);
      const newPage = Math.floor(currentFirstCard / visibleCards) + 1;
      setCurrentPage(Math.min(newPage, totalPages) || 1);
    }
  };

  useEffect(() => {
    checkScrollability();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        scrollElement.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [products.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.clientWidth;
      const scrollAmount = direction === 'left' ? -containerWidth : containerWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (products.length === 0) return null;

  return (
    <div className={title ? 'mb-6' : ''}>
      {/* Header - only show if title exists or has navigation */}
      {(title || totalPages > 1) && (
        <div className="flex items-center justify-between mb-3 px-1">
          {title ? (
            <h3 className="font-semibold text-base text-foreground">{title}</h3>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            {totalPages > 1 && (
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={cn(
                  'p-1 rounded-md border border-border/50 transition-all',
                  canScrollLeft
                    ? 'hover:bg-muted text-foreground'
                    : 'text-muted-foreground/30 cursor-not-allowed'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={cn(
                  'p-1 rounded-md border border-border/50 transition-all',
                  canScrollRight
                    ? 'hover:bg-muted text-foreground'
                    : 'text-muted-foreground/30 cursor-not-allowed'
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll Container */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
          }}
        >
          {products.map((product) => (
            <div key={product.id} className="scroll-snap-align-start">
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>

        {/* Left gradient fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        )}

        {/* Right gradient fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
