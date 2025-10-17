import { useState, useEffect } from 'react';
import { PlaceCard } from '@/types';

interface TripList {
  places: PlaceCard[];
  saved: PlaceCard[];
}

/**
 * Hook for managing trip list and saved places
 * Uses localStorage for persistence
 */
export function useTripList(tripId?: string) {
  const [tripList, setTripList] = useState<TripList>({
    places: [],
    saved: [],
  });

  // Load from localStorage on mount
  useEffect(() => {
    const storageKey = tripId ? `trip_list_${tripId}` : 'trip_list_default';
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setTripList(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse trip list from localStorage:', error);
      }
    }
  }, [tripId]);

  // Save to localStorage whenever tripList changes
  useEffect(() => {
    const storageKey = tripId ? `trip_list_${tripId}` : 'trip_list_default';
    localStorage.setItem(storageKey, JSON.stringify(tripList));
  }, [tripList, tripId]);

  const addToTrip = (card: PlaceCard) => {
    setTripList((prev) => {
      // Check if already in trip
      if (prev.places.some((p) => p.id === card.id)) {
        return prev;
      }
      return {
        ...prev,
        places: [...prev.places, card],
      };
    });
  };

  const removeFromTrip = (cardId: string) => {
    setTripList((prev) => ({
      ...prev,
      places: prev.places.filter((p) => p.id !== cardId),
    }));
  };

  const savePlace = (card: PlaceCard) => {
    setTripList((prev) => {
      // Toggle save status
      const isSaved = prev.saved.some((p) => p.id === card.id);
      if (isSaved) {
        return {
          ...prev,
          saved: prev.saved.filter((p) => p.id !== card.id),
        };
      } else {
        return {
          ...prev,
          saved: [...prev.saved, card],
        };
      }
    });
  };

  const isInTrip = (cardId: string) => {
    return tripList.places.some((p) => p.id === cardId);
  };

  const isSaved = (cardId: string) => {
    return tripList.saved.some((p) => p.id === cardId);
  };

  const clearTrip = () => {
    setTripList({
      places: [],
      saved: [],
    });
  };

  return {
    tripPlaces: tripList.places,
    savedPlaces: tripList.saved,
    addToTrip,
    removeFromTrip,
    savePlace,
    isInTrip,
    isSaved,
    clearTrip,
  };
}
