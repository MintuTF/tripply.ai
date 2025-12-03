import { NextResponse } from 'next/server';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/**
 * GET /api/places/photo
 * Proxy endpoint for Google Places photos
 *
 * Query params:
 * - ref (required): Photo reference from Google Places API
 * - maxwidth (optional): Max width of image (default: 800)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const photoReference = searchParams.get('ref');
  const maxWidth = searchParams.get('maxwidth') || '800';

  if (!photoReference) {
    return new NextResponse('Missing photo reference', { status: 400 });
  }

  if (!PLACES_API_KEY) {
    return new NextResponse('API key not configured', { status: 500 });
  }

  try {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${PLACES_API_KEY}`;

    const response = await fetch(photoUrl, {
      // Follow redirects (Google Places Photo API redirects to actual image)
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`[Photo Proxy] Failed to fetch photo: ${response.status}`);
      return new NextResponse('Failed to fetch photo', { status: response.status });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // Cache for 24h, stale for 7 days
      },
    });
  } catch (error) {
    console.error('[Photo Proxy] Error:', error);
    return new NextResponse('Error fetching photo', { status: 500 });
  }
}
