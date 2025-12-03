import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Cache for autocomplete suggestions
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface AutocompletePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

/**
 * GET /api/places/autocomplete
 * Get location autocomplete suggestions from Google Places API
 *
 * Query params:
 * - input (required): User's search input
 * - types (optional): Place types to filter (default: (cities))
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`places-autocomplete:${clientIP}`, {
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
    const input = searchParams.get('input');
    const types = searchParams.get('types') || '(cities)';

    if (!input || input.trim().length < 2) {
      return NextResponse.json(
        { predictions: [] },
        { headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check cache
    const cacheKey = `${input}:${types}`;
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

    // Build API URL
    const autocompleteUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    autocompleteUrl.searchParams.set('input', input);
    autocompleteUrl.searchParams.set('types', types);
    autocompleteUrl.searchParams.set('key', PLACES_API_KEY);

    // Call Google Places Autocomplete API
    const response = await fetch(autocompleteUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Autocomplete API error:', data.status, data.error_message);
      return NextResponse.json(
        { error: `Autocomplete API error: ${data.status}` },
        { status: 500, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse predictions
    const predictions: AutocompletePrediction[] = (data.predictions || []).map((p: any) => ({
      place_id: p.place_id,
      description: p.description,
      main_text: p.structured_formatting?.main_text || p.description,
      secondary_text: p.structured_formatting?.secondary_text || '',
      types: p.types || [],
    }));

    const responseData = { predictions };

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
    console.error('Autocomplete error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch autocomplete suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
