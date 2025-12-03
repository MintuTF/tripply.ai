import type { ToolResult } from '@/types';

/**
 * SerpAPI Google Hotels Integration
 * Provides fast, Google-like hotel search results
 * Docs: https://serpapi.com/google-hotels-api
 */

const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;
const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

export interface SerpAPIHotelResult {
  name: string;
  description?: string;
  link?: string;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
  check_in_time?: string;
  check_out_time?: string;
  rating?: number;
  reviews?: number;
  hotel_class?: string;
  extracted_hotel_class?: number;
  images?: string[];
  thumbnail?: string;
  amenities?: string[];
  property_token?: string;
  serpapi_property_details_link?: string;
  // Pricing from SerpAPI (if available)
  rate_per_night?: {
    lowest?: string;
    extracted_lowest?: number;
  };
  total_rate?: {
    lowest?: string;
    extracted_lowest?: number;
  };
}

export interface SerpAPIHotelPrice {
  source: string;
  logo?: string;
  link: string;
  rate_per_night?: {
    lowest?: string;
    extracted_lowest?: number;
    before_taxes_fees?: string;
    extracted_before_taxes_fees?: number;
  };
  total_rate?: {
    lowest?: string;
    extracted_lowest?: number;
  };
  prices?: Array<{
    source: string;
    logo?: string;
    num_guests?: number;
    rate_per_night?: {
      lowest?: string;
      extracted_lowest?: number;
      before_taxes_fees?: string;
      extracted_before_taxes_fees?: number;
    };
    link?: string;
    deal?: string;
    free_cancellation?: boolean;
  }>;
  nearby_hotels_info?: {
    total_price?: string;
    taxes_fees?: string;
  };
  free_cancellation?: boolean;
  deal?: string;
  official_hotel_website?: boolean;
}

export interface GoogleHotelsSearchResult {
  hotels: SerpAPIHotelResult[];
  prices?: Record<string, SerpAPIHotelPrice[]>;
  serpapi_pagination?: {
    next?: string;
    next_page_token?: string;
  };
}

/**
 * Search for hotels using SerpAPI Google Hotels
 */
