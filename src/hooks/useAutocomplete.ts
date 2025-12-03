import { useState, useEffect, useCallback, useRef } from 'react';
import type { AutocompletePrediction } from '@/app/api/places/autocomplete/route';

export interface UseAutocompleteOptions {
  input: string;
  types?: string;
  enabled?: boolean;
  debounceMs?: number;
}

export interface UseAutocompleteReturn {
  predictions: AutocompletePrediction[];
  isLoading: boolean;
  error: string | null;
  clear: () => void;
}

// Client-side cache
const cache = new Map<string, { predictions: AutocompletePrediction[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 300; // Minimum 300ms between requests

/**
 * Custom hook for Google Places Autocomplete
 * Features:
 * - Fast debouncing (150ms for autocomplete)
 * - Client-side caching
 * - Loading and error states
 * - Manual clear function
 */
export function useAutocomplete(options: UseAutocompleteOptions): UseAutocompleteReturn {
  const {
    input,
    types = '(cities)',
    enabled = true,
    debounceMs = 350, // Increased debounce to prevent rate limiting
  } = options;

  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const fetchPredictions = useCallback(async (searchInput: string, searchTypes: string) => {
    if (!searchInput || searchInput.trim().length < 2) {
      setPredictions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache
    const cacheKey = `${searchInput}:${searchTypes}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setPredictions(cached.predictions);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Rate limiting - wait if we're making requests too fast
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      // Wait for the remaining time before making the request
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    setIsLoading(true);
    setError(null);

    try {
      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const queryParams = new URLSearchParams({
        input: searchInput,
        types: searchTypes,
      });

      const response = await fetch(`/api/places/autocomplete?${queryParams.toString()}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch suggestions');
      }

      const data = await response.json();
      const newPredictions = data.predictions || [];

      // Update cache
      cache.set(cacheKey, { predictions: newPredictions, timestamp: Date.now() });

      // Clean old cache entries
      if (cache.size > 50) {
        const oldestKeys = Array.from(cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, 10)
          .map(([key]) => key);
        oldestKeys.forEach(key => cache.delete(key));
      }

      setPredictions(newPredictions);
      setError(null);
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      // Handle rate limiting silently - don't show error to user
      if (err instanceof Error && err.message.toLowerCase().includes('too many requests')) {
        console.warn('Rate limited by Google Places API, will retry on next input');
        // Don't show error to user, just clear predictions
        setPredictions([]);
        return;
      }

      console.error('Autocomplete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced fetch effect
  useEffect(() => {
    if (!enabled) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't show loading for very short inputs
    if (input.trim().length < 2) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    // Show loading immediately for better UX
    setIsLoading(true);

    // Debounce the fetch
    debounceTimerRef.current = setTimeout(() => {
      fetchPredictions(input, types);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [input, types, enabled, debounceMs, fetchPredictions]);

  const clear = useCallback(() => {
    setPredictions([]);
    setIsLoading(false);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    predictions,
    isLoading,
    error,
    clear,
  };
}
