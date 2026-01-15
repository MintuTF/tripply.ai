import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for preview data
const previewCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

/**
 * GET /api/travel/place/preview
 * Returns lightweight preview data for a place
 * Used by: PlaceDetailDrawer (preview mode)
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
    const cached = previewCache.get(placeId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Fetch from main places API
    const placesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/travel/places`,
      { cache: 'no-store' }
    );

    if (!placesResponse.ok) {
      throw new Error('Failed to fetch places');
    }

    const placesData = await placesResponse.json();
    const place = placesData.places?.find((p: any) => p.id === placeId);

    if (!place) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      );
    }

    // Return lightweight preview data only
    const previewData = {
      id: place.id,
      name: place.name,
      rating: place.rating,
      reviewCount: place.reviewCount,
      categories: place.categories,
      shortDescription: place.shortDescription || place.description?.substring(0, 200) + '...',
      imageUrl: place.imageUrl,
      coordinates: place.coordinates,
      duration: place.duration,
      area: place.area,
      priceLevel: place.priceLevel,
    };

    // Cache the result
    previewCache.set(placeId, {
      data: previewData,
      timestamp: Date.now(),
    });

    return NextResponse.json(previewData);
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place preview' },
      { status: 500 }
    );
  }
}
