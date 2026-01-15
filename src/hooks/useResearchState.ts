import { useState, useEffect, useCallback } from 'react';
import type { Card, PlaceCard, Trip } from '@/types';
import {
  saveCardToLocalDraft,
  loadCardsFromLocalDraft,
  removeCardFromLocalDraft,
} from '@/lib/research/tripManager';

interface ResearchState {
  cards: Card[];
  aiPlaces: PlaceCard[];
  isLoading: boolean;

  // Card operations
  savePlace: (place: PlaceCard, label?: string, day?: number) => Promise<void>;
  removeCard: (cardId: string) => Promise<void>;
  updateCardLabel: (cardId: string, label: string) => Promise<void>;
  assignToDay: (cardId: string, day: number) => Promise<void>;

  // AI operations
  clearAiPlaces: () => void;
  addAiPlace: (place: PlaceCard) => void;
  setAiPlaces: (places: PlaceCard[]) => void;
}

export function useResearchState(trip: Trip | null): ResearchState {
  const [cards, setCards] = useState<Card[]>([]);
  const [aiPlaces, setAiPlaces] = useState<PlaceCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cards for trip on mount
  useEffect(() => {
    if (!trip?.id) return;

    const loadCards = async () => {
      setIsLoading(true);

      try {
        const isLocalDraft = trip.id.startsWith('research-draft-');

        if (isLocalDraft && trip.destination?.name) {
          // Load from localStorage for local drafts
          const localCards = loadCardsFromLocalDraft(trip.destination.name);
          setCards(localCards || []);
        } else {
          // Load from API for authenticated trips
          const response = await fetch(`/api/cards?trip_id=${trip.id}`);
          if (response.ok) {
            const { cards: loadedCards } = await response.json();
            setCards(loadedCards || []);
          } else if (trip.destination?.name) {
            // Fallback to localStorage on API error
            const localCards = loadCardsFromLocalDraft(trip.destination.name);
            setCards(localCards || []);
          }
        }
      } catch (error) {
        console.error('Error loading cards:', error);
        // Try localStorage as last resort
        if (trip.destination?.name) {
          const localCards = loadCardsFromLocalDraft(trip.destination.name);
          setCards(localCards || []);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, [trip?.id, trip?.destination?.name]);

  /**
   * Save a place as a card with optional label and day assignment
   */
  const savePlace = useCallback(
    async (place: PlaceCard, label: string = 'considering', day?: number) => {
      if (!trip?.id) {
        console.error('No trip ID available');
        return;
      }

      const isLocalDraft = trip.id.startsWith('research-draft-');

      // Optimistic update
      const tempCard: Card = {
        id: `temp-${Date.now()}`,
        trip_id: trip.id,
        type: place.type || 'spot',
        payload_json: place,
        labels: [label],
        favorite: false,
        day,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCards((prev) => [...prev, tempCard]);

      if (isLocalDraft) {
        // Save to localStorage for local drafts
        try {
          const destination = trip.destination?.name;
          if (destination) {
            saveCardToLocalDraft(destination, place, label, day);
            // Update temp card with persistent local ID
            const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            setCards((prev) =>
              prev.map((c) => (c.id === tempCard.id ? { ...c, id: localId } : c))
            );
          }
        } catch (error) {
          setCards((prev) => prev.filter((c) => c.id !== tempCard.id));
          console.error('Error saving card to localStorage:', error);
        }
        return;
      }

      // Save to API for authenticated trips
      try {
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trip_id: trip.id,
            type: place.type || 'spot',
            payload_json: place,
            labels: [label],
            day,
          }),
        });

        if (response.ok) {
          const { card } = await response.json();
          // Replace temp card with real card
          setCards((prev) => prev.map((c) => (c.id === tempCard.id ? card : c)));
        } else {
          // Revert on error
          setCards((prev) => prev.filter((c) => c.id !== tempCard.id));
          console.error('Failed to save card');
        }
      } catch (error) {
        // Revert on error
        setCards((prev) => prev.filter((c) => c.id !== tempCard.id));
        console.error('Error saving card:', error);
      }
    },
    [trip?.id, trip?.destination?.name]
  );

  /**
   * Remove a card from the trip
   */
  const removeCard = useCallback(
    async (cardId: string) => {
      if (!trip?.id) return;

      const isLocalDraft = trip.id.startsWith('research-draft-');
      const removedCard = cards.find((c) => c.id === cardId);

      // Optimistic removal
      setCards((prev) => prev.filter((c) => c.id !== cardId));

      if (isLocalDraft) {
        // Remove from localStorage for local drafts
        try {
          const destination = trip.destination?.name;
          if (destination) {
            removeCardFromLocalDraft(destination, cardId);
          }
        } catch (error) {
          // Revert on error
          if (removedCard) {
            setCards((prev) => [...prev, removedCard]);
          }
          console.error('Error removing card from localStorage:', error);
        }
        return;
      }

      // Remove from API for authenticated trips
      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'DELETE',
        });

        if (!response.ok && removedCard) {
          // Revert on error
          setCards((prev) => [...prev, removedCard]);
          console.error('Failed to delete card');
        }
      } catch (error) {
        if (removedCard) {
          setCards((prev) => [...prev, removedCard]);
        }
        console.error('Error deleting card:', error);
      }
    },
    [cards, trip?.id, trip?.destination?.name]
  );

  /**
   * Update a card's label (considering, shortlist, confirmed, dismissed)
   */
  const updateCardLabel = useCallback(
    async (cardId: string, label: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      // Optimistic update
      const oldLabels = card.labels;
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, labels: [label] } : c))
      );

      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ labels: [label] }),
        });

        if (!response.ok) {
          // Revert on error
          setCards((prev) =>
            prev.map((c) => (c.id === cardId ? { ...c, labels: oldLabels } : c))
          );
          console.error('Failed to update card label');
        }
      } catch (error) {
        // Revert on error
        setCards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, labels: oldLabels } : c))
        );
        console.error('Error updating card label:', error);
      }
    },
    [cards]
  );

  /**
   * Assign a card to a specific day
   */
  const assignToDay = useCallback(
    async (cardId: string, day: number) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      // Optimistic update
      const oldDay = card.day;
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, day } : c))
      );

      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day }),
        });

        if (!response.ok) {
          // Revert on error
          setCards((prev) =>
            prev.map((c) => (c.id === cardId ? { ...c, day: oldDay } : c))
          );
          console.error('Failed to assign card to day');
        }
      } catch (error) {
        // Revert on error
        setCards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, day: oldDay } : c))
        );
        console.error('Error assigning card to day:', error);
      }
    },
    [cards]
  );

  return {
    cards,
    aiPlaces,
    isLoading,
    savePlace,
    removeCard,
    updateCardLabel,
    assignToDay,
    clearAiPlaces: () => setAiPlaces([]),
    addAiPlace: (place) => setAiPlaces((prev) => [...prev, place]),
    setAiPlaces,
  };
}
