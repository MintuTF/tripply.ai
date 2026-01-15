import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Cache for geocoding results
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Demo city data for when API key is not available
const demoCities: Record<string, { lat: number; lng: number; country: string; countryCode: string; imageUrl: string }> = {
  tokyo: { lat: 35.6762, lng: 139.6503, country: 'Japan', countryCode: 'JP', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200' },
  paris: { lat: 48.8566, lng: 2.3522, country: 'France', countryCode: 'FR', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200' },
  'new york': { lat: 40.7128, lng: -74.0060, country: 'United States', countryCode: 'US', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200' },
  london: { lat: 51.5074, lng: -0.1278, country: 'United Kingdom', countryCode: 'GB', imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200' },
  barcelona: { lat: 41.3851, lng: 2.1734, country: 'Spain', countryCode: 'ES', imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200' },
  rome: { lat: 41.9028, lng: 12.4964, country: 'Italy', countryCode: 'IT', imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200' },
  dubai: { lat: 25.2048, lng: 55.2708, country: 'United Arab Emirates', countryCode: 'AE', imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200' },
  sydney: { lat: -33.8688, lng: 151.2093, country: 'Australia', countryCode: 'AU', imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200' },
  singapore: { lat: 1.3521, lng: 103.8198, country: 'Singapore', countryCode: 'SG', imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200' },
  bangkok: { lat: 13.7563, lng: 100.5018, country: 'Thailand', countryCode: 'TH', imageUrl: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200' },
  amsterdam: { lat: 52.3676, lng: 4.9041, country: 'Netherlands', countryCode: 'NL', imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200' },
  berlin: { lat: 52.5200, lng: 13.4050, country: 'Germany', countryCode: 'DE', imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200' },
  seoul: { lat: 37.5665, lng: 126.9780, country: 'South Korea', countryCode: 'KR', imageUrl: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1200' },
  bali: { lat: -8.4095, lng: 115.1889, country: 'Indonesia', countryCode: 'ID', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200' },
  'los angeles': { lat: 34.0522, lng: -118.2437, country: 'United States', countryCode: 'US', imageUrl: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1200' },
  miami: { lat: 25.7617, lng: -80.1918, country: 'United States', countryCode: 'US', imageUrl: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=1200' },
  'san francisco': { lat: 37.7749, lng: -122.4194, country: 'United States', countryCode: 'US', imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200' },
  lisbon: { lat: 38.7223, lng: -9.1393, country: 'Portugal', countryCode: 'PT', imageUrl: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200' },
  prague: { lat: 50.0755, lng: 14.4378, country: 'Czech Republic', countryCode: 'CZ', imageUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200' },
  vienna: { lat: 48.2082, lng: 16.3738, country: 'Austria', countryCode: 'AT', imageUrl: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200' },
};

// Get city image URL based on city name
function getCityImageUrl(cityName: string): string {
  const key = cityName.toLowerCase();
  if (demoCities[key]) {
    return demoCities[key].imageUrl;
  }
  // Default city image
  return 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200';
}

/**
 * GET /api/places/geocode
 * Geocode an address/location to get coordinates
 *
 * Query params:
 * - address (required): Location name or address
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`places-geocode:${clientIP}`, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address || address.trim().length === 0) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check cache first
    const cacheKey = address.toLowerCase().trim();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, max-age=600',
          'X-Cache': 'HIT',
          ...createRateLimitHeaders(rateLimitResult),
        },
      });
    }

    // If no API key, use demo data
    if (!PLACES_API_KEY) {
      console.log('No Google Places API key - using demo geocode data');
      const cityKey = address.toLowerCase().split(',')[0].trim();
      const demoCity = demoCities[cityKey];

      if (demoCity) {
        const responseData = {
          lat: demoCity.lat,
          lng: demoCity.lng,
          photoUrl: demoCity.imageUrl,
          city: address.split(',')[0].trim(),
          country: demoCity.country,
          countryCode: demoCity.countryCode,
          demo: true,
        };
        cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
        return NextResponse.json(responseData, {
          headers: createRateLimitHeaders(rateLimitResult),
        });
      }

      // Generic fallback
      const responseData = {
        lat: 40.7128,
        lng: -74.0060,
        photoUrl: getCityImageUrl(address),
        city: address.split(',')[0].trim(),
        country: 'Unknown',
        countryCode: '',
        demo: true,
      };
      return NextResponse.json(responseData, {
        headers: createRateLimitHeaders(rateLimitResult),
      });
    }

    // Build API URL for Geocoding
    const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    geocodeUrl.searchParams.set('address', address);
    geocodeUrl.searchParams.set('key', PLACES_API_KEY);

    // Call Google Geocoding API
    const response = await fetch(geocodeUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Geocoding API error:', data.status, data.error_message);
      return NextResponse.json(
        { error: `Could not geocode location: ${data.status}` },
        { status: 404, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Extract location and metadata from first result
    const result = data.results[0];

    // Extract city, country, and other metadata from address_components
    const addressComponents = result.address_components || [];
    let city = '';
    let country = '';
    let countryCode = '';
    let state = '';

    for (const component of addressComponents) {
      const types = component.types || [];
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      } else if (types.includes('country')) {
        country = component.long_name;
        countryCode = component.short_name;
      }
    }

    // If no locality, try administrative_area_level_2 or use formatted_address
    if (!city) {
      for (const component of addressComponents) {
        if (component.types?.includes('administrative_area_level_2')) {
          city = component.long_name;
          break;
        }
      }
    }

    // Get city image URL (from our database or default)
    const cityName = city || address.split(',')[0].trim();
    const photoUrl = getCityImageUrl(cityName);

    const responseData = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      photoUrl,
      formatted_address: result.formatted_address,
      city: cityName,
      country,
      countryCode,
      state,
      place_id: result.place_id,
    };

    // Update cache
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    // Clean old cache entries
    if (cache.size > 100) {
      const oldestKeys = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 20)
        .map(([key]) => key);
      oldestKeys.forEach(key => cache.delete(key));
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=600',
        'X-Cache': 'MISS',
        ...createRateLimitHeaders(rateLimitResult),
      },
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      {
        error: 'Failed to geocode location',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
