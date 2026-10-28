import { NextResponse } from 'next/server';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Photo references are opaque base64url strings
const REF_PATTERN = /^[A-Za-z0-9_-]{20,2000}$/;
const ALLOWED_WIDTHS = [200, 400, 800, 1200];

function snapWidth(raw: string | null): number {
  const requested = parseInt(raw || '800', 10);
  if (!Number.isFinite(requested)) return 800;
  return ALLOWED_WIDTHS.find((w) => w >= requested) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

// Browser 1h, CDN 1 day. The CDN absorbs repeat views so each photo is billed once per cache window.
const CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400';

/**
 * GET /api/places/photo?ref=...&maxwidth=...
 * Keeps the Google API key server-side. Responds with a cacheable redirect to Google's
 * key-free image URL, so image bytes never flow through this server.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const photoReference = searchParams.get('ref');

  if (!photoReference || !REF_PATTERN.test(photoReference)) {
    return new NextResponse('Invalid photo reference', { status: 400 });
  }

  if (!PLACES_API_KEY) {
    return new NextResponse('Photos unavailable', { status: 503 });
  }

  const googleUrl =
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${snapWidth(searchParams.get('maxwidth'))}` +
    `&photoreference=${encodeURIComponent(photoReference)}&key=${PLACES_API_KEY}`;

  try {
    const response = await fetch(googleUrl, { redirect: 'manual' });
    const location = response.headers.get('location');

    // Normal case: Google answers 302 with the final, key-free image URL
    if (response.status >= 300 && response.status < 400 && location) {
      return new NextResponse(null, {
        status: 302,
        headers: { Location: location, 'Cache-Control': CACHE_CONTROL },
      });
    }

    if (!response.ok) {
      console.error(`[Photo Proxy] Google responded ${response.status}`);
      return new NextResponse('Photo unavailable', { status: response.status === 429 ? 503 : 404 });
    }

    // Fallback: Google returned image bytes directly
    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error('[Photo Proxy] Error:', error);
    return new NextResponse('Photo unavailable', { status: 502 });
  }
}