export async function searchGoogleHotels(params: {
  query: string; // e.g., "Dallas hotels" or "hotels in Paris"
  location?: string; // Optional: can be included in query
  checkIn?: string; // YYYY-MM-DD
  checkOut?: string; // YYYY-MM-DD
  adults?: number;
  currency?: string;
  gl?: string; // Country code (default: 'us')
  hl?: string; // Language (default: 'en')
}): Promise<ToolResult<GoogleHotelsSearchResult>> {
  if (!SERPAPI_API_KEY) {
    console.warn('[SerpAPI] API key not configured');
    return {
      success: false,
      error: 'SerpAPI key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const {
      query,
      location,
      checkIn,
      checkOut,
      adults = 2,
      currency = 'USD',
      gl = 'us',
      hl = 'en',
    } = params;

    // Build search query
    const searchQuery = location ? `hotels in ${location}` : query;

    // Build SerpAPI parameters
    const searchParams = new URLSearchParams({
      engine: 'google_hotels',
      q: searchQuery,
      api_key: SERPAPI_API_KEY,
      currency,
      gl,
      hl,
      adults: adults.toString(),
    });

    if (checkIn) searchParams.append('check_in_date', checkIn);
    if (checkOut) searchParams.append('check_out_date', checkOut);

    console.log('[SerpAPI] Searching Google Hotels:', {
      query: searchQuery,
      checkIn,
      checkOut,
      adults,
    });

    const response = await fetch(`${SERPAPI_BASE_URL}?${searchParams.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SerpAPI] API error:', response.status, errorText);
      return {
        success: false,
        error: `SerpAPI error: ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();

    // Check for API errors
    if (data.error) {
      console.error('[SerpAPI] API returned error:', data.error);
      return {
        success: false,
        error: data.error,
        timestamp: new Date().toISOString(),
      };
    }

    // Extract hotels and prices from response
    const hotels: SerpAPIHotelResult[] = data.properties || [];
    const prices: Record<string, SerpAPIHotelPrice[]> = {};

    // Debug: Log first hotel's photo data
    if (hotels.length > 0) {
      const firstHotel = data.properties[0];
      console.log('[SerpAPI] First hotel photo data:', {
        name: firstHotel.name,
        has_images: !!firstHotel.images,
        images_count: firstHotel.images?.length || 0,
        has_thumbnail: !!firstHotel.thumbnail,
        thumbnail: firstHotel.thumbnail,
      });

      // Log actual photo structure to debug
      if (firstHotel.images && firstHotel.images.length > 0) {
        console.log('[SerpAPI] First photo type:', typeof firstHotel.images[0]);
        console.log('[SerpAPI] First photo value:', JSON.stringify(firstHotel.images[0]).substring(0, 300));
      }
    }

    // Extract prices for each hotel
    if (data.properties) {
      data.properties.forEach((hotel: any, index: number) => {
        if (hotel.rate_per_night || hotel.prices) {
          const hotelKey = hotel.property_token || `hotel_${index}`;
          prices[hotelKey] = hotel.prices || [
            {
              source: hotel.rate_per_night?.source || 'Google',
              link: hotel.link || '',
              rate_per_night: hotel.rate_per_night,
              total_rate: hotel.total_rate,
            },
          ];
        }
      });
    }

    console.log(`[SerpAPI] Found ${hotels.length} hotels`);

    return {
      success: true,
      data: {
        hotels,
        prices,
        serpapi_pagination: data.serpapi_pagination,
      },
      sources: ['SerpAPI Google Hotels'],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[SerpAPI] Search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get hotel price comparison from multiple providers
 */
export async function getHotelPriceComparison(params: {
  propertyToken: string; // SerpAPI property token
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  currency?: string;
}): Promise<ToolResult<SerpAPIHotelPrice[]>> {
  if (!SERPAPI_API_KEY) {
    return {
      success: false,
      error: 'SerpAPI key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { propertyToken, checkIn, checkOut, adults = 2, currency = 'USD' } = params;

    const searchParams = new URLSearchParams({
      engine: 'google_hotels',
      property_token: propertyToken,
      api_key: SERPAPI_API_KEY,
      currency,
      adults: adults.toString(),
    });

    if (checkIn) searchParams.append('check_in_date', checkIn);
    if (checkOut) searchParams.append('check_out_date', checkOut);

    const response = await fetch(`${SERPAPI_BASE_URL}?${searchParams.toString()}`);

    if (!response.ok) {
      return {
        success: false,
        error: `SerpAPI error: ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error,
        timestamp: new Date().toISOString(),
      };
    }

    // Extract price offers from different providers
    const prices: SerpAPIHotelPrice[] = data.prices || [];

    return {
      success: true,
      data: prices,
      sources: ['SerpAPI Google Hotels'],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[SerpAPI] Price comparison error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Search for location autocomplete suggestions
 */
export async function searchLocations(params: {
  query: string;
}): Promise<ToolResult<Array<{ name: string; place_id?: string }>>> {
  if (!SERPAPI_API_KEY) {
    return {
      success: false,
      error: 'SerpAPI key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const searchParams = new URLSearchParams({
      engine: 'google_autocomplete',
      q: params.query,
      api_key: SERPAPI_API_KEY,
    });

    const response = await fetch(`${SERPAPI_BASE_URL}?${searchParams.toString()}`);

    if (!response.ok) {
      return {
        success: false,
        error: `SerpAPI error: ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error,
        timestamp: new Date().toISOString(),
      };
    }

    const suggestions = (data.suggestions || []).map((s: any) => ({
      name: s.value,
      place_id: s.place_id,
    }));

    return {
      success: true,
      data: suggestions,
      sources: ['SerpAPI Autocomplete'],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}
