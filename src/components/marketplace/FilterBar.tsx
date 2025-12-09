'use client';

import { useState } from 'react';
import { BudgetTier, ProductCategory } from '@/types/marketplace';
import { CATEGORIES } from '@/lib/marketplace/categories';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const handleBudgetChange = (tier: BudgetTier | undefined) => {
    setBudgetTier(tier);
    onFiltersChange({ budgetTier: tier, categories: selectedCategories, searchQuery });
  };

  const handleCategoryToggle = (category: ProductCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
    onFiltersChange({
      budgetTier,
      categories: newCategories.length > 0 ? newCategories : undefined,
      searchQuery,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFiltersChange({
      budgetTier,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      searchQuery: value || undefined,
    });
  };

  const clearFilters = () => {
    setBudgetTier(undefined);
    setSelectedCategories([]);
    setSearchQuery('');
    onFiltersChange({});
  };

  const hasActiveFilters = budgetTier || selectedCategories.length > 0 || searchQuery;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border/50 bg-card/30">
      {/* Search Bar - Compact */}
      <div className="relative w-56 flex-shrink-0">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search travel gear..."
          className="h-8 w-full rounded-lg border border-border/50 bg-background pl-8 pr-8 text-xs transition-all focus-visible:outline-none focus-visible:border-primary"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border/50" />

      {/* Budget Tier Filter - Inline */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs text-muted-foreground">Budget:</span>
        <div className="flex rounded-md border border-border/50 overflow-hidden">
          {(['budget', 'mid-range', 'premium'] as BudgetTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => handleBudgetChange(budgetTier === tier ? undefined : tier)}
              className={cn(
                'px-2 py-1 text-xs font-medium transition-all',
                budgetTier === tier
                  ? 'bg-primary text-white'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {tier === 'budget' ? '💰 Budget' : tier === 'mid-range' ? '⭐ Value' : '✨ Premium'}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border/50" />

      {/* Category Pills - Horizontal Scroll */}
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryToggle(category.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-all',
                selectedCategories.includes(category.id)
                  ? 'bg-primary text-white'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Button */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 flex-shrink-0"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
