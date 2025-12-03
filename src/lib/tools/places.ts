import type { PlaceResult, ToolResult } from '@/types';

/**
 * Google Places API Integration
 * Requires GOOGLE_PLACES_API_KEY environment variable
 */

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Place type mappings
 * 'spot' now includes both attractions and activities (merged as "Things to Do")
 */
const PLACE_TYPES: Record<string, string[]> = {
  hotel: ['lodging', 'hotel'],
  restaurant: ['restaurant', 'food'],
  spot: ['tourist_attraction', 'amusement_park', 'museum', 'aquarium', 'zoo', 'park', 'point_of_interest'],
  food: ['restaurant', 'food'],
  cafe: ['cafe'],
  bar: ['bar', 'night_club'],
  all: [],
};

/**
 * Travel-relevant place types (for filtering "all" results)
 */
const TRAVEL_RELEVANT_TYPES = new Set([
  'tourist_attraction',
  'museum',
  'art_gallery',
  'aquarium',
  'amusement_park',
  'zoo',
  'park',
  'natural_feature',
  'lodging',
  'hotel',
  'restaurant',
  'cafe',
  'bar',
  'night_club',
  'food',
  'meal_takeaway',
  'meal_delivery',
  'shopping_mall',
  'store',
  'spa',
  'beauty_salon',
  'gym',
  'stadium',
  'movie_theater',
  'bowling_alley',
  'casino',
  'library',
  'church',
  'hindu_temple',
  'mosque',
  'synagogue',
  'place_of_worship',
  'point_of_interest',
]);

/**
 * Non-travel types to exclude from "all" results
 */
const EXCLUDED_TYPES = new Set([
  'moving_company',
  'storage',
  'car_dealer',
  'car_rental',
  'car_repair',
  'car_wash',
  'gas_station',
  'parking',
  'transit_station',
  'bus_station',
  'train_station',
  'subway_station',
  'taxi_stand',
  'airport',
  'local_government_office',
  'courthouse',
  'embassy',
  'city_hall',
  'fire_station',
  'police',
  'post_office',
  'funeral_home',
  'cemetery',
  'insurance_agency',
  'real_estate_agency',
  'lawyer',
  'accounting',
  'atm',
  'bank',
  'electrician',
  'plumber',
  'roofing_contractor',
  'locksmith',
  'painter',
  'hardware_store',
  'home_goods_store',
  'furniture_store',
  'veterinary_care',
  'pet_store',
  'pharmacy',
  'drugstore',
  'doctor',
  'dentist',
  'hospital',
  'physiotherapist',
  'school',
  'primary_school',
  'secondary_school',
  'university',
]);

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
    // For "all" type, search for travel-relevant things instead of everything
    const searchQuery = type === 'all' && !query
      ? `things to do hotels restaurants attractions in ${location}`
      : `${query} in ${location}`;

    const searchParams = new URLSearchParams({
      query: searchQuery,
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
      review_count: place.user_ratings_total,
      price_level: place.price_level,
      types: place.types || [],
      photos: place.photos
        ? place.photos.slice(0, 5).map((photo: any) =>
            `/api/places/photo?ref=${photo.photo_reference}&maxwidth=800`
          )
        : [],
      opening_hours: place.opening_hours?.weekday_text?.join(', '),
      url: place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    }));

    // Filter out non-travel types when searching "all"
    if (type === 'all') {
      places = places.filter((place) => {
        // Exclude if place has any excluded types
        const hasExcludedType = place.types.some(t => EXCLUDED_TYPES.has(t));
        if (hasExcludedType) return false;

        // Include if place has any travel-relevant types
        const hasTravelType = place.types.some(t => TRAVEL_RELEVANT_TYPES.has(t));
        return hasTravelType;
      });
    }

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

    const detailsUrl = `${PLACES_BASE_URL}/details/json?place_id=${place_id}&fields=name,formatted_address,geometry,rating,user_ratings_total,price_level,photos,opening_hours,website,formatted_phone_number,reviews,types,editorial_summary&key=${PLACES_API_KEY}`;

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
      review_count: place.user_ratings_total,
      price_level: place.price_level,
      types: place.types || [],
      photos: place.photos
        ? place.photos.slice(0, 5).map((photo: any) =>
            `/api/places/photo?ref=${photo.photo_reference}&maxwidth=1200`
          )
        : [],
      opening_hours: place.opening_hours?.weekday_text?.join(', '),
      url: place.website || `https://www.google.com/maps/place/?q=place_id:${place_id}`,
      phone: place.formatted_phone_number,
      website: place.website,
      reviews: place.reviews?.map((review: any) => ({
        author_name: review.author_name,
        author_url: review.author_url,
        profile_photo_url: review.profile_photo_url,
        rating: review.rating,
        relative_time_description: review.relative_time_description,
        text: review.text,
        time: review.time,
        photos: review.photos
          ? review.photos.map((photo: any) =>
              `/api/places/photo?ref=${photo.photo_reference}&maxwidth=400`
            )
          : [],
      })),
      editorial_summary: place.editorial_summary?.overview,
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
 * Find a place by name (for enriching SerpAPI results with Google Places data)
 * Returns place_id and photos for a given hotel name
 */
export async function findPlaceByName(params: {
  name: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
}): Promise<ToolResult<{ place_id: string; photos: string[] } | null>> {
  if (!PLACES_API_KEY) {
    return {
      success: false,
      error: 'Google Places API key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { name, location, coordinates } = params;

    // Build search query
    const searchQuery = location ? `${name} ${location}` : name;

    const searchParams = new URLSearchParams({
      query: searchQuery,
      key: PLACES_API_KEY,
    });

    // Add location bias if coordinates provided
    if (coordinates) {
      searchParams.append('location', `${coordinates.lat},${coordinates.lng}`);
      searchParams.append('radius', '1000'); // 1km radius for matching
    }

    const searchUrl = `${PLACES_BASE_URL}/textsearch/json?${searchParams.toString()}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status === 'ZERO_RESULTS' || !searchData.results || searchData.results.length === 0) {
      return {
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    if (searchData.status !== 'OK') {
      return {
        success: false,
        error: `Places API error: ${searchData.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    // Take the first (best) match
    const place = searchData.results[0];

    return {
      success: true,
      data: {
        place_id: place.place_id,
        photos: place.photos
          ? place.photos.slice(0, 5).map((photo: any) =>
              `/api/places/photo?ref=${photo.photo_reference}&maxwidth=1200`
            )
          : [],
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Find place by name error:', error);
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
