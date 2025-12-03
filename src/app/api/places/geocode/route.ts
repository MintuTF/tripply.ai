import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Cache for geocoding results
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

    if (!PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500, headers: createRateLimitHeaders(rateLimitResult) }
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

    // Check cache
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

    // Extract location from first result
    const result = data.results[0];
    const location = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
    };

    const responseData = { location };

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
