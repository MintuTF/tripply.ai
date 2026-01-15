'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import type { TravelPlace } from '@/lib/travel/types';

const STORAGE_KEY = 'voyagr_places_cache';
const DEFAULT_TTL_MINUTES = 30;
const MAX_CACHED_CITIES = 10;

interface CachedCityPlaces {
  cityKey: string;
  cityName: string;
  coordinates: { lat: number; lng: number };
  places: TravelPlace[];
  timestamp: number;
}

interface PlacesCacheData {
  [cityKey: string]: CachedCityPlaces;
}

interface UsePlacesCacheReturn {
  getCachedPlaces: (cityKey: string) => CachedCityPlaces | null;
  setCachedPlaces: (
    cityName: string,
    coordinates: { lat: number; lng: number },
    places: TravelPlace[]
  ) => void;
  isCacheValid: (cached: CachedCityPlaces) => boolean;
  clearCache: () => void;
  generateCityKey: (cityName: string, coordinates: { lat: number; lng: number }) => string;
  isReady: boolean;
}

/**
 * Generate a unique cache key for a city based on name and coordinates
 * Rounds coordinates to 4 decimal places for consistent matching
 */
function createCityKey(cityName: string, coordinates: { lat: number; lng: number }): string {
  const normalizedName = cityName.toLowerCase().trim().replace(/\s+/g, '_');
  const lat = coordinates.lat.toFixed(4);
  const lng = coordinates.lng.toFixed(4);
  return `${normalizedName}_${lat}_${lng}`;
}

/**
 * Custom hook for managing client-side places cache with TTL and LRU eviction
 */
export function usePlacesCache(ttlMinutes: number = DEFAULT_TTL_MINUTES): UsePlacesCacheReturn {
  const [isReady, setIsReady] = useState(false);
  const cacheRef = useRef<PlacesCacheData>({});
  const ttlMs = ttlMinutes * 60 * 1000;

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        cacheRef.current = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load places cache from localStorage:', e);
      cacheRef.current = {};
    }
    setIsReady(true);
  }, []);

  // Save cache to localStorage
  const persistCache = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheRef.current));
    } catch (e) {
      console.error('Failed to save places cache to localStorage:', e);
    }
  }, []);

  // Generate city key from name and coordinates
  const generateCityKey = useCallback(
    (cityName: string, coordinates: { lat: number; lng: number }) => {
      return createCityKey(cityName, coordinates);
    },
    []
  );

  // Check if cached data is still valid based on TTL
  const isCacheValid = useCallback(
    (cached: CachedCityPlaces): boolean => {
      const age = Date.now() - cached.timestamp;
      return age < ttlMs;
    },
    [ttlMs]
  );

  // Get cached places for a city
  const getCachedPlaces = useCallback(
    (cityKey: string): CachedCityPlaces | null => {
      const cached = cacheRef.current[cityKey];
      if (!cached) return null;

      // Return cached data (let caller check validity)
      return cached;
    },
    []
  );

  // LRU eviction - remove oldest entries if over limit
  const evictOldest = useCallback(() => {
    const entries = Object.entries(cacheRef.current);
    if (entries.length <= MAX_CACHED_CITIES) return;

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest entries until we're at the limit
    const toRemove = entries.length - MAX_CACHED_CITIES;
    for (let i = 0; i < toRemove; i++) {
      delete cacheRef.current[entries[i][0]];
    }
  }, []);

  // Set cached places for a city
  const setCachedPlaces = useCallback(
    (
      cityName: string,
      coordinates: { lat: number; lng: number },
      places: TravelPlace[]
    ) => {
      const cityKey = createCityKey(cityName, coordinates);

      cacheRef.current[cityKey] = {
        cityKey,
        cityName,
        coordinates,
        places,
        timestamp: Date.now(),
      };

      // Evict oldest if over limit
      evictOldest();

      // Persist to localStorage
      persistCache();
    },
    [evictOldest, persistCache]
  );

  // Clear all cached places
  const clearCache = useCallback(() => {
    cacheRef.current = {};
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear places cache from localStorage:', e);
    }
  }, []);

  return {
    getCachedPlaces,
    setCachedPlaces,
    isCacheValid,
    clearCache,
    generateCityKey,
    isReady,
  };
}
