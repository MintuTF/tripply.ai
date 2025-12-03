import { Card, TravelInfo } from '@/types';

/**
 * Calculate travel time between two locations using straight-line distance
 * This is a simplified estimation - in production, you'd use Google Maps Distance Matrix API
 */
export function estimateTravelTime(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): TravelInfo | null {
  if (!from || !to) return null;

  // Calculate straight-line distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Estimate travel time based on mode (simplified)
  // Actual travel distance is typically 1.3-1.5x straight-line distance
  const actualDistance = distance * 1.3;

  let duration: number;
  switch (mode) {
    case 'walking':
      duration = Math.ceil((actualDistance / 5) * 60); // 5 km/h
      break;
    case 'transit':
      duration = Math.ceil((actualDistance / 30) * 60); // 30 km/h average
      break;
    case 'driving':
    default:
      duration = Math.ceil((actualDistance / 50) * 60); // 50 km/h average city driving
      break;
  }

  return {
    distance: Math.round(actualDistance * 10) / 10,
    duration,
    mode,
    next_stop_id: '',
  };
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate travel info for all cards in a day
 */
export function calculateDayTravelInfo(cards: Card[]): Card[] {
  if (cards.length < 2) return cards;

  const sortedCards = [...cards].sort((a, b) => (a.order || 0) - (b.order || 0));

  return sortedCards.map((card, index) => {
    if (index === sortedCards.length - 1) {
      // Last card in the day - no next stop
      return { ...card, travel_info: undefined };
    }

    const currentPayload = typeof card.payload_json === 'string'
      ? JSON.parse(card.payload_json)
      : card.payload_json;
    const nextCard = sortedCards[index + 1];
    const nextPayload = typeof nextCard.payload_json === 'string'
      ? JSON.parse(nextCard.payload_json)
      : nextCard.payload_json;

    // Calculate travel time if both have coordinates
    if (currentPayload.coordinates && nextPayload.coordinates) {
      const travelInfo = estimateTravelTime(
        currentPayload.coordinates,
        nextPayload.coordinates,
        'driving' // Default to driving, could be made configurable
      );

      if (travelInfo) {
        return {
          ...card,
          travel_info: {
            ...travelInfo,
            next_stop_id: nextCard.id,
          },
        };
      }
    }

    return card;
  });
}

/**
 * Recalculate travel info for all days in a trip
 */
export function recalculateTripTravelInfo(cards: Card[]): Card[] {
  // Group cards by day
  const cardsByDay = cards.reduce((acc, card) => {
    const day = card.day || 0;
    if (!acc[day]) acc[day] = [];
    acc[day].push(card);
    return acc;
  }, {} as Record<number, Card[]>);

  // Calculate travel info for each day
  const updatedCardsByDay: Record<string, Card> = {};
  Object.entries(cardsByDay).forEach(([day, dayCards]) => {
    const updatedDayCards = calculateDayTravelInfo(dayCards);
    updatedDayCards.forEach(card => {
      updatedCardsByDay[card.id] = card;
    });
  });

  // Return all cards with updated travel info
  return cards.map(card => updatedCardsByDay[card.id] || card);
}

/**
 * Get total travel time for a day
 */
export function getDayTravelTime(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + (card.travel_info?.duration || 0), 0);
}

/**
 * Check if a day is overloaded (more than 4 hours of travel)
 */
export function isDayOverloaded(cards: Card[]): boolean {
  return getDayTravelTime(cards) > 240; // 240 minutes = 4 hours
}

/**
 * Suggest optimal order for stops in a day (basic nearest-neighbor algorithm)
 */
export function suggestOptimalOrder(cards: Card[]): Card[] {
  if (cards.length <= 1) return cards;

  const unvisited = [...cards];
  const ordered: Card[] = [];

  // Start with the first card (or the one with earliest time)
  let current = unvisited.sort((a, b) => {
    if (a.time_slot && b.time_slot) {
      return a.time_slot.localeCompare(b.time_slot);
    }
    return 0;
  })[0];

  ordered.push(current);
  unvisited.splice(unvisited.indexOf(current), 1);

  // Find nearest neighbor for each subsequent stop
  while (unvisited.length > 0) {
    const currentPayload = typeof current.payload_json === 'string'
      ? JSON.parse(current.payload_json)
      : current.payload_json;

    if (!currentPayload.coordinates) {
      // If current has no coordinates, just take the next one
      const next = unvisited[0];
      ordered.push(next);
      unvisited.splice(0, 1);
      current = next;
      continue;
    }

    // Find nearest unvisited stop
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    unvisited.forEach((card, index) => {
      const payload = typeof card.payload_json === 'string'
        ? JSON.parse(card.payload_json)
        : card.payload_json;

      if (payload.coordinates) {
        const info = estimateTravelTime(
          currentPayload.coordinates,
          payload.coordinates
        );
        if (info && info.distance < nearestDistance) {
          nearestDistance = info.distance;
          nearestIndex = index;
        }
      }
    });

    const nearest = unvisited[nearestIndex];
    ordered.push(nearest);
    unvisited.splice(nearestIndex, 1);
    current = nearest;
  }

  // Update order numbers
  return ordered.map((card, index) => ({
    ...card,
    order: index + 1,
  }));
}
