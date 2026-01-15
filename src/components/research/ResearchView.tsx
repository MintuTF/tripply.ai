'use client';

import { ResearchProvider } from './ResearchContext';
import { ResearchWorkspace } from './ResearchWorkspace';
import type { Trip, Card, PlaceCard } from '@/types';

interface ResearchViewProps {
  tripId: string;
  trip: Trip;
  cards: Card[];
  onCardUpdate?: (card: Card) => void;
  onCardDelete?: (cardId: string) => void;
  onAddCard?: (card: Card) => void;
}

export function ResearchView({ tripId, trip, cards, onCardUpdate, onCardDelete, onAddCard }: ResearchViewProps) {
  const convertCardToPlaceCard = (card: Card): PlaceCard | null => {
    const payload = card.payload_json as any;
    if (!payload?.name) return null;
    return {
      id: card.id,
      type: card.type === 'food' ? 'restaurant' : card.type === 'spot' ? 'location' : card.type as any,
      name: payload.name,
      address: payload.address,
      coordinates: payload.coordinates,
      photos: payload.photos || [],
      rating: payload.rating,
      review_count: payload.review_count,
      price_level: payload.price_level,
      price_range: payload.price_range,
      description: payload.description,
      opening_hours: payload.opening_hours,
      cuisine_type: payload.cuisine_type,
      amenities: payload.amenities,
      duration: payload.duration,
      url: payload.url,
    };
  };

  const shortlistCards: PlaceCard[] = cards
    .filter((c) => c.labels.includes('considering') || c.labels.includes('shortlist'))
    .map(convertCardToPlaceCard)
    .filter((c): c is PlaceCard => c !== null);

  const confirmedCards: PlaceCard[] = cards
    .filter((c) => c.labels.includes('confirmed') || c.labels.includes('booked'))
    .map(convertCardToPlaceCard)
    .filter((c): c is PlaceCard => c !== null);

  return (
    <ResearchProvider initialShortlist={shortlistCards} initialConfirmed={confirmedCards}>
      <ResearchWorkspace tripId={tripId} trip={trip} />
    </ResearchProvider>
  );
}
