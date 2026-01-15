import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Cache for places search results
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/places/search
 * Search for places near a location using Google Places Nearby Search API
 *
 * Query params:
 * - lat (required): Latitude
 * - lng (required): Longitude
 * - type (optional): Place type filter (restaurant, tourist_attraction, lodging, etc.)
 * - radius (optional): Search radius in meters (default: 5000, max: 50000)
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`places-search:${clientIP}`, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
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

    if (!PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const type = searchParams.get('type') || undefined;
    const radius = Math.min(
      parseInt(searchParams.get('radius') || '5000'),
      50000
    );

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Validate lat/lng
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude' },
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Latitude or longitude out of range' },
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check cache
    const cacheKey = `${lat},${lng},${type || 'all'},${radius}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, max-age=300',
          'X-Cache': 'HIT',
          ...createRateLimitHeaders(rateLimitResult),
        },
      });
    }

    // Build API URL for Places Nearby Search
    const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    placesUrl.searchParams.set('location', `${latitude},${longitude}`);
    placesUrl.searchParams.set('radius', radius.toString());
    placesUrl.searchParams.set('key', PLACES_API_KEY);

    if (type) {
      placesUrl.searchParams.set('type', type);
    }

    // Call Google Places Nearby Search API
    const response = await fetch(placesUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message);
      return NextResponse.json(
        { error: `Places search failed: ${data.status}` },
        { status: 500, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Transform results to match our PlaceCard interface
    const places = (data.results || []).map((place: any) => {
      // Determine place type based on Google types
      let placeType = 'attraction';
      if (place.types?.includes('restaurant') || place.types?.includes('cafe') || place.types?.includes('food')) {
        placeType = 'restaurant';
      } else if (place.types?.includes('lodging') || place.types?.includes('hotel')) {
        placeType = 'hotel';
      } else if (place.types?.includes('museum') || place.types?.includes('art_gallery') || place.types?.includes('park')) {
        placeType = 'activity';
      } else if (place.types?.includes('tourist_attraction') || place.types?.includes('point_of_interest')) {
        placeType = 'attraction';
      }

      // Build photo URLs if available
      const photos = place.photos?.slice(0, 3).map((photo: any) => {
        const photoReference = photo.photo_reference;
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${PLACES_API_KEY}`;
      }) || [];

      return {
        id: place.place_id,
        type: placeType,
        name: place.name,
        address: place.vicinity || place.formatted_address || '',
        photos,
        rating: place.rating || undefined,
        review_count: place.user_ratings_total || undefined,
        price_level: place.price_level || undefined,
        description: place.editorial_summary?.overview || undefined,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        is_open: place.opening_hours?.open_now,
        types: place.types || [],
      };
    });

    const responseData = {
      places,
      status: data.status,
      next_page_token: data.next_page_token,
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
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'MISS',
        ...createRateLimitHeaders(rateLimitResult),
      },
    });
  } catch (error) {
    console.error('Places search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search places',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
