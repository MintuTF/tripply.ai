'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Compass, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  RegionFilter,
  DestinationGrid,
  WorldMap,
  COLLECTION_FILTERS,
  type Region,
} from '@/components/discover';

interface AutocompletePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface ExploreDestinationsProps {
  initialCollection?: string | null;
  onCollectionChange?: (collection: string | null) => void;
}

export function ExploreDestinations({
  initialCollection,
  onCollectionChange,
}: ExploreDestinationsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedRegion, setSelectedRegion] = useState<Region>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle error from URL params
  useEffect(() => {
    const error = searchParams.get('error');
    const attemptedCity = searchParams.get('attempted');

    if (error === 'invalid-city' && attemptedCity) {
      setErrorMessage(`We couldn't find "${attemptedCity}". Try searching for a different destination below.`);
      setShowErrorToast(true);

      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => {
        setShowErrorToast(false);
      }, 5000);

      // Clean up URL by removing error params (replace with clean URL)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('attempted');
      router.replace(newUrl.pathname + newUrl.search + newUrl.hash, { scroll: false });

      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  // Debounced autocomplete API call
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.predictions || []);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsLoading(false);
    };
  }, [searchQuery]);

  const handleAutocompleteSelect = useCallback((suggestion: AutocompletePrediction) => {
    setShowAutocomplete(false);
    setSearchQuery(suggestion.main_text);
    router.push(`/research?destination=${encodeURIComponent(suggestion.main_text)}`);
  }, [router]);

  const clearCollection = useCallback(() => {
    onCollectionChange?.(null);
  }, [onCollectionChange]);

  const activeCollection = initialCollection && COLLECTION_FILTERS[initialCollection]
    ? initialCollection
    : null;

  return (
    <section id="explore-destinations" className="py-16 bg-background scroll-mt-16">
      {/* Error Toast */}
      <AnimatePresence>
        {showErrorToast && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4"
          >
            <div className="bg-card border border-destructive/50 rounded-2xl shadow-2xl p-5 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">Destination Not Found</h3>
                  <p className="text-sm text-muted-foreground">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setShowErrorToast(false)}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label="Dismiss error"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Explore Destinations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse destinations by region, explore the interactive map, or search for your dream destination.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <input
              type="text"
              placeholder="Search destinations, countries, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              className={cn(
                'w-full pl-12 pr-4 py-4 rounded-xl',
                'bg-card border border-border',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                'transition-all duration-200'
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                Clear
              </button>
            )}

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {showAutocomplete && searchQuery.trim().length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-4 gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Searching...</span>
                    </div>
                  )}

                  {/* Autocomplete Results */}
                  {!isLoading && suggestions.length > 0 && (
                    <div className="max-h-64 overflow-y-auto py-2">
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Search Results
                      </div>
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          onClick={() => handleAutocompleteSelect(suggestion)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground truncate">{suggestion.main_text}</div>
                            <div className="text-sm text-muted-foreground truncate">{suggestion.secondary_text}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No Results */}
                  {!isLoading && suggestions.length === 0 && searchQuery.trim().length >= 2 && (
                    <div className="py-4 px-4 text-center text-sm text-muted-foreground">
                      No destinations found. Try browsing the map or grid below.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Region Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <RegionFilter
            selectedRegion={activeCollection ? 'all' : selectedRegion}
            onRegionChange={setSelectedRegion}
          />
        </motion.div>

        {/* Active Collection Badge */}
        {activeCollection && COLLECTION_FILTERS[activeCollection] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-primary/10 border border-primary/20 rounded-2xl">
                <Compass className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">
                  Browsing: {COLLECTION_FILTERS[activeCollection].title}
                </span>
                <button
                  onClick={clearCollection}
                  className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
                  aria-label="Clear collection filter"
                >
                  <X className="h-4 w-4 text-primary" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* World Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <WorldMap
            selectedRegion={selectedRegion}
            onDestinationSelect={(destination) => {
              router.push(`/research?destination=${encodeURIComponent(destination.name)}`);
            }}
          />
        </motion.div>

        {/* Destination Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <DestinationGrid
            selectedRegion={selectedRegion}
            searchQuery={searchQuery}
            collectionFilter={activeCollection || undefined}
          />
        </motion.div>
      </div>
    </section>
  );
}
