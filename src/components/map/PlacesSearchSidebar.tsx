'use client';

import { Card, CardType } from '@/types';
import { useState, useEffect } from 'react';
import { useMapSearch } from '@/hooks/useMapSearch';
import { usePlacesSearch } from '@/hooks/usePlacesSearch';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { HorizontalFilters } from './HorizontalFilters';
import { PlaceListItem } from './PlaceListItem';
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

  // Store ALL fetched results across all types
  const [allFetchedCards, setAllFetchedCards] = useState<Card[]>([]);
  const [isFetchingAll, setIsFetchingAll] = useState(false);

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

  // Determine which cards to display (filter from allFetchedCards if we have data)
  const filteredCards = useRealTimeData && confirmedLocation.trim() !== ''
    ? (allFetchedCards.length > 0
        ? allFetchedCards.filter(card => {
            // Filter by type
            if (typeFilter !== 'all' && card.type !== typeFilter) return false;
            // Filter by search query
            if (searchQuery) {
              const payload = typeof card.payload_json === 'string'
                ? JSON.parse(card.payload_json)
                : card.payload_json;
              const name = payload.name || payload.title || '';
              if (!name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
              }
            }
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
        : (realTimePlaces || []).filter(card => {
            // Also filter realTimePlaces by rating
            if (filters.rating !== null) {
              const payload = typeof card.payload_json === 'string'
                ? JSON.parse(card.payload_json)
                : card.payload_json;
              if (!payload.rating || payload.rating < filters.rating) {
                return false;
              }
            }
            return true;
          }))
    : localFilteredCards;

  // Deduplicate cards by id to prevent React key warnings
  const displayCards = filteredCards.filter((card, index, self) =>
    index === self.findIndex((c) => c.id === card.id)
  );

  // Handle autocomplete selection (confirmed selection)
  const handleLocationSelect = (prediction: AutocompletePrediction) => {
    console.log('[PlacesSearchSidebar] Location selected:', prediction.description);
    setLocation(prediction.description);
    setConfirmedLocation(prediction.description);
    setUseRealTimeData(true);
  };

  // Fetch all types in parallel when location changes
  useEffect(() => {
    if (!useRealTimeData || !confirmedLocation || confirmedLocation.trim() === '') {
      setAllFetchedCards([]);
      return;
    }

    const fetchAllTypes = async () => {
      setIsFetchingAll(true);
      try {
        // Fetch all 3 types in parallel
        const types: CardType[] = ['hotel', 'food', 'spot'];
        const promises = types.map(async (type) => {
          const queryParams = new URLSearchParams({
            location: confirmedLocation,
            type,
          });
          if (tripId) queryParams.append('trip_id', tripId);

          const response = await fetch(`/api/places/search?${queryParams.toString()}`);
          if (!response.ok) return [];

          const result = await response.json();
          return result.cards || [];
        });

        const results = await Promise.all(promises);
        // Merge all results
        const allCards = results.flat();
        setAllFetchedCards(allCards);
      } catch (error) {
        console.error('Failed to fetch all types:', error);
        setAllFetchedCards([]);
      } finally {
        setIsFetchingAll(false);
      }
    };

    fetchAllTypes();
  }, [confirmedLocation, useRealTimeData, tripId]);

  // Notify parent of search results changes
  useEffect(() => {
    if (useRealTimeData && confirmedLocation.trim() !== '') {
      onSearchResultsChange?.(allFetchedCards.length > 0 ? displayCards : (realTimePlaces || []));
    } else {
      onSearchResultsChange?.(null);
    }
  }, [allFetchedCards.length, realTimePlaces, useRealTimeData, confirmedLocation]);

  // Notify parent of location changes
  useEffect(() => {
    onLocationChange?.(confirmedLocation);
  }, [confirmedLocation]);

  return (
    <div className="flex h-full w-[420px] flex-col border-r-2 border-border bg-card/50 backdrop-blur-sm">
      <div className="border-b-2 border-border p-4 space-y-4">
        {/* Location/City Search with Autocomplete */}
        <LocationAutocomplete
          value={location}
          onChange={(value) => {
            setLocation(value);
            // Don't trigger search while typing - only on selection
            if (value.trim() === '') {
              setConfirmedLocation('');
              setUseRealTimeData(false);
            }
          }}
          onSelect={handleLocationSelect}
          placeholder="Try Dallas, TX or Paris, France"
          hasError={!!placesError}
        />

        {/* Search within results */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={useRealTimeData && location ? "Search hotels, restaurants..." : "Search saved places..."}
            className={cn(
              'w-full rounded-xl border-2 border-border bg-background pl-10 pr-10 py-3',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'transition-all duration-300',
              'focus:outline-none focus:border-primary focus:shadow-glow'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {TYPE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = typeFilter === tab.id;
            // Calculate count from ALL fetched cards (not just filtered displayCards)
            const count = (useRealTimeData && allFetchedCards.length > 0
              ? allFetchedCards
              : displayCards
            ).filter((c) => c.type === tab.id).length;

            return (
              <motion.button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                  'transition-all duration-300 flex-shrink-0',
                  isActive
                    ? 'gradient-primary text-white shadow-lg'
                    : 'border-2 border-border bg-background text-foreground hover:border-primary/50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <motion.span
                  layout
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {count}
                </motion.span>
              </motion.button>
            );
          })}
        </div>

        {/* Status info */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-xs text-muted-foreground flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            {(isLoadingPlaces || isFetchingAll) && (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            )}
            <span>
              {useRealTimeData && confirmedLocation
                ? `${displayCards.length} places in ${confirmedLocation}`
                : `${displayCards.length} saved places`}
            </span>
          </div>
          {(hasActiveFilters || searchQuery || confirmedLocation) && (
            <motion.button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('hotel');
                setLocation('');
                setConfirmedLocation('');
                setUseRealTimeData(false);
                setAllFetchedCards([]);
                clearFilters();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-primary hover:underline font-medium"
            >
              Clear all
            </motion.button>
          )}
        </motion.div>

        {/* Error state */}
        {placesError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-lg bg-destructive/10 border border-destructive/20 p-3"
          >
            <p className="text-xs text-destructive font-medium leading-relaxed">
              {placesError}
            </p>
          </motion.div>
        )}
      </div>

      <HorizontalFilters
        activeType={typeFilter}
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />

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
              className="p-4 space-y-3"
            >
              {displayCards.map((card, index) => (
                <motion.div
                  key={card.id || `place-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                >
                  <PlaceListItem
                    card={card}
                    isHovered={hoveredCardId === card.id}
                    isSelected={selectedCardId === card.id}
                    onHover={() => onCardHover?.(card.id)}
                    onLeave={() => onCardHover?.(undefined)}
                    onClick={() => onCardClick?.(card)}
                    onAddToTrip={() => onAddToTrip?.(card)}
                    onToggleFavorite={() => {
                      console.log('Toggle favorite:', card.id);
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
