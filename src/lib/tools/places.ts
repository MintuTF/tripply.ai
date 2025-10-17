import type { PlaceResult, ToolResult } from '@/types';

/**
 * Google Places API Integration
 * Requires GOOGLE_PLACES_API_KEY environment variable
 */

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Place type mappings
 */
const PLACE_TYPES: Record<string, string[]> = {
  hotel: ['lodging', 'hotel'],
  restaurant: ['restaurant', 'food'],
  attraction: ['tourist_attraction', 'point_of_interest', 'museum'],
  cafe: ['cafe'],
  bar: ['bar', 'night_club'],
  all: [],
};

/**
 * Search for places using Google Places API
 */
export async function searchPlaces(params: {
  query: string;
  location: string;
  type?: string;
  radius?: number;
  price_level?: number[];
  min_rating?: number;
}): Promise<ToolResult<PlaceResult[]>> {
  if (!PLACES_API_KEY) {
    return {
      success: false,
      error: 'Google Places API key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { query, location, type = 'all', radius = 5000, price_level, min_rating } = params;

    // First, geocode the location to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${PLACES_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      return {
        success: false,
        error: `Could not geocode location: ${location}`,
        timestamp: new Date().toISOString(),
      };
    }

    const locationCoords = geocodeData.results[0].geometry.location;

    // Build Places search request
    const searchParams = new URLSearchParams({
      query: `${query} in ${location}`,
      location: `${locationCoords.lat},${locationCoords.lng}`,
      radius: radius.toString(),
      key: PLACES_API_KEY,
    });

    // Add type filter if specified
    if (type !== 'all' && PLACE_TYPES[type]) {
      searchParams.append('type', PLACE_TYPES[type][0]);
    }

    const searchUrl = `${PLACES_BASE_URL}/textsearch/json?${searchParams.toString()}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      return {
        success: false,
        error: `Places API error: ${searchData.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    // Parse and filter results
    let places: PlaceResult[] = (searchData.results || []).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address || '',
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      rating: place.rating,
      price_level: place.price_level,
      types: place.types || [],
      photos: place.photos
        ? place.photos.slice(0, 5).map((photo: any) =>
            `${PLACES_BASE_URL}/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${PLACES_API_KEY}`
          )
        : [],
      opening_hours: place.opening_hours?.weekday_text?.join(', '),
      url: place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    }));

    // Apply filters
    if (min_rating) {
      places = places.filter((p) => p.rating && p.rating >= min_rating);
    }

    if (price_level && price_level.length > 0) {
      places = places.filter((p) => p.price_level && price_level.includes(p.price_level));
    }

    // Limit to top 20 results
    places = places.slice(0, 20);

    return {
      success: true,
      data: places,
      sources: [
        {
          url: 'https://maps.google.com',
          title: 'Google Places',
          snippet: `Found ${places.length} places matching "${query}" in ${location}`,
          timestamp: new Date().toISOString(),
          confidence: 0.95,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Places search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get detailed information about a specific place
 */
export async function getPlaceDetails(params: {
  place_id: string;
}): Promise<ToolResult<PlaceResult>> {
  if (!PLACES_API_KEY) {
    return {
      success: false,
      error: 'Google Places API key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { place_id } = params;

    const detailsUrl = `${PLACES_BASE_URL}/details/json?place_id=${place_id}&fields=name,formatted_address,geometry,rating,price_level,photos,opening_hours,website,formatted_phone_number,reviews,types&key=${PLACES_API_KEY}`;

    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (data.status !== 'OK') {
      return {
        success: false,
        error: `Place details error: ${data.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    const place = data.result;
    const placeResult: PlaceResult = {
      place_id: place_id,
      name: place.name,
      address: place.formatted_address || '',
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      rating: place.rating,
      price_level: place.price_level,
      types: place.types || [],
      photos: place.photos
        ? place.photos.slice(0, 10).map((photo: any) =>
            `${PLACES_BASE_URL}/photo?maxwidth=1200&photoreference=${photo.photo_reference}&key=${PLACES_API_KEY}`
          )
        : [],
      opening_hours: place.opening_hours?.weekday_text?.join(', '),
      url: place.website || `https://www.google.com/maps/place/?q=place_id:${place_id}`,
    };

    return {
      success: true,
      data: placeResult,
      sources: [
        {
          url: placeResult.url,
          title: place.name,
          snippet: place.formatted_address,
          timestamp: new Date().toISOString(),
          confidence: 1.0,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Place details error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Calculate travel time between two locations
 */
export async function calculateTravelTime(params: {
  origin: string;
  destination: string;
  mode?: 'driving' | 'walking' | 'transit' | 'bicycling';
  departure_time?: string;
}): Promise<ToolResult<{
  duration: string;
  distance: string;
  mode: string;
}>> {
  if (!PLACES_API_KEY) {
    return {
      success: false,
      error: 'Google Places API key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { origin, destination, mode = 'walking', departure_time } = params;

    const distanceParams = new URLSearchParams({
      origins: origin,
      destinations: destination,
      mode: mode,
      key: PLACES_API_KEY,
    });

    if (departure_time) {
      const timestamp = Math.floor(new Date(departure_time).getTime() / 1000);
      distanceParams.append('departure_time', timestamp.toString());
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${distanceParams.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.rows[0]?.elements[0]) {
      return {
        success: false,
        error: `Distance Matrix API error: ${data.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    const element = data.rows[0].elements[0];

    if (element.status !== 'OK') {
      return {
        success: false,
        error: `Could not calculate route: ${element.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: {
        duration: element.duration.text,
        distance: element.distance.text,
        mode: mode,
      },
      sources: [
        {
          url: 'https://maps.google.com',
          title: 'Google Distance Matrix',
          snippet: `${element.distance.text} via ${mode}`,
          timestamp: new Date().toISOString(),
          confidence: 0.95,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Travel time calculation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}
