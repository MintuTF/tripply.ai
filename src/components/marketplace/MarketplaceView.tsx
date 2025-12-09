'use client';

import { useState, useEffect, useCallback } from 'react';
import { FilterBar } from './FilterBar';
import { HorizontalProductRow } from './HorizontalProductRow';
import {
  Product,
  ProductRecommendation,
  MarketplaceTripContext,
  MarketplaceFilters,
  CategoryKit,
  ProductCategory,
} from '@/types/marketplace';
import { CATEGORIES } from '@/lib/marketplace/categories';
import { ShoppingBag, Loader2, MapPin } from 'lucide-react';

interface MarketplaceViewProps {
  tripContext?: MarketplaceTripContext;
  onClose?: () => void;
}

interface RecommendationResponse {
  recommendations: ProductRecommendation[];
  smartKits: CategoryKit[];
  categoryProducts: Record<ProductCategory, Product[]>;
  tripSummary?: {
    destination: string;
    weather: string;
    duration: string;
  };
}

// Destination type mappings for trip-specific recommendations
const DESTINATION_KEYWORDS: Record<string, string[]> = {
  beach: ['beach', 'hawaii', 'cancun', 'miami', 'bahamas', 'caribbean', 'maldives', 'fiji', 'bali', 'phuket', 'cabo', 'key west', 'san diego'],
  desert: ['vegas', 'las vegas', 'phoenix', 'dubai', 'arizona', 'nevada', 'morocco', 'sahara', 'joshua tree', 'death valley', 'sedona'],
  mountain: ['colorado', 'aspen', 'denver', 'switzerland', 'alps', 'rockies', 'montana', 'utah', 'jackson hole', 'whistler', 'banff'],
  city: ['new york', 'london', 'paris', 'tokyo', 'rome', 'barcelona', 'chicago', 'san francisco', 'los angeles', 'seattle', 'boston', 'austin'],
  tropical: ['costa rica', 'thailand', 'vietnam', 'philippines', 'indonesia', 'singapore', 'malaysia', 'puerto rico'],
  cold: ['alaska', 'iceland', 'norway', 'finland', 'sweden', 'canada', 'russia', 'greenland'],
};

// Category priorities based on destination type
const DESTINATION_CATEGORY_PRIORITIES: Record<string, ProductCategory[]> = {
  beach: ['clothing', 'health', 'electronics', 'organization'],
  desert: ['health', 'clothing', 'electronics', 'hydration'],
  mountain: ['clothing', 'health', 'electronics', 'organization'],
  city: ['electronics', 'organization', 'security', 'comfort'],
  tropical: ['health', 'clothing', 'electronics', 'organization'],
  cold: ['clothing', 'health', 'electronics', 'comfort'],
  default: ['electronics', 'organization', 'health', 'comfort'],
};

export function MarketplaceView({ tripContext, onClose }: MarketplaceViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [tripSummary, setTripSummary] = useState<RecommendationResponse['tripSummary']>();
  const [filters, setFilters] = useState<MarketplaceFilters>({});

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketplace/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripContext, filters }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data: RecommendationResponse = await response.json();
      setRecommendations(data.recommendations || []);
      setCategoryProducts(data.categoryProducts || {});
      setTripSummary(data.tripSummary);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [tripContext, filters]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleFiltersChange = (newFilters: MarketplaceFilters) => {
    setFilters(newFilters);
  };

  // Filter products based on current filters
  const filterProducts = (products: (Product | ProductRecommendation)[]) => {
    return products.filter((product) => {
      if (filters.budgetTier && product.budgetTier !== filters.budgetTier) {
        return false;
      }
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(product.category)) {
          return false;
        }
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesDescription = product.description?.toLowerCase().includes(query);
        const matchesTags = product.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesName && !matchesDescription && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  };

  const filteredRecommendations = filterProducts(recommendations) as ProductRecommendation[];

  // Get all filtered category products
  const getFilteredCategoryProducts = () => {
    const filtered: Record<string, Product[]> = {};
    for (const category of CATEGORIES) {
      const products = categoryProducts[category.id] || [];
      const filteredProducts = filterProducts(products) as Product[];
      if (filteredProducts.length > 0) {
        filtered[category.id] = filteredProducts;
      }
    }
    return filtered;
  };

  const filteredCategoryProducts = getFilteredCategoryProducts();

  // Detect destination type from trip summary
  const getDestinationType = (destination: string): string => {
    const lowerDest = destination.toLowerCase();
    for (const [type, keywords] of Object.entries(DESTINATION_KEYWORDS)) {
      if (keywords.some((keyword) => lowerDest.includes(keyword))) {
        return type;
      }
    }
    return 'default';
  };

  // Get trip-specific products based on destination
  const getTripSpecificProducts = (): Product[] => {
    if (!tripSummary?.destination) return [];

    const destType = getDestinationType(tripSummary.destination);
    const priorityCategories = DESTINATION_CATEGORY_PRIORITIES[destType] || DESTINATION_CATEGORY_PRIORITIES.default;

    const tripProducts: Product[] = [];
    const seenIds = new Set<string>();

    // Collect products from priority categories
    for (const category of priorityCategories) {
      const products = categoryProducts[category] || [];
      for (const product of products) {
        if (!seenIds.has(product.id) && tripProducts.length < 12) {
          seenIds.add(product.id);
          tripProducts.push(product);
        }
      }
    }

    return filterProducts(tripProducts) as Product[];
  };

  const tripSpecificProducts = getTripSpecificProducts();
  const hasAnyProducts =
    filteredRecommendations.length > 0 || tripSpecificProducts.length > 0 || Object.keys(filteredCategoryProducts).length > 0;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Compact Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/50">
        <ShoppingBag className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold text-base">Smart Travel Marketplace</h2>
          {tripSummary && (
            <p className="text-xs text-muted-foreground">
              Personalized for {tripSummary.destination}
            </p>
          )}
        </div>
      </div>

      {/* Compact Filter Bar */}
      <FilterBar onFiltersChange={handleFiltersChange} initialFilters={filters} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading products...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive text-sm mb-4">{error}</p>
            <button
              onClick={fetchRecommendations}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : !hasAnyProducts ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-base mb-2">No products found</h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your filters to see more products
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Picks / Recommendations */}
            {filteredRecommendations.length > 0 && (
              <HorizontalProductRow
                title="Top Picks for You"
                products={filteredRecommendations}
              />
            )}

            {/* Trip-Specific Section */}
            {tripSpecificProducts.length > 0 && tripSummary?.destination && (
              <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-primary/10 rounded-full" />
                <div className="flex items-center gap-2 mb-3 pl-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-base text-foreground">
                    Popular with travelers to {tripSummary.destination}
                  </h3>
                </div>
                <HorizontalProductRow
                  title=""
                  products={tripSpecificProducts}
                />
              </div>
            )}

            {/* Best Sellers - show when no trip destination */}
            {!tripSummary?.destination && Object.keys(categoryProducts).length > 0 && (
              <HorizontalProductRow
                title="Best Sellers for Travelers"
                products={Object.values(categoryProducts)
                  .flat()
                  .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
                  .slice(0, 12)}
              />
            )}

            {/* Category Rows */}
            {CATEGORIES.map((category) => {
              const products = filteredCategoryProducts[category.id];
              if (!products || products.length === 0) return null;

              return (
                <HorizontalProductRow
                  key={category.id}
                  title={category.name}
                  products={products}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Compact Footer */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
        <p className="text-[10px] text-center text-muted-foreground">
          Powered by Amazon Associates. Prices may vary.
        </p>
      </div>
    </div>
  );
}
