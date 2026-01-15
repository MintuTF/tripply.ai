'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  destinationCount: number;
  color: string;
}

interface CollectionCardProps {
  collection: Collection;
  className?: string;
}

export function CollectionCard({ collection, className }: CollectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/discover?collection=${encodeURIComponent(collection.id)}`);
  };

  return (
    <motion.button
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -6 }}
      className={cn(
        'group relative overflow-hidden rounded-3xl text-left w-full',
        'transition-shadow duration-300',
        'hover:shadow-2xl hover:shadow-black/20',
        className
      )}
    >
      <div className="relative aspect-[16/9] sm:aspect-[16/7] overflow-hidden">
        <motion.img
          src={collection.image}
          alt={collection.title}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.08 : 1 }}
          transition={{ duration: 0.6 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${collection.color}90, ${collection.color}40)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              <Compass className="h-4 w-4" />
              {collection.destinationCount} destinations
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {collection.title}
          </h3>
          <p className="text-white/80 text-sm sm:text-base max-w-md">
            {collection.subtitle}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            className="mt-4 flex items-center gap-2 text-white font-semibold"
          >
            Explore Collection
            <ArrowRight className="h-5 w-5" />
          </motion.div>
        </div>
      </div>
    </motion.button>
  );
}

// Collections Section Component
const CURATED_COLLECTIONS: Collection[] = [
  {
    id: 'hidden-gems-europe',
    title: 'Hidden Gems of Europe',
    subtitle: 'Discover charming towns and secret spots away from the crowds',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&q=80',
    destinationCount: 12,
    color: '#6366f1',
  },
  {
    id: 'beach-escapes',
    title: 'Best Beach Escapes',
    subtitle: 'Crystal waters and pristine sands for your perfect getaway',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    destinationCount: 8,
    color: '#0891b2',
  },
  {
    id: 'cultural-capitals',
    title: 'Cultural Capitals',
    subtitle: 'Museums, history, and artistic heritage in world-class cities',
    image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80',
    destinationCount: 10,
    color: '#7c3aed',
  },
  {
    id: 'adventure-awaits',
    title: 'Adventure Awaits',
    subtitle: 'Epic landscapes and thrilling experiences for the bold traveler',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    destinationCount: 15,
    color: '#059669',
  },
];

interface CuratedCollectionsProps {
  className?: string;
}

export function CuratedCollections({ className }: CuratedCollectionsProps) {
  return (
    <section className={cn('py-20 bg-accent/30', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Curated Collections
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hand-picked destinations for every type of traveler. Find inspiration for your next adventure.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {CURATED_COLLECTIONS.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <CollectionCard collection={collection} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
