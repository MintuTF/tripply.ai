'use client';

import { useState, useCallback } from 'react';
import type { PlaceCard, Card, CardType, HotelCard, SpotCard, FoodCard } from '@/types';

/**
 * Response from the Ask AI API
 */
interface AskAIResponse {
  planText: string;
  destination: string;
  cards: PlaceCard[];
  canSave: boolean;
}

/**
 * Map PlaceCard type to Card type
 */
function mapPlaceCardType(placeType: PlaceCard['type']): CardType {
  switch (placeType) {
    case 'hotel':
      return 'hotel';
    case 'restaurant':
      return 'food';
    case 'location':
    case 'activity':
    default:
      return 'spot';
  }
}

/**
 * Convert PlaceCard to Card payload based on type
 */
function createCardPayload(placeCard: PlaceCard): HotelCard | SpotCard | FoodCard {
  const basePayload = {
    name: placeCard.name,
    address: placeCard.address || '',
    coordinates: placeCard.coordinates || { lat: 0, lng: 0 },
    rating: placeCard.rating,
    photos: placeCard.photos,
    url: placeCard.url,
  };

  switch (placeCard.type) {
    case 'hotel':
      return {
        ...basePayload,
        price_range: placeCard.price_range || [0, 0],
        amenities: placeCard.amenities || [],
      } as HotelCard;
    case 'restaurant':
      return {
        ...basePayload,
        cuisine_type: placeCard.cuisine_type || 'Various',
        price_level: placeCard.price_level || 2,
        opening_hours: placeCard.opening_hours,
      } as FoodCard;
    case 'location':
    case 'activity':
    default:
      return {
        ...basePayload,
        type: placeCard.type === 'activity' ? 'Activity' : 'Attraction',
        opening_hours: placeCard.opening_hours,
        description: placeCard.description,
      } as SpotCard;
  }
}

/**
 * Convert PlaceCard from AI response to Card format for the board
 */
export function placeCardToBoardCard(
  placeCard: PlaceCard,
  tripId: string
): Omit<Card, 'id' | 'created_at' | 'updated_at'> {
  return {
    trip_id: tripId,
    type: mapPlaceCardType(placeCard.type),
    payload_json: createCardPayload(placeCard),
    labels: ['considering'],
    favorite: false,
  };
}

interface UseAskAIOptions {
  tripId: string;
  destination?: string;
  dates?: { start: string; end: string };
  budget?: number;
  onCardsGenerated?: (cards: Omit<Card, 'id' | 'created_at' | 'updated_at'>[]) => void;
}

interface UseAskAIReturn {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isLoading: boolean;
  streamingCards: PlaceCard[];
  planText: string | null;
  canSave: boolean;
  error: string | null;
  askAI: (query: string) => Promise<PlaceCard[]>;
  clearResults: () => void;
}

/**
 * Hook for Ask AI feature - calls structured JSON API endpoint
 */
export function useAskAI({
  tripId,
  destination,
  dates,
  budget,
  onCardsGenerated
}: UseAskAIOptions): UseAskAIReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingCards, setStreamingCards] = useState<PlaceCard[]>([]);
  const [planText, setPlanText] = useState<string | null>(null);
  const [canSave, setCanSave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearResults = useCallback(() => {
    setStreamingCards([]);
    setPlanText(null);
    setCanSave(false);
    setError(null);
  }, []);

  const askAI = useCallback(async (query: string): Promise<PlaceCard[]> => {
    if (!query.trim()) return [];

    setIsLoading(true);
    setError(null);
    setStreamingCards([]);
    setPlanText(null);

    try {
      // Call the new structured JSON API endpoint
      const response = await fetch('/api/board/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          question: query,
          destination,
          dates,
          budget,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get AI recommendations');
      }

      const data: AskAIResponse = await response.json();

      // Set the plan text (AI's explanation)
      setPlanText(data.planText);

      // Set whether user can save cards (authenticated with valid trip)
      setCanSave(data.canSave);

      // Set the cards
      setStreamingCards(data.cards);

      // Convert to board cards if callback provided
      if (onCardsGenerated && data.cards.length > 0) {
        const boardCards = data.cards.map(pc => placeCardToBoardCard(pc, tripId));
        onCardsGenerated(boardCards);
      }

      return data.cards;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [tripId, destination, dates, budget, onCardsGenerated]);

  return {
    isOpen,
    setIsOpen,
    isLoading,
    streamingCards,
    planText,
    canSave,
    error,
    askAI,
    clearResults,
  };
}
