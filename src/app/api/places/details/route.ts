import { getPlaceDetails } from '@/lib/tools/places';
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

// Simple in-memory cache for place details
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (longer for details)

/**
 * GET /api/places/details
 * Get detailed information about a specific place from Google Places API
 *
 * Query params:
 * - place_id (required): Google Place ID
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`places-details:${clientIP}`, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute (lower for details)
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
    const placeId = searchParams.get('place_id');

    if (!placeId) {
      return NextResponse.json(
        { error: 'place_id parameter is required' },
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check cache
    const cached = cache.get(placeId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, max-age=600', // 10 minutes
          'X-Cache': 'HIT',
          ...createRateLimitHeaders(rateLimitResult),
        },
      });
    }

    // Call Google Places API
    const result = await getPlaceDetails({ place_id: placeId });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch place details' },
        { status: 500 }
      );
    }

    const responseData = {
      place: result.data,
      sources: result.sources,
      timestamp: result.timestamp,
    };

    // Update cache
    cache.set(placeId, { data: responseData, timestamp: Date.now() });

    // Clean old cache entries
    if (cache.size > 200) {
      const oldestKeys = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 50)
        .map(([key]) => key);
      oldestKeys.forEach(key => cache.delete(key));
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=600', // 10 minutes
        'X-Cache': 'MISS',
        ...createRateLimitHeaders(rateLimitResult),
      },
    });
  } catch (error) {
    console.error('Place details error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch place details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
