'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  priceRange: [number, number];
  rating: number | null;
  amenities: string[];
  sortBy: 'relevance' | 'price' | 'rating' | 'distance';
}

interface MapFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const AMENITIES_OPTIONS = [
  'Free WiFi',
  'Pool',
  'Gym',
  'Breakfast',
  'Parking',
  'Air-conditioned',
  'Pet-friendly',
  'Spa',
];

const PRICE_LEVELS = [
  { value: 1, label: '$', max: 50 },
  { value: 2, label: '$$', max: 150 },
  { value: 3, label: '$$$', max: 300 },
  { value: 4, label: '$$$$', max: 500 },
];

export function MapFilters({ filters, onFiltersChange, onClearFilters }: MapFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['price', 'rating'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handlePriceChange = (level: number) => {
    const maxPrice = PRICE_LEVELS.find((p) => p.value === level)?.max || 500;
    onFiltersChange({
      ...filters,
      priceRange: [0, maxPrice],
    });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      rating: filters.rating === rating ? null : rating,
    });
  };

  const handleAmenityToggle = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];

    onFiltersChange({
      ...filters,
      amenities: newAmenities,
    });
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    onFiltersChange({
      ...filters,
      sortBy,
    });
  };

  const hasActiveFilters =
    filters.priceRange[1] < 500 ||
    filters.rating !== null ||
    filters.amenities.length > 0 ||
    filters.sortBy !== 'relevance';

  return (
    <div className="space-y-3">
      {/* Sort By */}
      <div className="rounded-xl border-2 border-border bg-card p-3">
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          Sort by
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleSortChange(e.target.value as FilterState['sortBy'])}
          className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
        >
          <option value="relevance">Best match</option>
          <option value="price">Price (low to high)</option>
          <option value="rating">Highest rated</option>
          <option value="distance">Distance</option>
        </select>
      </div>

      {/* Price Range Filter */}
      <div className="rounded-xl border-2 border-border bg-card">
        <motion.button
          onClick={() => toggleSection('price')}
          whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-between p-3 transition-colors"
        >
          <span className="text-sm font-semibold text-foreground">Price Range</span>
          <motion.div
            animate={{ rotate: expandedSections.has('price') ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {expandedSections.has('price') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border p-3 space-y-2">
                {PRICE_LEVELS.map((level) => {
                  const isSelected = filters.priceRange[1] === level.max;
                  return (
                    <button
                      key={level.value}
                      onClick={() => handlePriceChange(level.value)}
                      className={cn(
                        'w-full rounded-lg border-2 p-2.5 text-left text-sm font-medium transition-all',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-foreground hover:border-primary/50'
                      )}
                    >
                      <span className="text-lg">{level.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        Up to ${level.max}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating Filter */}
      <div className="rounded-xl border-2 border-border bg-card">
        <motion.button
          onClick={() => toggleSection('rating')}
          whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-between p-3 transition-colors"
        >
          <span className="text-sm font-semibold text-foreground">Minimum Rating</span>
          <motion.div
            animate={{ rotate: expandedSections.has('rating') ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {expandedSections.has('rating') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border p-3 space-y-2">
                {[4, 3, 2].map((rating) => {
                  const isSelected = filters.rating === rating;
                  return (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(rating)}
                      className={cn(
                        'w-full rounded-lg border-2 p-2.5 text-left transition-all flex items-center gap-2',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {rating}+ stars
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={() => handleRatingChange(0)}
                  className={cn(
                    'w-full rounded-lg border-2 p-2.5 text-left text-sm font-medium transition-all',
                    filters.rating === null
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:border-primary/50'
                  )}
                >
                  Any rating
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Amenities Filter */}
      <div className="rounded-xl border-2 border-border bg-card">
        <motion.button
          onClick={() => toggleSection('amenities')}
          whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-between p-3 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Amenities</span>
            {filters.amenities.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white"
              >
                {filters.amenities.length}
              </motion.span>
            )}
          </div>
          <motion.div
            animate={{ rotate: expandedSections.has('amenities') ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {expandedSections.has('amenities') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border p-3 space-y-2">
                {AMENITIES_OPTIONS.map((amenity) => {
                  const isSelected = filters.amenities.includes(amenity);
                  return (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="h-4 w-4 rounded border-2 border-border text-primary transition-colors focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {amenity}
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onClearFilters}
          className="w-full rounded-xl border-2 border-border bg-card p-3 text-sm font-semibold text-foreground transition-all hover:bg-muted/50 flex items-center justify-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear all filters
        </motion.button>
      )}
    </div>
  );
}
