import { searchPlaces } from '@/lib/tools/places';
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import type { Card, CardType, PlaceResult } from '@/types';

// Simple in-memory cache for development
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Format cuisine type from Google Places types array
 */
function formatCuisineType(types: string[]): string {
  // Filter out generic types that don't describe cuisine
  const genericTypes = [
    'restaurant', 'food', 'establishment', 'point_of_interest', 'store',
    'locality', 'political', 'premise', 'route', 'street_address'
  ];
  const cuisineTypes = types.filter(t => !genericTypes.includes(t));

  if (cuisineTypes.length > 0) {
    // Format the first cuisine type (e.g., "mexican_restaurant" -> "Mexican Restaurant")
    return cuisineTypes[0]
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  if (types.includes('bar')) return 'Bar & Grill';
  if (types.includes('cafe')) return 'Café';
  if (types.includes('bakery')) return 'Bakery';
  if (types.includes('meal_takeaway')) return 'Takeaway';
  if (types.includes('meal_delivery')) return 'Delivery';
  return 'Restaurant';
}

/**
 * Format spot/attraction type from Google Places types array
 */
function formatSpotType(types: string[]): string {
  // Filter out generic types that don't describe the attraction
  const genericTypes = [
    'point_of_interest', 'establishment', 'locality', 'political',
    'premise', 'route', 'street_address', 'store', 'health'
  ];
  const spotTypes = types.filter(t => !genericTypes.includes(t));

  if (spotTypes.length > 0) {
    return spotTypes[0]
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  return 'Attraction';
}

/**
 * Convert PlaceResult to Card format
 */
function placeResultToCard(place: PlaceResult, tripId: string): Omit<Card, 'created_at' | 'updated_at'> {
  // Debug logging for photos
  console.log(`[Card] ${place.name}: types=${place.types.join(',')} photos=${place.photos?.length || 0}`);

  // Determine card type from place types
  let cardType: CardType = 'spot';
  let payload: any;

  if (place.types.some(t => ['lodging', 'hotel'].includes(t))) {
    cardType = 'hotel';
    payload = {
      place_id: place.place_id,
      name: place.name,
      address: place.address,
      coordinates: place.coordinates,
      cost: place.price_level
        ? place.price_level * 50
        : 100,
      rating: place.rating,
      review_count: place.review_count,
      amenities: [],
      photos: place.photos || [],
      url: place.url,
    };
  } else if (place.types.some(t => ['restaurant', 'food', 'cafe', 'bar'].includes(t))) {
    cardType = 'food';
    payload = {
      place_id: place.place_id,
      name: place.name,
      address: place.address,
      coordinates: place.coordinates,
      cuisine_type: formatCuisineType(place.types),
      price_level: place.price_level || 2,
      rating: place.rating,
      review_count: place.review_count,
      photos: place.photos || [],
      opening_hours: place.opening_hours,
      url: place.url,
      dietary_tags: [],
    };
  } else {
    // "Things to Do" - includes both attractions and activities
    cardType = 'spot';
    payload = {
      place_id: place.place_id,
      name: place.name,
      address: place.address,
      coordinates: place.coordinates,
      type: formatSpotType(place.types),
      rating: place.rating,
      review_count: place.review_count,
      photos: place.photos || [],
      opening_hours: place.opening_hours,
      url: place.url,
      description: '',
      cost: place.price_level ? place.price_level * 25 : 0,
    };
  }

  return {
    id: place.place_id || `place-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    trip_id: tripId,
    type: cardType,
    payload_json: payload,
    labels: [],
    favorite: false,
  };
}

/**
 * GET /api/places/search
 * Search for places using Google Places API
 *
 * Query params:
 * - location (required): City or location name (e.g., "Paris, France")
 * - query (optional): Search query (e.g., "italian restaurant")
 * - type (optional): Place type (hotel, restaurant, attraction, cafe, bar, all)
 * - trip_id (optional): Trip ID to associate cards with
 * - min_rating (optional): Minimum rating filter (1-5)
 * - price_level (optional): Comma-separated price levels (1,2,3,4)
 * - radius (optional): Search radius in meters (default: 5000)
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`places-search:${clientIP}`, {
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

    const location = searchParams.get('location');
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'all';
    const tripId = searchParams.get('trip_id') || 'temp';
    const minRating = searchParams.get('min_rating');
    const priceLevelParam = searchParams.get('price_level');
    const radius = searchParams.get('radius');

    if (!location) {
      return NextResponse.json(
        { error: 'location parameter is required' },
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Build cache key
    const cacheKey = `${location}:${query}:${type}:${minRating}:${priceLevelParam}:${radius}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutes
          'X-Cache': 'HIT',
          ...createRateLimitHeaders(rateLimitResult),
        },
      });
    }

    // Parse filters
    const priceLevel = priceLevelParam
      ? priceLevelParam.split(',').map(Number).filter(n => n >= 1 && n <= 4)
      : undefined;

    let cards: Omit<Card, 'created_at' | 'updated_at'>[] = [];
    let sources: string[] = [];

    // Use Google Places API for all search types
    console.log(`[Route] Searching Google Places for type: ${type}`);
    const result = await searchPlaces({
      query: query || type,
      location,
      type,
      radius: radius ? parseInt(radius) : 5000,
      price_level: priceLevel,
      min_rating: minRating ? parseFloat(minRating) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to search places' },
        { status: 500 }
      );
    }

    cards = (result.data || []).map(place => placeResultToCard(place, tripId));
    sources = result.sources || ['Google Places'];
    console.log(`[Route] Google Places returned ${cards.length} results`);

    const responseData = {
      cards,
      sources,
      timestamp: new Date().toISOString(),
    };

    // Update cache
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    // Clean old cache entries (simple cleanup)
    if (cache.size > 100) {
      const oldestKeys = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 20)
        .map(([key]) => key);
      oldestKeys.forEach(key => cache.delete(key));
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes
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
