import {
  searchHotelsByCity,
  getCityCode,
  isAmadeusConfigured,
  getDefaultDates,
  type AmadeusHotelOffer,
} from './amadeus';
import type { ToolResult } from '@/types';

/**
 * Hotel Search Parameters from OpenAI function calling
 */
export interface HotelSearchParams {
  city: string;
  check_in_date: string;
  check_out_date: string;
  adults?: number;
  max_results?: number;
}

/**
 * Normalized hotel result for display
 */
export interface HotelResult {
  id: string;
  name: string;
  address?: string;
  rating?: number;
  price: {
    amount: number;
    currency: string;
    per_night: number;
  };
  room_type?: string;
  room_description?: string;
  check_in_date: string;
  check_out_date: string;
  available: boolean;
}

/**
 * Search for hotel offers using Amadeus API
 * This is the main executor function called by the orchestrator
 */
export async function searchHotelOffers(
  params: HotelSearchParams
): Promise<ToolResult<HotelResult[]>> {
  const {
    city,
    check_in_date,
    check_out_date,
    adults = 2,
    max_results = 10,
  } = params;

  // Check if Amadeus is configured
  if (!isAmadeusConfigured()) {
    return {
      success: false,
      error: 'Hotel search is not available. Amadeus API credentials not configured.',
      timestamp: new Date().toISOString(),
    };
  }

  // Get city code
  const cityCode = getCityCode(city);
  if (!cityCode) {
    // Try to provide helpful suggestions
    const suggestions = getSuggestedCities(city);
    return {
      success: false,
      error: `Unable to find city code for "${city}". ${
        suggestions.length > 0
          ? `Did you mean: ${suggestions.join(', ')}?`
          : 'Please try a major city name like Seattle, Paris, or Tokyo.'
      }`,
      timestamp: new Date().toISOString(),
    };
  }

  // Validate dates
  const dateValidation = validateDates(check_in_date, check_out_date);
  if (!dateValidation.valid) {
    return {
      success: false,
      error: dateValidation.error || 'Invalid dates provided',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // Call Amadeus API
    const result = await searchHotelsByCity({
      cityCode,
      checkInDate: check_in_date,
      checkOutDate: check_out_date,
      adults,
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to search hotels',
        timestamp: new Date().toISOString(),
      };
    }

    // Calculate number of nights for per-night pricing
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Transform Amadeus results to normalized format
    const hotels = result.data.slice(0, max_results).map((offer) =>
      transformAmadeusOffer(offer, nights)
    );

    return {
      success: true,
      data: hotels,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Hotel search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Transform Amadeus hotel offer to normalized format
 */
function transformAmadeusOffer(offer: AmadeusHotelOffer, nights: number): HotelResult {
  const perNightPrice = nights > 0 ? offer.price.total / nights : offer.price.total;

  return {
    id: offer.hotel_id,
    name: offer.name || `Hotel ${offer.hotel_id}`,
    rating: undefined, // Amadeus basic API doesn't include ratings
    price: {
      amount: offer.price.total,
      currency: offer.price.currency,
      per_night: Math.round(perNightPrice * 100) / 100,
    },
    room_type: offer.room?.type,
    room_description: offer.room?.description,
    check_in_date: offer.checkInDate,
    check_out_date: offer.checkOutDate,
    available: offer.available,
  };
}

/**
 * Validate check-in and check-out dates
 */
function validateDates(
  checkIn: string,
  checkOut: string
): { valid: boolean; error?: string } {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if dates are valid
  if (isNaN(checkInDate.getTime())) {
    return { valid: false, error: 'Invalid check-in date format. Use YYYY-MM-DD.' };
  }

  if (isNaN(checkOutDate.getTime())) {
    return { valid: false, error: 'Invalid check-out date format. Use YYYY-MM-DD.' };
  }

  // Check if check-in is in the past
  if (checkInDate < today) {
    return { valid: false, error: 'Check-in date cannot be in the past.' };
  }

  // Check if check-out is after check-in
  if (checkOutDate <= checkInDate) {
    return { valid: false, error: 'Check-out date must be after check-in date.' };
  }

  // Check if stay is too long (Amadeus limit is typically 30 nights)
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nights > 30) {
    return { valid: false, error: 'Maximum stay is 30 nights.' };
  }

  return { valid: true };
}

/**
 * Get suggested city names based on partial match
 */
function getSuggestedCities(input: string): string[] {
  const commonCities = [
    'Seattle', 'New York', 'Los Angeles', 'San Francisco', 'Chicago',
    'Miami', 'Las Vegas', 'Boston', 'Paris', 'London', 'Rome',
    'Barcelona', 'Amsterdam', 'Tokyo', 'Singapore', 'Dubai',
  ];

  const normalized = input.toLowerCase();
  return commonCities
    .filter((city) => city.toLowerCase().includes(normalized))
    .slice(0, 3);
}
