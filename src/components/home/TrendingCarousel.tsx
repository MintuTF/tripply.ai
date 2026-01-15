'use client';

import { useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { DestinationCard, type Destination } from './DestinationCard';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/adsense/config';
import { cn } from '@/lib/utils';

const TRENDING_DESTINATIONS: Destination[] = [
  {
    id: '1',
    name: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    rating: 4.9,
    trending: 24,
    tags: ['Culture', 'Food'],
  },
  {
    id: '2',
    name: 'Bali',
    country: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    rating: 4.8,
    trending: 18,
    tags: ['Beach', 'Nature'],
  },
  {
    id: '3',
    name: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    rating: 4.8,
    trending: 15,
    tags: ['Romance', 'Art'],
  },
  {
    id: '4',
    name: 'Iceland',
    country: 'Nordic',
    image: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&q=80',
    rating: 4.9,
    trending: 12,
    tags: ['Nature', 'Adventure'],
  },
  {
    id: '5',
    name: 'Dubai',
    country: 'UAE',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
    rating: 4.7,
    trending: 10,
    tags: ['Luxury', 'Modern'],
  },
  {
    id: '6',
    name: 'Santorini',
    country: 'Greece',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
    rating: 4.9,
    trending: 9,
    tags: ['Romance', 'Beach'],
  },
  {
    id: '7',
    name: 'New York',
    country: 'USA',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
    rating: 4.7,
    trending: 8,
    tags: ['City', 'Culture'],
  },
  {
    id: '8',
    name: 'Maldives',
    country: 'South Asia',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
    rating: 4.9,
    trending: 7,
    tags: ['Beach', 'Luxury'],
  },
];

interface TrendingCarouselProps {
  className?: string;
}

export function TrendingCarousel({ className }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Inject ads into carousel items every 6 destinations
  const carouselItems = useMemo(() => {
    const items: Array<{ type: 'destination' | 'ad'; data?: Destination; id: string }> = [];

    TRENDING_DESTINATIONS.forEach((dest, index) => {
      items.push({ type: 'destination', data: dest, id: dest.id });

      // Insert ad after every 6th destination
      if ((index + 1) % 6 === 0 && index < TRENDING_DESTINATIONS.length - 1) {
        items.push({ type: 'ad', id: `ad-${index}` });
      }
    });

    return items;
  }, []);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className={cn('py-20 bg-background', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-orange-500 text-sm font-semibold mb-2">
              <TrendingUp className="h-4 w-4" />
              TRENDING NOW
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Popular Destinations
            </h2>
            <p className="text-muted-foreground mt-2">
              Join thousands of travelers exploring these amazing places
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                'p-3 rounded-full border border-border transition-colors',
                canScrollLeft ? 'hover:bg-accent text-foreground' : 'text-muted-foreground/30 cursor-not-allowed'
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={cn(
                'p-3 rounded-full border border-border transition-colors',
                canScrollRight ? 'hover:bg-accent text-foreground' : 'text-muted-foreground/30 cursor-not-allowed'
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative -mx-4 sm:mx-0">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-0 pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {carouselItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex-shrink-0 w-[280px] snap-start"
              >
                {item.type === 'destination' && item.data ? (
                  <DestinationCard destination={item.data} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <AdSlot
                      slot={AD_SLOTS.TRENDING_CAROUSEL_NATIVE}
                      format="rectangle"
                      layout="in-feed"
                      priority="normal"
                      className="w-full"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Gradient Fade */}
          <div className="hidden sm:block absolute top-0 right-0 bottom-4 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
