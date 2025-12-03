'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardType } from '@/types';

// Category-specific filter states
export interface HotelFilters {
  priceRange: [number, number];
  rating: number | null;
  amenities: string[];
  sortBy: 'relevance' | 'price' | 'rating' | 'distance';
}

export interface RestaurantFilters {
  priceLevel: number | null; // 1-4
  cuisineTypes: string[];
  dietaryOptions: string[];
  rating: number | null;
  sortBy: 'relevance' | 'price' | 'rating' | 'distance';
}

export interface SpotFilters {
  types: string[];
  priceRange: [number, number];
  rating: number | null;
  sortBy: 'relevance' | 'price' | 'rating' | 'distance';
}

export interface ActivityFilters {
  types: string[];
  duration: string | null; // '<2h', '2-3h', '3h+'
  priceRange: [number, number];
  rating: number | null;
  sortBy: 'relevance' | 'price' | 'rating' | 'duration' | 'distance';
}

export interface AllFilters {
  priceRange: [number, number];
  rating: number | null;
  sortBy: 'relevance' | 'price' | 'rating' | 'distance';
}

export type FilterState = HotelFilters | RestaurantFilters | SpotFilters | ActivityFilters | AllFilters;

interface HorizontalFiltersProps {
  activeType: CardType | 'all';
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

// Filter options
const HOTEL_AMENITIES = [
  'Free WiFi',
  'Pool',
  'Gym',
  'Breakfast',
  'Parking',
  'Air-conditioned',
  'Pet-friendly',
  'Spa',
];

const CUISINE_TYPES = [
  'French',
  'Italian',
  'Creperie',
  'Japanese',
  'American',
  'Mediterranean',
];

const DIETARY_OPTIONS = [
  'Vegetarian Options',
  'Vegan Options',
  'Gluten-free',
  'Fine Dining',
  'Michelin Star',
  'Wine Bar',
];

const SPOT_TYPES = [
  'Museum',
  'Landmark',
  'Monument',
  'Religious',
  'Palace',
];

const ACTIVITY_TYPES = [
  'Walking Tour',
  'Cooking Class',
  'Bike Tour',
  'Cruise',
  'Show',
  'Wine Tasting',
  'Underground Tour',
];

export function HorizontalFilters({ activeType, filters, onFiltersChange, onClearFilters }: HorizontalFiltersProps) {
  const hasActiveFilters = () => {
    return filters.rating !== null;
  };

  // Hotel Filters
  const renderHotelFilters = () => {
    if (!('amenities' in filters)) return null;
    const hotelFilters = filters as HotelFilters;

    return (
      <>
        {/* Star Rating */}
        <select
          value={hotelFilters.rating ?? ''}
          onChange={(e) => onFiltersChange({ ...hotelFilters, rating: e.target.value ? Number(e.target.value) : null })}
          className={cn(
            'h-9 rounded-lg border-2 px-3 pr-8 text-sm font-medium appearance-none cursor-pointer transition-all duration-200',
            hotelFilters.rating !== null
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-background text-foreground hover:border-primary/50'
          )}
        >
          <option value="">Any rating</option>
          <option value="4.5">4.5+ ⭐</option>
          <option value="4">4+ ⭐</option>
          <option value="3">3+ ⭐</option>
        </select>
      </>
    );
  };

  // Restaurant Filters
  const renderRestaurantFilters = () => {
    if (!('cuisineTypes' in filters)) return null;
    const restaurantFilters = filters as RestaurantFilters;

    return (
      <>
        {/* Rating */}
        <select
          value={restaurantFilters.rating ?? ''}
          onChange={(e) => onFiltersChange({ ...restaurantFilters, rating: e.target.value ? Number(e.target.value) : null })}
          className={cn(
            'h-9 rounded-lg border-2 px-3 pr-8 text-sm font-medium appearance-none cursor-pointer transition-all duration-200',
            restaurantFilters.rating !== null
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-background text-foreground hover:border-primary/50'
          )}
        >
          <option value="">Any rating</option>
          <option value="4.5">4.5+ ⭐</option>
          <option value="4">4+ ⭐</option>
          <option value="3">3+ ⭐</option>
        </select>
      </>
    );
  };

  // Spot/Attraction Filters
  const renderSpotFilters = () => {
    if (!('types' in filters) || 'duration' in filters) return null;
    const spotFilters = filters as SpotFilters;

    return (
      <>
        {/* Rating */}
        <select
          value={spotFilters.rating ?? ''}
          onChange={(e) => onFiltersChange({ ...spotFilters, rating: e.target.value ? Number(e.target.value) : null })}
          className={cn(
            'h-9 rounded-lg border-2 px-3 pr-8 text-sm font-medium appearance-none cursor-pointer transition-all duration-200',
            spotFilters.rating !== null
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-background text-foreground hover:border-primary/50'
          )}
        >
          <option value="">Any rating</option>
          <option value="4.5">4.5+ ⭐</option>
          <option value="4">4+ ⭐</option>
          <option value="3">3+ ⭐</option>
        </select>
      </>
    );
  };

  // Activity Filters
  const renderActivityFilters = () => {
    if (!('duration' in filters)) return null;
    const activityFilters = filters as ActivityFilters;

    return (
      <>
        {/* Rating */}
        <select
          value={activityFilters.rating ?? ''}
          onChange={(e) => onFiltersChange({ ...activityFilters, rating: e.target.value ? Number(e.target.value) : null })}
          className={cn(
            'h-9 rounded-lg border-2 px-3 pr-8 text-sm font-medium appearance-none cursor-pointer transition-all duration-200',
            activityFilters.rating !== null
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-background text-foreground hover:border-primary/50'
          )}
        >
          <option value="">Any rating</option>
          <option value="4.5">4.5+ ⭐</option>
          <option value="4">4+ ⭐</option>
          <option value="3">3+ ⭐</option>
        </select>
      </>
    );
  };

  // All/General Filters
  const renderAllFilters = () => {
    if (!('priceRange' in filters) || 'amenities' in filters || 'cuisineTypes' in filters || 'types' in filters) return null;
    const allFilters = filters as AllFilters;

    return (
      <>
        {/* Rating */}
        <select
          value={allFilters.rating ?? ''}
          onChange={(e) => onFiltersChange({ ...allFilters, rating: e.target.value ? Number(e.target.value) : null })}
          className={cn(
            'h-9 rounded-lg border-2 px-3 pr-8 text-sm font-medium appearance-none cursor-pointer transition-all duration-200',
            allFilters.rating !== null
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-background text-foreground hover:border-primary/50'
          )}
        >
          <option value="">Any rating</option>
          <option value="4.5">4.5+ ⭐</option>
          <option value="4">4+ ⭐</option>
          <option value="3">3+ ⭐</option>
        </select>
      </>
    );
  };


  return (
    <div className="flex items-center gap-2 p-4 border-b-2 border-border bg-card/30 overflow-x-auto overflow-y-visible" style={{ clipPath: 'inset(0 0 -200px 0)' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeType}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 flex-shrink-0"
        >
          {activeType === 'hotel' && renderHotelFilters()}
          {activeType === 'food' && renderRestaurantFilters()}
          {activeType === 'spot' && renderSpotFilters()}
          {activeType === 'activity' && renderActivityFilters()}
          {activeType === 'all' && renderAllFilters()}

          {hasActiveFilters() && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClearFilters}
              className="ml-auto h-9 rounded-lg border-2 border-border bg-background px-3 text-sm font-medium text-foreground hover:border-primary/50 transition-all flex items-center gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
