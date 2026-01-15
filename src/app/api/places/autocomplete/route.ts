import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Cache for autocomplete suggestions
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Demo cities for when API key is not available
const demoCities = [
  { place_id: 'demo_tokyo', description: 'Tokyo, Japan', main_text: 'Tokyo', secondary_text: 'Japan' },
  { place_id: 'demo_paris', description: 'Paris, France', main_text: 'Paris', secondary_text: 'France' },
  { place_id: 'demo_new_york', description: 'New York, NY, USA', main_text: 'New York', secondary_text: 'NY, USA' },
  { place_id: 'demo_london', description: 'London, UK', main_text: 'London', secondary_text: 'UK' },
  { place_id: 'demo_barcelona', description: 'Barcelona, Spain', main_text: 'Barcelona', secondary_text: 'Spain' },
  { place_id: 'demo_rome', description: 'Rome, Italy', main_text: 'Rome', secondary_text: 'Italy' },
  { place_id: 'demo_dubai', description: 'Dubai, United Arab Emirates', main_text: 'Dubai', secondary_text: 'United Arab Emirates' },
  { place_id: 'demo_sydney', description: 'Sydney, Australia', main_text: 'Sydney', secondary_text: 'Australia' },
  { place_id: 'demo_singapore', description: 'Singapore', main_text: 'Singapore', secondary_text: '' },
  { place_id: 'demo_bangkok', description: 'Bangkok, Thailand', main_text: 'Bangkok', secondary_text: 'Thailand' },
  { place_id: 'demo_amsterdam', description: 'Amsterdam, Netherlands', main_text: 'Amsterdam', secondary_text: 'Netherlands' },
  { place_id: 'demo_berlin', description: 'Berlin, Germany', main_text: 'Berlin', secondary_text: 'Germany' },
  { place_id: 'demo_seoul', description: 'Seoul, South Korea', main_text: 'Seoul', secondary_text: 'South Korea' },
  { place_id: 'demo_bali', description: 'Bali, Indonesia', main_text: 'Bali', secondary_text: 'Indonesia' },
  { place_id: 'demo_los_angeles', description: 'Los Angeles, CA, USA', main_text: 'Los Angeles', secondary_text: 'CA, USA' },
  { place_id: 'demo_miami', description: 'Miami, FL, USA', main_text: 'Miami', secondary_text: 'FL, USA' },
  { place_id: 'demo_san_francisco', description: 'San Francisco, CA, USA', main_text: 'San Francisco', secondary_text: 'CA, USA' },
  { place_id: 'demo_lisbon', description: 'Lisbon, Portugal', main_text: 'Lisbon', secondary_text: 'Portugal' },
  { place_id: 'demo_prague', description: 'Prague, Czech Republic', main_text: 'Prague', secondary_text: 'Czech Republic' },
  { place_id: 'demo_vienna', description: 'Vienna, Austria', main_text: 'Vienna', secondary_text: 'Austria' },
];

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
 *   - '(cities)' for city search
 *   - 'establishment' for places (restaurants, hotels, attractions)
 * - location (optional): 'lat,lng' for location bias (required for place search)
 * - radius (optional): Bias radius in meters (default: 50000)
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

    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');
    const types = searchParams.get('types') || '(cities)';
    const location = searchParams.get('location'); // 'lat,lng' format
    const radius = searchParams.get('radius') || '50000'; // 50km default

    if (!input || input.trim().length < 2) {
      return NextResponse.json(
        { predictions: [] },
        { headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // If no API key, use demo data
    if (!PLACES_API_KEY) {
      console.log('No Google Places API key - using demo city data');
      const searchLower = input.toLowerCase();
      const filtered = demoCities.filter(city =>
        city.main_text.toLowerCase().includes(searchLower) ||
        city.description.toLowerCase().includes(searchLower)
      );
      return NextResponse.json(
        { predictions: filtered, demo: true },
        { headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check cache
    const cacheKey = `${input}:${types}:${location || 'none'}:${radius}`;
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

    // Add location bias if provided (for place search within a city)
    if (location) {
      autocompleteUrl.searchParams.set('location', location);
      autocompleteUrl.searchParams.set('radius', radius);
    }

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
