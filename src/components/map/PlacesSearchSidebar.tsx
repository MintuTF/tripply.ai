'use client';

import { Card, CardType } from '@/types';
import { useState, useEffect } from 'react';
import { useMapSearch } from '@/hooks/useMapSearch';
import { usePlacesSearch } from '@/hooks/usePlacesSearch';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { HorizontalFilters } from './HorizontalFilters';
import { PlaceCard, AIRecommendations } from '@/components/plan';
import { LocationAutocomplete } from './LocationAutocomplete';
import { Search, Hotel, Utensils, Compass, X, MapPin, Loader2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { AutocompletePrediction } from '@/app/api/places/autocomplete/route';

interface PlacesSearchSidebarProps {
  cards: Card[];
  tripId?: string;
  hoveredCardId?: string;
  selectedCardId?: string;
  onCardHover?: (cardId: string | undefined) => void;
  onCardClick?: (card: Card) => void;
  onAddToTrip?: (card: Card) => void;
  onSearchResultsChange?: (results: Card[] | null) => void;
  onLocationChange?: (location: string) => void;
}

const TYPE_TABS = [
  { id: 'hotel' as CardType, label: 'Hotels', icon: Hotel },
  { id: 'food' as CardType, label: 'Restaurants', icon: Utensils },
  { id: 'spot' as CardType, label: 'Things to Do', icon: Compass },
];

const POPULAR_DESTINATIONS = [
  { name: 'Paris, France', emoji: '🇫🇷', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=200&h=120&fit=crop' },
  { name: 'Tokyo, Japan', emoji: '🇯🇵', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&h=120&fit=crop' },
  { name: 'New York, USA', emoji: '🇺🇸', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=200&h=120&fit=crop' },
  { name: 'London, UK', emoji: '🇬🇧', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=200&h=120&fit=crop' },
  { name: 'Bali, Indonesia', emoji: '🇮🇩', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200&h=120&fit=crop' },
  { name: 'Barcelona, Spain', emoji: '🇪🇸', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=200&h=120&fit=crop' },
];

export function PlacesSearchSidebar({
  cards,
  tripId,
  hoveredCardId,
  selectedCardId,
  onCardHover,
  onCardClick,
  onAddToTrip,
  onSearchResultsChange,
  onLocationChange,
}: PlacesSearchSidebarProps) {
  // Location/city search state - persist confirmedLocation to localStorage
  const { value: confirmedLocation, setValue: setConfirmedLocation, isHydrated } =
    useLocalStorage('tripply_search_location', '');
  const [location, setLocation] = useState('');
  const [useRealTimeData, setUseRealTimeData] = useState(true);

  // Sync location input with persisted value on hydration
  useEffect(() => {
    if (isHydrated && confirmedLocation) {
      setLocation(confirmedLocation);
    }
  }, [isHydrated, confirmedLocation]);

  // Note: Removed allFetchedCards state - now using usePlacesSearch with caching instead

  // Pagination: show 20 items initially, with "See More" to reveal rest
  const [visibleCount, setVisibleCount] = useState(20);

  console.log('[PlacesSearchSidebar] Render:', { confirmedLocation, useRealTimeData, cardsCount: cards.length });

  // Local filtering for saved cards
  const {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    filters,
    setFilters,
    filteredCards: localFilteredCards,
    clearFilters,
    hasActiveFilters,
  } = useMapSearch(cards);

  // Real-time places search (only search with confirmed location)
  const {
    data: realTimePlaces,
    isLoading: isLoadingPlaces,
    error: placesError,
  } = usePlacesSearch({
    location: confirmedLocation,
    query: searchQuery,
    type: typeFilter,
    tripId,
    enabled: useRealTimeData && confirmedLocation.trim() !== '',
  });

  // Determine which cards to display - use realTimePlaces from usePlacesSearch (cached)
  const filteredCards = useRealTimeData && confirmedLocation.trim() !== ''
    ? (realTimePlaces || []).filter(card => {
        // Filter by rating
        if (filters.rating !== null) {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          if (!payload.rating || payload.rating < filters.rating) {
            return false;
          }
        }
        return true;
      })
    : localFilteredCards;

  // Deduplicate cards by id to prevent React key warnings
  const displayCards = filteredCards.filter((card, index, self) =>
    index === self.findIndex((c) => c.id === card.id)
  );

  // Slice for list display only (map gets all displayCards via onSearchResultsChange)
  const visibleCards = displayCards.slice(0, visibleCount);

  // Reset visible count when filters or location changes
  useEffect(() => {
    setVisibleCount(20);
  }, [confirmedLocation, typeFilter, searchQuery, filters.rating]);

  // Handle autocomplete selection (confirmed selection)
  const handleLocationSelect = (prediction: AutocompletePrediction) => {
    console.log('[PlacesSearchSidebar] Location selected:', prediction.description);
    setLocation(prediction.description);
    setConfirmedLocation(prediction.description);
    setUseRealTimeData(true);
  };

  // Note: Removed fetchAllTypes - now relying on usePlacesSearch which has 5-min caching
  // This reduces API calls from 3 (all types) to 1 (current type) per location change

  // Notify parent of search results changes
  useEffect(() => {
    if (useRealTimeData && confirmedLocation.trim() !== '') {
      onSearchResultsChange?.(displayCards.length > 0 ? displayCards : (realTimePlaces || []));
    } else {
      onSearchResultsChange?.(null);
    }
  }, [displayCards.length, realTimePlaces, useRealTimeData, confirmedLocation]);

  // Notify parent of location changes
  useEffect(() => {
    onLocationChange?.(confirmedLocation);
  }, [confirmedLocation]);

  return (
    <div className="flex h-full w-[420px] flex-col border-r-2 border-border bg-card/50 backdrop-blur-sm">
      {/* Sticky Header - Compact */}
      <div className="flex-shrink-0 border-b-2 border-border p-4 space-y-3">
        {/* Location Search */}
        <LocationAutocomplete
          value={location}
          onChange={(value) => {
            setLocation(value);
            if (value.trim() === '') {
              setConfirmedLocation('');
              setUseRealTimeData(false);
            }
          }}
          onSelect={handleLocationSelect}
          placeholder="Search destination..."
          hasError={!!placesError}
        />

        {/* Type Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TYPE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = typeFilter === tab.id;
            const count = (useRealTimeData && allFetchedCards.length > 0
              ? allFetchedCards
              : displayCards
            ).filter((c) => c.type === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium flex-shrink-0',
                  'transition-all duration-200',
                  isActive
                    ? 'gradient-primary text-white'
                    : 'border border-border bg-background hover:border-primary/50'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs font-bold',
                  isActive ? 'bg-white/20' : 'bg-muted'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar - Compact */}
        {confirmedLocation && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search places..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Status Bar - Compact */}
        {confirmedLocation && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {(isLoadingPlaces || isFetchingAll) && (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              )}
              <span>{displayCards.length} places</span>
            </div>
            {(searchQuery || filters.rating) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  clearFilters();
                }}
                className="text-primary hover:underline font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {placesError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2">
            <p className="text-xs text-destructive">{placesError}</p>
          </div>
        )}
      </div>

      {/* Filters - Compact Strip */}
      {confirmedLocation && (
        <HorizontalFilters
          activeType={typeFilter}
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {(isLoadingPlaces || isFetchingAll) ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-3"
            >
              {/* Loading skeletons */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border-2 border-border bg-card p-4 animate-pulse"
                >
                  <div className="flex gap-4">
                    <div className="h-[100px] w-[100px] bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : displayCards.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {useRealTimeData && confirmedLocation ? (
                <div className="flex h-full items-center justify-center p-8">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No places found</h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">Popular Destinations</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose a destination to explore hotels, restaurants, and attractions
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {POPULAR_DESTINATIONS.map((dest) => (
                      <motion.button
                        key={dest.name}
                        onClick={() => {
                          setLocation(dest.name);
                          setConfirmedLocation(dest.name);
                          setUseRealTimeData(true);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative overflow-hidden rounded-xl border-2 border-border bg-card transition-all hover:border-primary hover:shadow-lg group"
                      >
                        <div className="aspect-[4/3] relative">
                          <img
                            src={dest.image}
                            alt={dest.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-sm font-semibold text-left truncate">
                              {dest.emoji} {dest.name}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 space-y-3"
            >
              {/* AI Recommendations Section */}
              {useRealTimeData && confirmedLocation && visibleCards.length > 0 && (
                <AIRecommendations
                  destination={confirmedLocation}
                  className="mb-2"
                />
              )}

              {/* Places Grid */}
              <div className="space-y-3">
                {visibleCards.map((card, index) => (
                  <motion.div
                    key={card.id || `place-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.02,
                    }}
                  >
                    <PlaceCard
                      card={card}
                      isHovered={hoveredCardId === card.id}
                      isSelected={selectedCardId === card.id}
                      onHover={(id) => onCardHover?.(id || undefined)}
                      onClick={() => onCardClick?.(card)}
                      onAddToTrip={() => onAddToTrip?.(card)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              {displayCards.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount(prev => Math.min(prev + 20, displayCards.length))}
                  className="w-full py-2.5 text-sm text-primary font-medium hover:bg-accent rounded-lg transition-colors border border-dashed border-border hover:border-primary"
                >
                  Show {Math.min(20, displayCards.length - visibleCount)} More
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
