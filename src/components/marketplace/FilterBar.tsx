'use client';

import { useState, useEffect, useCallback } from 'react';
import { BudgetTier, ProductCategory } from '@/types/marketplace';
import { CATEGORIES } from '@/lib/marketplace/categories';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterBarProps {
  onFiltersChange: (filters: {
    budgetTier?: BudgetTier;
    categories?: ProductCategory[];
    searchQuery?: string;
  }) => void;
  initialFilters?: {
    budgetTier?: BudgetTier;
    categories?: ProductCategory[];
    searchQuery?: string;
  };
}

export function FilterBar({ onFiltersChange, initialFilters }: FilterBarProps) {
  const [budgetTier, setBudgetTier] = useState<BudgetTier | undefined>(
    initialFilters?.budgetTier
  );
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>(
    initialFilters?.categories || []
  );
  const [searchQuery, setSearchQuery] = useState(initialFilters?.searchQuery || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger filter change when debounced search updates
  useEffect(() => {
    onFiltersChange({
      budgetTier,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      searchQuery: debouncedSearch || undefined,
    });
  }, [debouncedSearch, budgetTier, selectedCategories, onFiltersChange]);

  const handleBudgetChange = (tier: BudgetTier | undefined) => {
    setBudgetTier(tier);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ProductCategory;
    if (value) {
      setSelectedCategories([value]); // Single selection for compact mode
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setBudgetTier(undefined);
    setSelectedCategories([]);
    setSearchQuery('');
  };

  const hasActiveFilters = budgetTier || selectedCategories.length > 0 || searchQuery;

  const budgetOptions = [
    { tier: 'budget' as BudgetTier, icon: '💰', label: 'Budget' },
    { tier: 'mid-range' as BudgetTier, icon: '⭐', label: 'Value' },
    { tier: 'premium' as BudgetTier, icon: '✨', label: 'Premium' }
  ];

  return (
    <div className="sticky top-[48px] z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm marketplace-filter-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex flex-row items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Compact Search Bar */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-xs placeholder:text-gray-400 transition-all focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => handleSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </motion.button>
            )}
          </div>

          {/* Icon-only Budget Pills */}
          <div className="flex gap-1">
            {budgetOptions.map(({ tier, icon, label }) => {
              const isSelected = budgetTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => handleBudgetChange(budgetTier === tier ? undefined : tier)}
                  className={cn(
                    'w-8 h-8 rounded-full text-base flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 shadow-sm ring-2 ring-purple-200'
                      : 'bg-gray-50 border border-gray-200 hover:border-purple-200 hover:bg-purple-50'
                  )}
                  title={label}
                  aria-label={label}
                >
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategories[0] || ''}
            onChange={handleCategoryChange}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs max-w-[140px] transition-all focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Compact Clear Button */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearFilters}
                className="h-9 w-9 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-all"
                title="Clear all filters"
                aria-label="Clear all filters"
              >
                <X className="h-4 w-4 text-gray-600" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Active filters count indicator (mobile-friendly) */}
          {hasActiveFilters && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600">
              <Filter className="h-3.5 w-3.5" />
              <span>
                {[
                  budgetTier,
                  selectedCategories.length > 0 && `${selectedCategories.length} cat`,
                  searchQuery && 'search'
                ].filter(Boolean).length} active
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
