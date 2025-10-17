import type { PlaceCard, ToolCall, PlaceResult } from '@/types';

/**
 * Extract structured card data from tool results
 * Converts API results into displayable card format
 */
export function extractCardsFromToolResults(toolCalls: ToolCall[]): PlaceCard[] {
  const cards: PlaceCard[] = [];

  for (const toolCall of toolCalls) {
    const { tool, result } = toolCall;

    // Skip if no result or error
    if (!result || result.error || !result.success) continue;

    // Extract cards based on tool type
    if (tool === 'search_places' && result.data && Array.isArray(result.data)) {
      // Multiple place results
      const placeCards = result.data.slice(0, 6).map((place: PlaceResult) =>
        createPlaceCard(place, toolCall.parameters.type)
      );
      cards.push(...placeCards);
    } else if (tool === 'get_place_details' && result.data) {
      // Single place detail
      const placeCard = createPlaceCard(result.data, 'location');
      cards.push(placeCard);
    }
  }

  return cards;
}

/**
 * Create a PlaceCard from a PlaceResult
 */
function createPlaceCard(place: PlaceResult, queryType?: string): PlaceCard {
  // Determine card type based on place types or query type
  const cardType = determineCardType(place.types, queryType);

  const card: PlaceCard = {
    id: place.place_id || crypto.randomUUID(),
    type: cardType,
    name: place.name,
    address: place.address,
    coordinates: place.coordinates,
    photos: place.photos || [],
    rating: place.rating,
    review_count: undefined, // Not available from Google Places basic API
    price_level: place.price_level,
    description: undefined,
    opening_hours: place.opening_hours,
    url: place.url,
    place_id: place.place_id,
  };

  // Add type-specific fields
  if (cardType === 'restaurant') {
    card.cuisine_type = extractCuisineType(place.types);
  }

  return card;
}

/**
 * Determine card type from place types
 */
function determineCardType(
  types: string[],
  queryType?: string
): 'location' | 'restaurant' | 'hotel' | 'activity' {
  // Priority-based type detection
  if (queryType === 'hotel' || types.includes('lodging') || types.includes('hotel')) {
    return 'hotel';
  }

  if (queryType === 'restaurant' || types.includes('restaurant') || types.includes('cafe') || types.includes('food')) {
    return 'restaurant';
  }

  if (types.includes('tourist_attraction') || types.includes('museum') || types.includes('park')) {
    return 'location';
  }

  if (types.includes('amusement_park') || types.includes('aquarium') || types.includes('zoo')) {
    return 'activity';
  }

  // Default to location
  return 'location';
}

/**
 * Extract cuisine type from place types
 */
function extractCuisineType(types: string[]): string | undefined {
  const cuisineTypes = types.filter(t =>
    !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t)
  );

  if (cuisineTypes.length > 0) {
    return cuisineTypes[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return undefined;
}
