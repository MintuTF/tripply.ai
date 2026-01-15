import { NextRequest, NextResponse } from 'next/server';
import type { TravelPlace } from '@/lib/travel/types';

// In-memory cache for details data
const detailsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Global place storage (shared with /api/travel/places)
// This is populated when places are fetched
declare global {
  var placesById: Map<string, TravelPlace> | undefined;
}

if (!global.placesById) {
  global.placesById = new Map();
}

// Base URL for internal API calls
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Helper function to get similar places by category matching
function getSimilarPlaces(place: TravelPlace, allPlaces: TravelPlace[]): TravelPlace[] {
  const categories = place.categories.map(c => c.toLowerCase());

  return allPlaces
    .filter(p => p.id !== place.id)
    .map(p => ({
      place: p,
      score: p.categories.filter(cat =>
        categories.some(c =>
          cat.toLowerCase().includes(c) || c.includes(cat.toLowerCase())
        )
      ).length
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(item => item.place);
}

// Helper function to categorize places
function categorizePlaces(places: TravelPlace[]) {
  const hotels: TravelPlace[] = [];
  const activities: TravelPlace[] = [];
  const restaurants: TravelPlace[] = [];

  places.forEach((place) => {
    const categories = place.categories.map(c => c.toLowerCase());

    if (categories.some(c =>
      c.includes('hotel') ||
      c.includes('lodging') ||
      c.includes('accommodation')
    )) {
      hotels.push(place);
    } else if (categories.some(c =>
      c.includes('restaurant') ||
      c.includes('cafe') ||
      c.includes('food') ||
      c.includes('dining') ||
      c.includes('bar')
    )) {
      restaurants.push(place);
    } else {
      activities.push(place);
    }
  });

  return { hotels, activities, restaurants };
}

/**
 * GET /api/travel/place/details
 * Returns comprehensive place details including nearby recommendations
 * Used by: /travel/places/[id] full detail page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('id');

    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    // Check cache
    const cached = detailsCache.get(placeId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Try to get place from global storage
    let place = global.placesById?.get(placeId);

    // If not in cache, try to fetch from Google Places API
    if (!place) {
      try {
        const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (googleApiKey) {
          const googleResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,photos,types,opening_hours,website,price_level,editorial_summary&key=${googleApiKey}`
          );

          if (googleResponse.ok) {
            const googleData = await googleResponse.json();
            if (googleData.result) {
              const result = googleData.result;
              // Convert Google Place to TravelPlace format
              place = {
                id: result.place_id,
                name: result.name,
                address: result.formatted_address,
                coordinates: result.geometry?.location ? {
                  lat: result.geometry.location.lat,
                  lng: result.geometry.location.lng
                } : undefined,
                rating: result.rating || 0,
                reviewCount: result.user_ratings_total || 0,
                popularityScore: result.rating || 0,
                categories: result.types || [],
                description: result.editorial_summary?.overview || `Explore ${result.name} - a popular destination.`,
                imageUrl: result.photos?.[0]
                  ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${result.photos[0].photo_reference}&key=${googleApiKey}`
                  : undefined,
                priceLevel: result.price_level,
                website: result.website,
              } as TravelPlace;

              // Add to cache for future use
              global.placesById?.set(placeId, place);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch from Google Places:', error);
      }
    }

    if (!place) {
      return NextResponse.json(
        { error: 'Place not found. The place details could not be retrieved.' },
        { status: 404 }
      );
    }

    // Fetch nearby places if coordinates available
    let nearbyPlaces: TravelPlace[] = [];
    if (place.coordinates) {
      try {
        const nearbyResponse = await fetch(
          `${baseUrl}/api/travel/places?lat=${place.coordinates.lat}&lng=${place.coordinates.lng}&radius=2000`,
          { cache: 'no-store' }
        );

        if (nearbyResponse.ok) {
          const nearbyData = await nearbyResponse.json();
          nearbyPlaces = (nearbyData.places || [])
            .filter((p: TravelPlace) => p.id !== placeId)
            .slice(0, 20); // Get top 20 nearby places
        }
      } catch (error) {
        console.error('Failed to fetch nearby places:', error);
      }
    }

    // Categorize nearby places
    const categorizedNearby = categorizePlaces(nearbyPlaces);

    // Get similar places by category matching
    const allPlaces = Array.from(global.placesById?.values() || []);
    const similarPlaces = getSimilarPlaces(place, allPlaces);

    // Fetch AI explanation (optional)
    let aiReasons: string[] = [];
    try {
      const aiResponse = await fetch(`${baseUrl}/api/travel/ai/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'whyVisit',
          place: {
            id: place.id,
            name: place.name,
            categories: place.categories,
            rating: place.rating,
            description: place.description,
          },
          maxReasons: 5, // Get up to 5 reasons for full page
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiReasons = aiData.reasons || [];
      }
    } catch (error) {
      console.error('Failed to fetch AI reasons:', error);
    }

    // Return comprehensive details
    const detailsData = {
      place: {
        ...place,
        // Ensure we have all fields
        fullDescription: place.description,
        images: [place.imageUrl], // For now, single image. Can be extended.
      },
      nearby: categorizedNearby,
      similarPlaces,
      aiReasons,
    };

    // Cache the result
    detailsCache.set(placeId, {
      data: detailsData,
      timestamp: Date.now(),
    });

    return NextResponse.json(detailsData);
  } catch (error) {
    console.error('Details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    );
  }
}
