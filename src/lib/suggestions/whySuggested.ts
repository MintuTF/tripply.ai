import type { PlaceCard, Trip } from '@/types';

export function generateWhySuggested(card: PlaceCard, trip?: Trip): string {
  if (card.rating && card.rating >= 4.5) {
    return 'Highly rated at ' + card.rating.toFixed(1) + ' stars';
  }
  if (trip?.destination?.name) {
    return 'Popular spot in ' + trip.destination.name;
  }
  if (card.price_level !== undefined && card.price_level <= 2) {
    return 'Great value for money';
  }
  return 'Top pick for travelers';
}

export function getFilteredCards(
  cards: PlaceCard[],
  activeFilters: string[],
  trip?: Trip
): PlaceCard[] {
  if (activeFilters.length === 0) return cards;
  return cards.filter((card) => {
    for (const filter of activeFilters) {
      if (filter === 'budget' && card.price_level !== undefined && card.price_level > 2) return false;
      if (filter === 'highly-rated' && (!card.rating || card.rating < 4.5)) return false;
    }
    return true;
  });
}
