'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plane, Globe, Sparkles, X, Compass, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutocomplete } from '@/hooks/useAutocomplete';
import type { AutocompletePrediction } from '@/app/api/places/autocomplete/route';
import {
  RegionFilter,
  DestinationGrid,
  WorldMap,
  DISCOVER_DESTINATIONS,
  COLLECTION_FILTERS,
  type Region,
  type DiscoverDestination,
} from '@/components/discover';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/adsense/config';

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionParam = searchParams.get('collection');
  const activeCollection = collectionParam && COLLECTION_FILTERS[collectionParam] ? collectionParam : null;

  const [selectedRegion, setSelectedRegion] = useState<Region>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Use cached autocomplete hook instead of manual fetch
  const { predictions: suggestions, isLoading } = useAutocomplete({
    input: searchQuery,
    types: '(cities)',
    enabled: showAutocomplete,
  });

  const handleDestinationSelect = useCallback(
    (destination: DiscoverDestination) => {
      router.push(`/travel?destination=${encodeURIComponent(destination.name)}`);
    },
    [router]
  );

  const clearCollection = useCallback(() => {
    router.push('/discover');
  }, [router]);

  const handleAutocompleteSelect = useCallback((suggestion: AutocompletePrediction) => {
    setShowAutocomplete(false);
    setSearchQuery(suggestion.main_text);
    router.push(`/travel?destination=${encodeURIComponent(suggestion.main_text)}`);
  }, [router]);

  // Check for error query parameters on mount
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

      // Clean up URL by removing error params
      router.replace('/discover', { scroll: false });

      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  // Note: Removed manual autocomplete fetch - now using useAutocomplete hook with caching

  return (
    <div className="min-h-screen bg-background">
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

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Voyagr</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/discover"
                className="hidden sm:block text-sm font-medium text-primary"
              >
                Destinations
              </Link>
              <Link
                href="/trips"
                className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                My Trips
              </Link>
              <Link
                href="/plan"
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Start Planning
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Explore the World
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover amazing destinations from around the globe. Browse by region, explore
              the map, or search for your dream destination.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-12"
          >
            <WorldMap
              destinations={DISCOVER_DESTINATIONS}
              selectedRegion={selectedRegion}
              onDestinationSelect={handleDestinationSelect}
            />
          </motion.div>

          {/* Section Divider Ad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-12 flex justify-center"
          >
            <AdSlot
              slot={AD_SLOTS.DISCOVER_SECTION_DIVIDER}
              format="horizontal"
              responsive={true}
              layout="display"
              priority="normal"
            />
          </motion.div>

          {/* Destination Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <DestinationGrid
              selectedRegion={selectedRegion}
              searchQuery={searchQuery}
              collectionFilter={activeCollection || undefined}
            />
          </motion.div>

          {/* AI Suggestion CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16"
          >
            <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-3xl p-8 sm:p-12 border border-border/50 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-6">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Not sure where to go?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Let our AI help you discover the perfect destination based on your preferences,
                budget, and travel style.
              </p>
              <Link
                href="/plan"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Sparkles className="h-5 w-5" />
                Get AI Recommendations
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Plane className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Voyagr</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Voyagr. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading destinations...</div>
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  );
}
