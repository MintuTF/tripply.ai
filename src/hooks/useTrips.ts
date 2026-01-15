'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateUUID } from '@/lib/utils';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  createdAt: string;
}

const STORAGE_KEY = 'voyagr_trips';
const CURRENT_TRIP_KEY = 'voyagr_current_trip';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTripState] = useState<Trip | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load trips from localStorage on mount
  useEffect(() => {
    try {
      const storedTrips = localStorage.getItem(STORAGE_KEY);
      if (storedTrips) {
        setTrips(JSON.parse(storedTrips));
      }

      const storedCurrentTrip = localStorage.getItem(CURRENT_TRIP_KEY);
      if (storedCurrentTrip) {
        setCurrentTripState(JSON.parse(storedCurrentTrip));
      }
    } catch (e) {
      console.error('Failed to load trips from localStorage:', e);
    }
    setIsLoaded(true);
  }, []);

  // Add a new trip
  const addTrip = useCallback((name: string, destination: string): Trip => {
    const newTrip: Trip = {
      id: generateUUID(),
      name,
      destination,
      createdAt: new Date().toISOString(),
    };

    setTrips((prev) => {
      const updated = [newTrip, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save trips:', e);
      }
      return updated;
    });

    // Set as current trip
    setCurrentTripState(newTrip);
    try {
      localStorage.setItem(CURRENT_TRIP_KEY, JSON.stringify(newTrip));
    } catch (e) {
      console.error('Failed to save current trip:', e);
    }

    return newTrip;
  }, []);

  // Set current trip
  const setCurrentTrip = useCallback((trip: Trip | null) => {
    setCurrentTripState(trip);
    try {
      if (trip) {
        localStorage.setItem(CURRENT_TRIP_KEY, JSON.stringify(trip));
      } else {
        localStorage.removeItem(CURRENT_TRIP_KEY);
      }
    } catch (e) {
      console.error('Failed to update current trip:', e);
    }
  }, []);

  // Remove a trip
  const removeTrip = useCallback((tripId: string) => {
    setTrips((prev) => {
      const updated = prev.filter((t) => t.id !== tripId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save trips:', e);
      }
      return updated;
    });

    // Clear current trip if it was the removed one
    if (currentTrip?.id === tripId) {
      setCurrentTrip(null);
    }
  }, [currentTrip, setCurrentTrip]);

  // Update trip name
  const updateTripName = useCallback((tripId: string, newName: string) => {
    setTrips((prev) => {
      const updated = prev.map((t) =>
        t.id === tripId ? { ...t, name: newName } : t
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save trips:', e);
      }
      return updated;
    });

    // Update current trip if it's the one being renamed
    if (currentTrip?.id === tripId) {
      const updatedTrip = { ...currentTrip, name: newName };
      setCurrentTrip(updatedTrip);
    }
  }, [currentTrip, setCurrentTrip]);

  return {
    trips,
    currentTrip,
    isLoaded,
    addTrip,
    setCurrentTrip,
    removeTrip,
    updateTripName,
  };
}
