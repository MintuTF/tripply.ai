import { useState, useEffect, useCallback, useRef } from 'react';
import type { Card, CardType, Citation } from '@/types';

export interface PlacesSearchParams {
  location: string;
  query?: string;
  type?: CardType | 'all';
  tripId?: string;
  minRating?: number;
  priceLevel?: number[];
  radius?: number;
  enabled?: boolean; // Allow disabling the search
}

export interface PlacesSearchResult {
  cards: Card[];
  sources?: Citation[];
  timestamp?: string;
}

export interface UsePlacesSearchReturn {
  data: Card[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  sources?: Citation[];
}

// Client-side cache to avoid redundant requests
const searchCache = new Map<string, { data: PlacesSearchResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook for searching places with Google Places API
 * Features:
 * - Automatic debouncing (300ms)
 * - Client-side caching (5 min TTL)
 * - Loading and error states
 * - Manual refetch capability
 */
export function usePlacesSearch(params: PlacesSearchParams): UsePlacesSearchReturn {
  const {
    location,
    query = '',
    type = 'all',
    tripId,
    minRating,
    priceLevel,
    radius,
    enabled = true,
  } = params;

  const [data, setData] = useState<Card[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<Citation[] | undefined>(undefined);

  // Use ref to track the latest search params for refetch
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const fetchPlaces = useCallback(async (searchParams: PlacesSearchParams) => {
    const { location, query, type, tripId, minRating, priceLevel, radius } = searchParams;

    if (!location || !enabled) {
      setData(null);
      setIsLoading(false);
      return;
    }

    // Require at least 3 characters to reduce invalid geocoding attempts
    if (location.trim().length < 3) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Build cache key
    const cacheKey = `${location}:${query}:${type}:${minRating}:${priceLevel?.join(',')}:${radius}`;

    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data.cards);
      setSources(cached.data.sources);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build query string
      const queryParams = new URLSearchParams({
        location,
      });

      if (query) queryParams.append('query', query);
      if (type && type !== 'all') queryParams.append('type', type);
      if (tripId) queryParams.append('trip_id', tripId);
      if (minRating !== undefined) queryParams.append('min_rating', minRating.toString());
      if (priceLevel && priceLevel.length > 0) {
        queryParams.append('price_level', priceLevel.join(','));
      }
      if (radius !== undefined) queryParams.append('radius', radius.toString());

      const response = await fetch(`/api/places/search?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to fetch places';

        // Provide more helpful error messages
        if (errorMessage.includes('Could not geocode location')) {
          throw new Error(`Location "${location}" not found. Please enter a complete city name (e.g., "Paris, France" or "Seattle, WA")`);
        }

        throw new Error(errorMessage);
      }

      const result: PlacesSearchResult = await response.json();

      // Update cache
      searchCache.set(cacheKey, { data: result, timestamp: Date.now() });

      // Clean old cache entries
      if (searchCache.size > 50) {
        const oldestKeys = Array.from(searchCache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, 10)
          .map(([key]) => key);
        oldestKeys.forEach(key => searchCache.delete(key));
      }

      setData(result.cards);
      setSources(result.sources);
      setError(null);
    } catch (err) {
      console.error('Places search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search places');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Debounced search effect
  useEffect(() => {
    if (!enabled || !location) {
      setData(null);
      setIsLoading(false);
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set loading state immediately for better UX
    setIsLoading(true);

    // Debounce the search
    debounceTimerRef.current = setTimeout(() => {
      fetchPlaces(params);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [location, query, type, tripId, minRating, JSON.stringify(priceLevel), radius, enabled, fetchPlaces]);

  // Manual refetch function
  const refetch = useCallback(() => {
    if (enabled && location) {
      fetchPlaces(paramsRef.current);
    }
  }, [enabled, location, fetchPlaces]);

  return {
    data,
    isLoading,
    error,
    refetch,
    sources,
  };
}
