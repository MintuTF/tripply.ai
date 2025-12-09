import type { PlaceCard, ToolCall, PlaceResult } from '@/types';
import type { HotelResult } from '../tools/hotelSearch';

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
    } else if (tool === 'search_hotel_offers' && result.data && Array.isArray(result.data)) {
      // Hotel search results from Amadeus
      const hotelCards = result.data.slice(0, 10).map((hotel: HotelResult) =>
        createHotelCard(hotel)
      );
      cards.push(...hotelCards);
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

/**
 * Create a PlaceCard from a HotelResult (Amadeus API)
 */
function createHotelCard(hotel: HotelResult): PlaceCard {
  const card: PlaceCard = {
    id: `hotel-${hotel.id}`,
    type: 'hotel',
    name: hotel.name,
    address: hotel.address,
    rating: hotel.rating,
    price_level: getPriceLevelFromAmount(hotel.price.per_night, hotel.price.currency),
    description: hotel.room_description || hotel.room_type,
    photos: [], // Amadeus basic API doesn't include photos - will use placeholder
    // Rich hotel data for display
    price_per_night: hotel.price.per_night,
    currency: hotel.price.currency,
    check_in_date: hotel.check_in_date,
    check_out_date: hotel.check_out_date,
  };

  return card;
}

/**
 * Build a description for the hotel card
 */
function buildHotelDescription(hotel: HotelResult): string {
  const parts: string[] = [];

  // Price info
  if (hotel.price.per_night) {
    parts.push(`${hotel.price.currency} ${hotel.price.per_night}/night`);
  }

  // Room info
  if (hotel.room_description) {
    parts.push(hotel.room_description);
  } else if (hotel.room_type) {
    parts.push(hotel.room_type);
  }

  // Dates
  if (hotel.check_in_date && hotel.check_out_date) {
    parts.push(`${hotel.check_in_date} to ${hotel.check_out_date}`);
  }

  return parts.join(' • ') || 'Hotel accommodation';
}

/**
 * Convert price amount to price level (1-4)
 */
function getPriceLevelFromAmount(amount: number, currency: string): number {
  // Rough conversion assuming USD-equivalent pricing
  // Adjust thresholds based on currency if needed
  if (currency !== 'USD') {
    // Simple conversion for common currencies (very rough)
    const conversions: Record<string, number> = {
      EUR: 1.1,
      GBP: 1.25,
      JPY: 0.0067,
      AUD: 0.65,
      CAD: 0.74,
    };
    amount = amount * (conversions[currency] || 1);
  }

  // Price level based on per-night rate
  if (amount < 100) return 1;
  if (amount < 200) return 2;
  if (amount < 350) return 3;
  return 4;
}
