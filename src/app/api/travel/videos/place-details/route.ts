import { NextRequest, NextResponse } from 'next/server';
import type { TravelPlace } from '@/lib/travel/types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// In-memory cache for place lookups (10 days TTL)
const placeCache = new Map<string, { data: TravelPlace; expiresAt: number }>();
const CACHE_TTL = 10 * 24 * 60 * 60 * 1000; // 10 days

/**
 * GET /api/travel/videos/place-details
 * Look up a place by name and city using Google Places Text Search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeName = searchParams.get('name');
    const cityName = searchParams.get('city');

    if (!placeName || !cityName) {
      return NextResponse.json(
        { error: 'Missing required params: name, city' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `place:${placeName.toLowerCase()}:${cityName.toLowerCase()}`;
    const cached = placeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        place: cached.data,
        cached: true,
      });
    }

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API not configured' },
        { status: 200 }
      );
    }

    // Search for the place using Text Search API
    const searchQuery = `${placeName} ${cityName}`;
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`;

    const searchResponse = await fetch(textSearchUrl);
    if (!searchResponse.ok) {
      throw new Error('Text search failed');
    }

    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json(
        { error: 'Place not found', place: null },
        { status: 200 }
      );
    }

    // Get the first (best match) result
    const result = searchData.results[0];
    const placeId = result.place_id;

    // Fetch detailed info using Place Details API
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,photos,types,opening_hours,website,price_level,editorial_summary&key=${GOOGLE_PLACES_API_KEY}`;

    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      throw new Error('Details fetch failed');
    }

    const detailsData = await detailsResponse.json();
    const details = detailsData.result;

    if (!details) {
      return NextResponse.json(
        { error: 'Place details not found', place: null },
        { status: 200 }
      );
    }

    // Build photo URL
    let imageUrl: string | undefined;
    if (details.photos && details.photos.length > 0) {
      imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${details.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
    }

    // Convert to TravelPlace format
    const travelPlace: TravelPlace = {
      id: details.place_id,
      name: details.name,
      address: details.formatted_address,
      coordinates: details.geometry?.location
        ? {
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
          }
        : { lat: 0, lng: 0 },
      rating: details.rating || 0,
      reviewCount: details.user_ratings_total || 0,
      popularityScore: Math.round((details.rating || 0) * (details.user_ratings_total || 0)),
      categories: details.types || [],
      description:
        details.editorial_summary?.overview ||
        `Discover ${details.name} - a popular destination in ${cityName}.`,
      imageUrl,
      priceLevel: details.price_level,
    };

    // Cache the result
    placeCache.set(cacheKey, {
      data: travelPlace,
      expiresAt: Date.now() + CACHE_TTL,
    });

    // Cleanup old cache entries
    if (placeCache.size > 500) {
      const entries = Array.from(placeCache.entries());
      entries
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
        .slice(0, 100)
        .forEach(([key]) => placeCache.delete(key));
    }

    return NextResponse.json({
      place: travelPlace,
      cached: false,
    });
  } catch (error) {
    console.error('Place details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details', place: null },
      { status: 200 }
    );
  }
}
