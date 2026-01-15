import { NextRequest, NextResponse } from 'next/server';

export interface PlaceDetails {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  rating: number;
  reviewCount: number;
  priceLevel?: number;
  openingHours?: {
    isOpen: boolean;
    weekdayText: string[];
  };
  reviews: {
    authorName: string;
    rating: number;
    text: string;
    relativeTime: string;
  }[];
  photos: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  types: string[];
}

// Cache for place details
const detailsCache = new Map<string, { data: PlaceDetails; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'Place ID is required' },
      { status: 400 }
    );
  }

  // Check cache
  const cached = detailsCache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ place: cached.data, cached: true });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Places API key not configured' },
      { status: 500 }
    );
  }

  try {
    const fields = [
      'name',
      'formatted_address',
      'formatted_phone_number',
      'website',
      'url',
      'rating',
      'user_ratings_total',
      'price_level',
      'opening_hours',
      'reviews',
      'photos',
      'geometry',
      'types',
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${id}&fields=${fields}&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch place details');
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.result) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      );
    }

    const place = data.result;

    // Build photo URLs
    const photos = (place.photos || []).slice(0, 10).map((photo: any) =>
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`
    );

    // Normalize reviews
    const reviews = (place.reviews || []).map((review: any) => ({
      authorName: review.author_name,
      rating: review.rating,
      text: review.text,
      relativeTime: review.relative_time_description,
    }));

    const placeDetails: PlaceDetails = {
      id,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      googleMapsUrl: place.url,
      rating: place.rating || 0,
      reviewCount: place.user_ratings_total || 0,
      priceLevel: place.price_level,
      openingHours: place.opening_hours ? {
        isOpen: place.opening_hours.open_now,
        weekdayText: place.opening_hours.weekday_text || [],
      } : undefined,
      reviews,
      photos,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      types: place.types || [],
    };

    // Cache the result
    detailsCache.set(id, { data: placeDetails, timestamp: Date.now() });

    return NextResponse.json({ place: placeDetails });
  } catch (error) {
    console.error('Failed to fetch place details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    );
  }
}
