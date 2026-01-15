'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3x3,
  List,
  MapPin,
  ArrowUpDown,
  Check,
  Heart,
  Calendar,
  Star,
  DollarSign,
  X,
  Loader2,
  ArrowUp,
  LayoutGrid,
  Columns2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaceCard } from '@/types';
import { ChatMapSidebar } from './ChatMapSidebar';
import { ComparisonView } from './ComparisonView';
import { MapDrawer } from './MapDrawer';

type ViewMode = 'grid' | 'list' | 'map' | 'split';
type SortMode = 'relevance' | 'rating' | 'price';

interface ResultsAreaProps {
  places: PlaceCard[];
  destinationCoords?: { lat: number; lng: number } | null;
  onSaveCard?: (place: PlaceCard, day?: number) => void;
  onRemoveCard?: (placeId: string) => void;
  className?: string;
}

const INITIAL_ITEMS = 12; // Show 12 cards initially (3 rows of 4)
const ITEMS_PER_PAGE = 8; // Load 8 more at a time (2 rows of 4)

export function ResultsArea({
  places,
  destinationCoords,
  onSaveCard,
  onRemoveCard,
  className,
}: ResultsAreaProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('relevance');
  const [isComparing, setIsComparing] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(INITIAL_ITEMS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const resultsTopRef = useRef<HTMLDivElement>(null);

  // Sort places based on current sort mode
  const sortedPlaces = [...places].sort((a, b) => {
    switch (sortMode) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'price':
        const priceA = a.price_per_night || a.price || a.price_level || 0;
        const priceB = b.price_per_night || b.price || b.price_level || 0;
        return priceA - priceB;
      default:
        return 0; // Keep original order for relevance
    }
  });

  const handleComparisonToggle = (placeId: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(placeId)) {
        return prev.filter((id) => id !== placeId);
      } else if (prev.length < 4) {
        return [...prev, placeId];
      }
      return prev;
    });
  };

  const handleExitComparison = () => {
    setIsComparing(false);
    setSelectedForComparison([]);
  };

  const selectedPlaces = places.filter((p) => selectedForComparison.includes(p.id));

  // Reset displayed count when places change or sort/view mode changes
  useEffect(() => {
    setDisplayedCount(INITIAL_ITEMS);
  }, [places.length, sortMode, viewMode]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && !isLoadingMore && displayedCount < sortedPlaces.length) {
          setIsLoadingMore(true);
          // Simulate loading delay for better UX
          setTimeout(() => {
            setDisplayedCount((prev) => Math.min(prev + ITEMS_PER_PAGE, sortedPlaces.length));
            setIsLoadingMore(false);
          }, 500);
        }
      },
      {
        root: null,
        rootMargin: '200px', // Start loading 200px before reaching the bottom
        threshold: 0.1,
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [displayedCount, isLoadingMore, sortedPlaces.length]);

  // Get the displayed subset of places
  const displayedPlaces = sortedPlaces.slice(0, displayedCount);
  const hasMore = displayedCount < sortedPlaces.length;

  // Handle scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 800);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={cn('w-full', className)} ref={resultsTopRef}>
      {/* Results Toolbar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  'active:scale-95'
                )}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  'active:scale-95'
                )}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  viewMode === 'split'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  'lg:flex hidden', // Hide on mobile/tablet
                  'active:scale-95',
                  !destinationCoords && 'opacity-50 cursor-not-allowed'
                )}
                title="Split view with map (desktop only)"
                disabled={!destinationCoords}
              >
                <Columns2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setViewMode('map');
                  setIsMapOpen(true);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  viewMode === 'map'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  'active:scale-95'
                )}
                title="Map only"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>

            {/* Compare Mode Toggle */}
            <button
              onClick={() => {
                setIsComparing(!isComparing);
                if (isComparing) {
                  setSelectedForComparison([]);
                }
              }}
              className={cn(
                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2',
                isComparing
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-card hover:bg-accent hover:border-primary/30',
                'active:scale-95'
              )}
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Compare</span>
              <span className="sm:hidden">Cmp</span>
              {selectedForComparison.length > 0 && (
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-primary-foreground/20 text-xs">
                  {selectedForComparison.length}
                </span>
              )}
            </button>
          </div>

          {/* Right: Sort Dropdown */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="hidden sm:inline text-sm text-muted-foreground">Sort by:</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-border bg-card text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Highest Rated</option>
              <option value="price">Lowest Price</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
          Showing {displayedPlaces.length} of {places.length} {places.length === 1 ? 'place' : 'places'}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3 sm:p-4 min-h-[calc(100vh-680px)]">
        {/* Show comparison view if in comparison mode with selections */}
        {isComparing && selectedForComparison.length > 0 ? (
          <ComparisonView
            places={selectedPlaces}
            onExit={handleExitComparison}
            onSaveCard={onSaveCard}
            onRemoveFromComparison={(placeId) => {
              setSelectedForComparison((prev) => prev.filter((id) => id !== placeId));
            }}
          />
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {displayedPlaces.map((place) => (
                      <PlaceCardComponent
                        key={place.id}
                        place={place}
                        onSave={onSaveCard}
                        onRemove={onRemoveCard}
                        isComparing={isComparing}
                        isSelected={selectedForComparison.includes(place.id)}
                        onComparisonToggle={handleComparisonToggle}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Infinite Scroll Trigger & Loading */}
                {hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isLoadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading more places...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Split View (60/40 layout with map) - Desktop Only */}
            {viewMode === 'split' && destinationCoords && (
              <>
                {/* Desktop: Split Layout */}
                <div className="hidden lg:flex gap-6 h-[calc(100vh-320px)] min-h-[600px]">
                  {/* Left: Results Grid (60%) */}
                  <div className="w-3/5 flex-shrink-0 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {displayedPlaces.map((place) => (
                        <PlaceCardComponent
                          key={place.id}
                          place={place}
                          onSave={onSaveCard}
                          onRemove={onRemoveCard}
                          isComparing={isComparing}
                          isSelected={selectedForComparison.includes(place.id)}
                          onComparisonToggle={handleComparisonToggle}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Infinite Scroll Trigger & Loading */}
                  {hasMore && (
                    <div ref={loadMoreRef} className="flex justify-center py-8">
                      {isLoadingMore && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Loading more places...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Sticky Map (40%) */}
                <div className="w-2/5 flex-shrink-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="sticky top-4 rounded-2xl border border-border overflow-hidden shadow-lg h-full"
                  >
                    <ChatMapSidebar
                      places={places}
                      center={destinationCoords}
                      onPlaceClick={(place) => {
                        // Scroll to card in grid
                        const cardElement = document.getElementById(`place-card-${place.id}`);
                        cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="h-full"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Mobile/Tablet: Show message to switch to grid view */}
              <div className="lg:hidden text-center py-12 px-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
                >
                  <Columns2 className="w-8 h-8 text-primary" />
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Split view is available on larger screens
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Switch to grid or list view, or use a larger device to see split view with map
                </p>
                <motion.button
                  onClick={() => setViewMode('grid')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Switch to Grid View
                </motion.button>
              </div>
            </>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <>
                <div className="space-y-3">
                  <AnimatePresence>
                    {displayedPlaces.map((place) => (
                      <PlaceCardListItem
                        key={place.id}
                        place={place}
                        onSave={onSaveCard}
                        onRemove={onRemoveCard}
                        isComparing={isComparing}
                        isSelected={selectedForComparison.includes(place.id)}
                        onComparisonToggle={handleComparisonToggle}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Infinite Scroll Trigger & Loading */}
                {hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isLoadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading more places...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {places.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No places found</h3>
                <p className="text-sm text-muted-foreground">
                  Try asking the AI assistant for recommendations
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Map Drawer */}
      {destinationCoords && (
        <MapDrawer
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          places={places}
          center={destinationCoords}
          onPlaceClick={(place) => {
            // Scroll to card in grid
            const cardElement = document.getElementById(`place-card-${place.id}`);
            cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />
      )}

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
            title="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// Grid Card Component (matching Discovery card design)
function PlaceCardComponent({
  place,
  onSave,
  onRemove,
  isComparing,
  isSelected,
  onComparisonToggle,
}: {
  place: PlaceCard;
  onSave?: (place: PlaceCard, day?: number) => void;
  onRemove?: (placeId: string) => void;
  isComparing: boolean;
  isSelected: boolean;
  onComparisonToggle: (placeId: string) => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const priceLabel = place.price_per_night
    ? `$${place.price_per_night}/night`
    : place.price
    ? `$${place.price}`
    : place.price_level
    ? '$'.repeat(place.price_level)
    : null;

  return (
    <motion.div
      id={`place-card-${place.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'group relative rounded-2xl overflow-hidden bg-card border shadow-sm hover:shadow-xl transition-all duration-300',
        isSelected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-border/50 hover:border-primary/30'
      )}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        {place.photos?.[0] && (
          <motion.img
            src={place.photos[0]}
            alt={place.name}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              isHovered && 'scale-110'
            )}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Comparison Checkbox (top-left when in compare mode) */}
        {isComparing && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onComparisonToggle(place.id);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-white/90 border-border hover:border-primary'
            )}
          >
            {isSelected && <Check className="w-4 h-4" />}
          </motion.button>
        )}

        {/* Type badge */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-foreground capitalize">
          {place.type}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate mb-1">
          {place.name}
        </h3>

        {place.address && (
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span>{place.address}</span>
          </p>
        )}

        <div className="flex items-center gap-3 text-sm mb-3">
          {place.rating && (
            <span className="flex items-center gap-1 font-medium">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {place.rating.toFixed(1)}
              {place.review_count && (
                <span className="text-muted-foreground text-xs">
                  ({place.review_count > 999 ? `${(place.review_count / 1000).toFixed(1)}k` : place.review_count})
                </span>
              )}
            </span>
          )}
          {priceLabel && (
            <span className="text-green-600 font-medium">{priceLabel}</span>
          )}
        </div>

        {place.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {place.description}
          </p>
        )}

        {/* Day Assignment & Save */}
        {onSave && (
          <div className="flex gap-2">
            <select
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const day = parseInt(e.target.value);
                if (day > 0) {
                  onSave(place, day);
                }
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-medium hover:border-primary/50 focus:outline-none focus:border-primary transition-colors"
              defaultValue="0"
            >
              <option value="0">Select day...</option>
              {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </select>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onSave(place);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center gap-1.5"
              title="Save without day assignment"
            >
              <Heart className="h-4 w-4" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// List Item Component (matching Discovery card design)
function PlaceCardListItem({
  place,
  onSave,
  onRemove,
  isComparing,
  isSelected,
  onComparisonToggle,
}: {
  place: PlaceCard;
  onSave?: (place: PlaceCard, day?: number) => void;
  onRemove?: (placeId: string) => void;
  isComparing: boolean;
  isSelected: boolean;
  onComparisonToggle: (placeId: string) => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const priceLabel = place.price_per_night
    ? `$${place.price_per_night}/night`
    : place.price
    ? `$${place.price}`
    : place.price_level
    ? '$'.repeat(place.price_level)
    : null;

  return (
    <motion.div
      id={`place-card-${place.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        'flex gap-4 p-4 rounded-2xl border bg-card shadow-sm hover:shadow-lg transition-all duration-300',
        isSelected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-border/50 hover:border-primary/30'
      )}
    >
      {/* Comparison Checkbox */}
      {isComparing && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onComparisonToggle(place.id);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 self-start mt-2',
            isSelected
              ? 'bg-primary border-primary text-primary-foreground'
              : 'bg-white/90 border-border hover:border-primary'
          )}
        >
          {isSelected && <Check className="w-4 h-4" />}
        </motion.button>
      )}

      {/* Thumbnail with loading state */}
      <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        {place.photos?.[0] && (
          <img
            src={place.photos[0]}
            alt={place.name}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              'w-full h-full object-cover transition-all',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        )}
        {/* Type badge */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-medium text-foreground capitalize">
          {place.type}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground mb-1">{place.name}</h3>
        {place.address && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{place.address}</span>
          </p>
        )}

        <div className="flex items-center gap-3 text-sm mb-2">
          {place.rating && (
            <span className="flex items-center gap-1 font-medium">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {place.rating.toFixed(1)}
              {place.review_count && (
                <span className="text-muted-foreground text-xs">
                  ({place.review_count > 999 ? `${(place.review_count / 1000).toFixed(1)}k` : place.review_count})
                </span>
              )}
            </span>
          )}
          {priceLabel && (
            <span className="text-green-600 font-medium">{priceLabel}</span>
          )}
        </div>

        {place.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {place.description}
          </p>
        )}
      </div>

      {/* Actions */}
      {onSave && (
        <div className="flex gap-2 items-start flex-shrink-0 mt-2">
          <select
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const day = parseInt(e.target.value);
              if (day > 0) {
                onSave(place, day);
              }
            }}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-medium hover:border-primary/50 focus:outline-none focus:border-primary transition-colors"
            defaultValue="0"
          >
            <option value="0">Day...</option>
            {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                Day {day}
              </option>
            ))}
          </select>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onSave(place);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            title="Save"
          >
            <Heart className="h-4 w-4" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
