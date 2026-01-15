'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Star,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Map,
  Utensils,
  Camera,
  Compass,
  Hotel,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaceCard } from '@/types';

interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
}

const CATEGORIES: Category[] = [
  { id: 'all', label: 'All', icon: MapPin },
  { id: 'restaurant', label: 'Food', icon: Utensils },
  { id: 'attraction', label: 'Attractions', icon: Camera },
  { id: 'activity', label: 'Activities', icon: Compass },
  { id: 'hotel', label: 'Stay', icon: Hotel },
];

// Sample places data for demonstration
const SAMPLE_PLACES: PlaceCard[] = [
  {
    id: '1',
    type: 'attraction',
    name: 'Senso-ji Temple',
    address: 'Asakusa, Tokyo',
    photos: ['https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80'],
    rating: 4.9,
    review_count: 15420,
    description: 'Tokyo\'s oldest Buddhist temple, featuring the iconic Thunder Gate',
  },
  {
    id: '2',
    type: 'restaurant',
    name: 'Ichiran Ramen',
    address: 'Shibuya, Tokyo',
    photos: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80'],
    rating: 4.8,
    review_count: 8930,
    price_level: 2,
    description: 'Famous tonkotsu ramen chain with individual flavor-focused booths',
  },
  {
    id: '3',
    type: 'activity',
    name: 'teamLab Borderless',
    address: 'Odaiba, Tokyo',
    photos: ['https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&q=80'],
    rating: 4.7,
    review_count: 12500,
    price_level: 3,
    description: 'Immersive digital art museum with boundary-less exhibitions',
  },
  {
    id: '4',
    type: 'hotel',
    name: 'Park Hyatt Tokyo',
    address: 'Shinjuku, Tokyo',
    photos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'],
    rating: 4.9,
    review_count: 3200,
    price_level: 4,
    description: 'Luxury hotel featured in "Lost in Translation" with stunning views',
  },
  {
    id: '5',
    type: 'attraction',
    name: 'Meiji Shrine',
    address: 'Shibuya, Tokyo',
    photos: ['https://images.unsplash.com/photo-1583167616089-f0e5e5e5e5e5?w=400&q=80'],
    rating: 4.8,
    review_count: 9800,
    description: 'Peaceful Shinto shrine dedicated to Emperor Meiji in a forest setting',
  },
  {
    id: '6',
    type: 'restaurant',
    name: 'Sukiyabashi Jiro',
    address: 'Ginza, Tokyo',
    photos: ['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80'],
    rating: 4.9,
    review_count: 2100,
    price_level: 4,
    description: 'World-renowned sushi restaurant made famous by the documentary',
  },
];

interface PlaceCardComponentProps {
  place: PlaceCard;
  onSave?: (place: PlaceCard) => void;
  onSelect?: (place: PlaceCard) => void;
  isSaved?: boolean;
}

function PlaceCardComponent({
  place,
  onSave,
  onSelect,
  isSaved = false,
}: PlaceCardComponentProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const priceLabel = place.price_level ? '$'.repeat(place.price_level) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect?.(place)}
      className="group relative flex-shrink-0 w-[260px] sm:w-[280px] rounded-2xl overflow-hidden cursor-pointer bg-card border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        {place.photos?.[0] && (
          <motion.img
            src={place.photos[0]}
            alt={place.name}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              isHovered && 'scale-110'
            )}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Save button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onSave?.(place);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'absolute top-3 right-3 p-2 rounded-full transition-all',
            isSaved
              ? 'bg-primary text-primary-foreground'
              : 'bg-white/90 text-foreground/70 hover:bg-white hover:text-foreground'
          )}
        >
          {isSaved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </motion.button>

        {/* Type badge */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-foreground capitalize">
          {place.type}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate mb-1">
          {place.name}
        </h3>

        {place.address && (
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span>{place.address}</span>
          </p>
        )}

        <div className="flex items-center gap-3 text-sm">
          {place.rating && (
            <span className="flex items-center gap-1 font-medium">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {place.rating.toFixed(1)}
              {place.review_count && (
                <span className="text-muted-foreground">
                  ({place.review_count > 999 ? `${(place.review_count / 1000).toFixed(1)}k` : place.review_count})
                </span>
              )}
            </span>
          )}
          {priceLabel && (
            <span className="text-green-600 font-medium">{priceLabel}</span>
          )}
        </div>

        {place.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {place.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface PlacesDiscoverySectionProps {
  destination: string;
  places?: PlaceCard[];
  savedPlaces?: string[];
  onSavePlace?: (place: PlaceCard) => void;
  onSelectPlace?: (place: PlaceCard) => void;
  onOpenMap?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function PlacesDiscoverySection({
  destination,
  places = SAMPLE_PLACES,
  savedPlaces = [],
  onSavePlace,
  onSelectPlace,
  onOpenMap,
  isLoading = false,
  className,
}: PlacesDiscoverySectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const filteredPlaces =
    selectedCategory === 'all'
      ? places
      : places.filter((p) => p.type === selectedCategory);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollTo = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={cn('py-12', className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              Discover Places
            </h2>
            <p className="text-muted-foreground">
              Explore top-rated spots in {destination}
            </p>
          </div>

          <button
            onClick={onOpenMap}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all"
          >
            <Map className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline font-medium">View Map</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-card border border-border hover:bg-accent hover:border-primary/30'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{category.label}</span>

                {isSelected && (
                  <motion.div
                    layoutId="categoryIndicator"
                    className="absolute inset-0 rounded-xl bg-primary -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Places Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          {showLeftArrow && (
            <button
              onClick={() => scrollTo('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg rounded-full p-3 border border-border/50 hover:bg-background transition-colors -ml-4"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {showRightArrow && (
            <button
              onClick={() => scrollTo('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg rounded-full p-3 border border-border/50 hover:bg-background transition-colors -mr-4"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Gradient Fades */}
          {showLeftArrow && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
          )}
          {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {isLoading ? (
              // Loading skeletons
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[260px] sm:w-[280px] rounded-2xl overflow-hidden bg-card border border-border/50"
                >
                  <div className="h-40 bg-muted animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : filteredPlaces.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {filteredPlaces.map((place) => (
                  <PlaceCardComponent
                    key={place.id}
                    place={place}
                    onSave={onSavePlace}
                    onSelect={onSelectPlace}
                    isSaved={savedPlaces.includes(place.id)}
                  />
                ))}
              </AnimatePresence>
            ) : (
              <div className="flex-1 flex items-center justify-center py-12 text-muted-foreground">
                No places found in this category
              </div>
            )}
          </div>
        </div>

        {/* Load More */}
        {!isLoading && filteredPlaces.length > 0 && (
          <div className="text-center mt-6">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all font-medium">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Load More Places</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default PlacesDiscoverySection;
