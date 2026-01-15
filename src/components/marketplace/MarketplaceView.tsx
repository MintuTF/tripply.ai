'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTripContext } from '@/context/TripContext';
import { TripContextBar } from './TripContextBar';
import { TripContextModal } from './TripContextModal';
import { FilterBar } from './FilterBar';
import { RecommendedSection } from './sections/RecommendedSection';
import { DontForgetSection } from './sections/DontForgetSection';
import { ComfortUpgradesSection } from './sections/ComfortUpgradesSection';
import { SmartAssistantCard } from './SmartAssistantCard';
import { FloatingProductCart } from './FloatingProductCart';
import {
  ProductRecommendation,
  MarketplaceTripContext,
  MarketplaceFilters,
  TripContextSummary,
} from '@/types/marketplace';
import { getTripContextSummary } from '@/lib/marketplace/tripContextUtils';
import { Loader2, ShoppingBag, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface MarketplaceViewProps {
  tripContext?: MarketplaceTripContext;
  onClose?: () => void;
}

interface SectionedRecommendationResponse {
  topRecommendations: ProductRecommendation[];
  dontForget: ProductRecommendation[];
  comfortUpgrades: ProductRecommendation[];
  tripContextSummary: TripContextSummary | null;
  totalProducts: number;
}

/**
 * MarketplaceView - Calm, travel-aware preparation assistant
 * Redesigned in Phase 9 with sectioned layout and premium UX
 */
export function MarketplaceView({ tripContext, onClose }: MarketplaceViewProps) {
  const { trip, cards } = useTripContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topRecommendations, setTopRecommendations] = useState<ProductRecommendation[]>([]);
  const [dontForget, setDontForget] = useState<ProductRecommendation[]>([]);
  const [comfortUpgrades, setComfortUpgrades] = useState<ProductRecommendation[]>([]);
  const [tripSummary, setTripSummary] = useState<TripContextSummary | null>(null);
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [showEditModal, setShowEditModal] = useState(false);

  // Get saved product IDs from cards
  const savedProductIds = new Set(
    cards?.filter(card => card.type === 'product').map(card => card.id) || []
  );

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build trip context from TripContext
      const contextPayload: MarketplaceTripContext = tripContext || {
        destination: trip?.destination?.name,
        destinationCoordinates: trip?.destination?.coordinates,
        duration: trip?.dates ? Math.ceil(
          (new Date(trip.dates.end).getTime() - new Date(trip.dates.start).getTime()) / (1000 * 60 * 60 * 24)
        ) : undefined,
        startDate: trip?.dates?.start,
        endDate: trip?.dates?.end,
        partySize: (trip?.party_json?.adults || 0) + (trip?.party_json?.children || 0) + (trip?.party_json?.infants || 0),
        hasChildren: (trip?.party_json?.children || 0) > 0,
        hasInfants: (trip?.party_json?.infants || 0) > 0,
      };

      const response = await fetch('/api/marketplace/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripContext: contextPayload,
          filters,
          trip, // NEW: Pass full trip object for TripContextSummary
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data: SectionedRecommendationResponse = await response.json();
      setTopRecommendations(data.topRecommendations || []);
      setDontForget(data.dontForget || []);
      setComfortUpgrades(data.comfortUpgrades || []);
      setTripSummary(data.tripContextSummary || (trip ? getTripContextSummary(trip) : null));
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [trip, tripContext, filters, cards]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleFiltersChange = useCallback((newFilters: MarketplaceFilters) => {
    setFilters(newFilters);
  }, []);

  // Filter products based on current filters
  const filterProducts = (products: ProductRecommendation[]) => {
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
        const matchesBadges = product.smartBadges?.some((badge) => badge.toLowerCase().includes(query));
        if (!matchesName && !matchesDescription && !matchesTags && !matchesBadges) {
          return false;
        }
      }
      return true;
    });
  };

  const filteredTopRecommendations = filterProducts(topRecommendations);
  const filteredDontForget = filterProducts(dontForget);
  const filteredComfortUpgrades = filterProducts(comfortUpgrades);

  const hasAnyProducts =
    filteredTopRecommendations.length > 0 ||
    filteredDontForget.length > 0 ||
    filteredComfortUpgrades.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50">
      {/* Trip Context Bar - Sticky at top */}
      <TripContextBar onEditClick={() => setShowEditModal(true)} />

      {/* Filter Bar - Sticky below trip context */}
      <FilterBar onFiltersChange={handleFiltersChange} initialFilters={filters} />

      {/* Main Content */}
      <div className="relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium">Finding perfect gear for your trip...</p>
            </motion.div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-red-100">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-red-600 text-sm mb-6">{error}</p>
              <button
                onClick={fetchRecommendations}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:shadow-lg transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : !hasAnyProducts ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
            >
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">No products found</h3>
              <p className="text-sm text-gray-600 mb-6">
                Try adjusting your filters to see more recommendations
              </p>
              <button
                onClick={() => setFilters({})}
                className="px-6 py-2.5 rounded-xl border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 transition-colors"
              >
                Clear Filters
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-12">
            {/* Hero Section - Welcome Message */}
            {tripSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3 py-8"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <h1 className="text-3xl font-bold text-gray-900">
                    Get Ready for {tripSummary.destination}
                  </h1>
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  We've curated {filteredTopRecommendations.length + filteredDontForget.length + filteredComfortUpgrades.length} personalized
                  recommendations to help you prepare for your {tripSummary.duration}-day trip.
                  Each item is selected based on your destination, season, and travel style.
                </p>
              </motion.div>
            )}

            {/* Section 1: Recommended for Your Trip */}
            {filteredTopRecommendations.length > 0 && (
              <RecommendedSection
                products={filteredTopRecommendations}
                tripSummary={tripSummary}
                savedProductIds={savedProductIds}
              />
            )}

            {/* Section 2: Don't Forget These */}
            {filteredDontForget.length > 0 && (
              <DontForgetSection
                products={filteredDontForget}
                savedProductIds={savedProductIds}
              />
            )}

            {/* Section 3: Smart Assistant Card */}
            <SmartAssistantCard />

            {/* Section 4: Comfort Upgrades (Optional) */}
            {filteredComfortUpgrades.length > 0 && (
              <ComfortUpgradesSection
                products={filteredComfortUpgrades}
                savedProductIds={savedProductIds}
              />
            )}

            {/* Bottom Spacer */}
            <div className="h-8" />
          </div>
        )}
      </div>

      {/* Trip Context Edit Modal */}
      <TripContextModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Floating Product Cart */}
      <FloatingProductCart />
    </div>
  );
}
