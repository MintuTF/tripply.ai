'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing localStorage with SSR safety
 * @param key - The localStorage key
 * @param initialValue - Default value if nothing in storage
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Track if we've hydrated from localStorage
  const [isHydrated, setIsHydrated] = useState(false);

  // Use ref to access current value without adding to dependencies
  const storedValueRef = useRef(storedValue);
  storedValueRef.current = storedValue;

  // Hydrate on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error hydrating localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  // Using ref to avoid recreating this callback when storedValue changes
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValueRef.current) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return { value: storedValue, setValue, removeValue, isHydrated };
}

/**
 * Specific hook for trip draft data
 */
export interface DraftTripData {
  trip: {
    id: string;
    title: string;
    dates: { start: string; end: string } | null;
    destination: string | null;
  };
  cards: any[]; // Using Card type from types/index.ts
  lastModified: string;
}

const DEFAULT_DRAFT: DraftTripData = {
  trip: {
    id: 'draft',
    title: 'My Trip',
    dates: null,
    destination: null,
  },
  cards: [],
  lastModified: new Date().toISOString(),
};

export function useDraftTrip() {
  const { value, setValue, removeValue, isHydrated } = useLocalStorage<DraftTripData>(
    'tripply_draft_trip',
    DEFAULT_DRAFT
  );

  const updateDraft = useCallback(
    (updates: Partial<DraftTripData>) => {
      setValue((prev) => ({
        ...prev,
        ...updates,
        lastModified: new Date().toISOString(),
      }));
    },
    [setValue]
  );

  const clearDraft = useCallback(() => {
    removeValue();
  }, [removeValue]);

  return {
    draft: value,
    updateDraft,
    clearDraft,
    isHydrated,
  };
}
