import type { ToolResult } from '@/types';

/**
 * Amadeus API Integration
 * Provides real hotel pricing and availability data
 * Docs: https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-search
 */

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
const AMADEUS_BASE_URL = process.env.AMADEUS_API_ENDPOINT || 'https://test.api.amadeus.com';

// Token cache (in production, use Redis or similar)
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export interface AmadeusHotelOffer {
  hotel_id: string;
  name?: string;
  price: {
    currency: string;
    total: number;
    base?: number;
    taxes?: number;
  };
  checkInDate: string;
  checkOutDate: string;
  room?: {
    type?: string;
    description?: string;
  };
  available: boolean;
}

/**
 * Get OAuth token from Amadeus
 */
async function getAccessToken(): Promise<string | null> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    console.error('Amadeus API credentials not configured');
    return null;
  }

  try {
    const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get Amadeus access token:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    cachedToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    return cachedToken;
  } catch (error) {
    console.error('Error getting Amadeus access token:', error);
    return null;
  }
}

/**
 * Search hotels by city code
 */
export async function searchHotelsByCity(params: {
  cityCode: string;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  radius?: number;
  radiusUnit?: 'KM' | 'MILE';
}): Promise<ToolResult<AmadeusHotelOffer[]>> {
  const token = await getAccessToken();

  if (!token) {
    return {
      success: false,
      error: 'Amadeus API not configured or authentication failed',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const {
      cityCode,
      checkInDate,
      checkOutDate,
      adults = 1,
      radius = 5,
      radiusUnit = 'KM',
    } = params;

    const searchParams = new URLSearchParams({
      cityCode,
      radius: radius.toString(),
      radiusUnit,
      adults: adults.toString(),
    });

    if (checkInDate) searchParams.append('checkInDate', checkInDate);
    if (checkOutDate) searchParams.append('checkOutDate', checkOutDate);

    const response = await fetch(
      `${AMADEUS_BASE_URL}/v3/shopping/hotel-offers?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Amadeus hotel search failed:', response.status);
      return {
        success: false,
        error: `Amadeus API error: ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();

    const offers: AmadeusHotelOffer[] = (data.data || []).flatMap((hotel: any) =>
      (hotel.offers || []).map((offer: any) => ({
        hotel_id: hotel.hotel.hotelId,
        name: hotel.hotel.name,
        price: {
          currency: offer.price.currency,
          total: parseFloat(offer.price.total),
          base: offer.price.base ? parseFloat(offer.price.base) : undefined,
          taxes: offer.price.taxes
            ? offer.price.taxes.reduce((sum: number, tax: any) => sum + parseFloat(tax.amount), 0)
            : undefined,
        },
        checkInDate: offer.checkInDate,
        checkOutDate: offer.checkOutDate,
        room: {
          type: offer.room?.type,
          description: offer.room?.typeEstimated?.category,
        },
        available: true,
      }))
    );

    return {
      success: true,
      data: offers,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Amadeus hotel search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get hotel IDs by geographic coordinates (step 1 of 2-step process)
 */
async function getHotelIdsByLocation(params: {
  latitude: number;
  longitude: number;
  radius?: number;
  radiusUnit?: 'KM' | 'MILE';
  token: string;
}): Promise<string[]> {
  const { latitude, longitude, radius = 5, radiusUnit = 'KM', token } = params;

  const searchParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius: radius.toString(),
    radiusUnit,
  });

  const url = `${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-geocode?${searchParams.toString()}`;

  console.log('[Amadeus] Getting hotel IDs by location:', { latitude, longitude, radius, radiusUnit, url });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error('[Amadeus] Failed to get hotel IDs:', response.status);
    return [];
  }

  const data = await response.json();
  const hotelIds = (data.data || []).map((hotel: any) => hotel.hotelId).slice(0, 20); // Limit to 20 hotels

  console.log(`[Amadeus] Found ${hotelIds.length} hotel IDs`);
  return hotelIds;
}

/**
 * Get hotel offers by geographic coordinates (2-step process)
 */
export async function searchHotelsByLocation(params: {
  latitude: number;
  longitude: number;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  radius?: number;
  radiusUnit?: 'KM' | 'MILE';
}): Promise<ToolResult<AmadeusHotelOffer[]>> {
  const token = await getAccessToken();

  if (!token) {
    return {
      success: false,
      error: 'Amadeus API not configured or authentication failed',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const {
      latitude,
      longitude,
      checkInDate,
      checkOutDate,
      adults = 1,
      radius = 5,
      radiusUnit = 'KM',
    } = params;

    // Step 1: Get hotel IDs by coordinates
    const hotelIds = await getHotelIdsByLocation({
      latitude,
      longitude,
      radius,
      radiusUnit,
      token,
    });

    if (hotelIds.length === 0) {
      console.log('[Amadeus] No hotels found at location');
      return {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };
    }

    // Step 2: Get pricing for hotel IDs
    const searchParams = new URLSearchParams({
      hotelIds: hotelIds.join(','),
      adults: adults.toString(),
    });

    if (checkInDate) searchParams.append('checkInDate', checkInDate);
    if (checkOutDate) searchParams.append('checkOutDate', checkOutDate);

    const requestUrl = `${AMADEUS_BASE_URL}/v3/shopping/hotel-offers?${searchParams.toString()}`;
    console.log('[Amadeus] Getting hotel offers for IDs:', {
      hotelCount: hotelIds.length,
      checkInDate,
      checkOutDate,
      adults,
      url: requestUrl,
    });

    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }
      console.error('Amadeus hotel search failed:', {
        status: response.status,
        statusText: response.statusText,
        error: JSON.stringify(errorDetails, null, 2),
        requestParams: { hotelCount: hotelIds.length, checkInDate, checkOutDate, adults },
      });
      return {
        success: false,
        error: `Amadeus API error: ${response.status} - ${JSON.stringify(errorDetails)}`,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();

    const offers: AmadeusHotelOffer[] = (data.data || []).flatMap((hotel: any) =>
      (hotel.offers || []).map((offer: any) => ({
        hotel_id: hotel.hotel.hotelId,
        name: hotel.hotel.name,
        price: {
          currency: offer.price.currency,
          total: parseFloat(offer.price.total),
          base: offer.price.base ? parseFloat(offer.price.base) : undefined,
          taxes: offer.price.taxes
            ? offer.price.taxes.reduce((sum: number, tax: any) => sum + parseFloat(tax.amount), 0)
            : undefined,
        },
        checkInDate: offer.checkInDate,
        checkOutDate: offer.checkOutDate,
        room: {
          type: offer.room?.type,
          description: offer.room?.typeEstimated?.category,
        },
        available: true,
      }))
    );

    console.log(`[Amadeus] Successfully found ${offers.length} hotel offers`);

    return {
      success: true,
      data: offers,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Amadeus hotel search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get specific hotel offer by hotel ID
 */
export async function getHotelOffer(params: {
  hotelId: string;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
}): Promise<ToolResult<AmadeusHotelOffer | null>> {
  const token = await getAccessToken();

  if (!token) {
    return {
      success: false,
      error: 'Amadeus API not configured or authentication failed',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { hotelId, checkInDate, checkOutDate, adults = 1 } = params;

    const searchParams = new URLSearchParams({
      hotelIds: hotelId,
      adults: adults.toString(),
    });

    if (checkInDate) searchParams.append('checkInDate', checkInDate);
    if (checkOutDate) searchParams.append('checkOutDate', checkOutDate);

    const response = await fetch(
      `${AMADEUS_BASE_URL}/v3/shopping/hotel-offers?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Amadeus hotel offer fetch failed:', response.status);
      return {
        success: false,
        error: `Amadeus API error: ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return {
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    const hotel = data.data[0];
    const offer = hotel.offers?.[0];

    if (!offer) {
      return {
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    const hotelOffer: AmadeusHotelOffer = {
      hotel_id: hotel.hotel.hotelId,
      name: hotel.hotel.name,
      price: {
        currency: offer.price.currency,
        total: parseFloat(offer.price.total),
        base: offer.price.base ? parseFloat(offer.price.base) : undefined,
        taxes: offer.price.taxes
          ? offer.price.taxes.reduce((sum: number, tax: any) => sum + parseFloat(tax.amount), 0)
          : undefined,
      },
      checkInDate: offer.checkInDate,
      checkOutDate: offer.checkOutDate,
      room: {
        type: offer.room?.type,
        description: offer.room?.typeEstimated?.category,
      },
      available: true,
    };

    return {
      success: true,
      data: hotelOffer,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Amadeus hotel offer error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Helper to generate default check-in/out dates (tomorrow and day after)
 */
export function getDefaultDates(): { checkInDate: string; checkOutDate: string } {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  return {
    checkInDate: tomorrow.toISOString().split('T')[0],
    checkOutDate: dayAfter.toISOString().split('T')[0],
  };
}
