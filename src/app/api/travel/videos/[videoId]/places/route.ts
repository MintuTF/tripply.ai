import { NextRequest, NextResponse } from 'next/server';
import { getVideoPlaces } from '@/lib/video/videoPlaces';
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';

/**
 * POST /api/travel/videos/[videoId]/places
 * Places the video actually names (read from its captions), matched to real map places.
 * Body: { title, description?, city? }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video id' }, { status: 400 });
  }

  const limit = checkRateLimit(`video-places:${getClientIP(request)}`, { windowMs: 60 * 1000, maxRequests: 10 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429, headers: createRateLimitHeaders(limit) }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI is not configured' }, { status: 503 });
  }

  let body: { title?: string; description?: string; city?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const title = (body.title || '').toString().slice(0, 200);
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  try {
    const result = await getVideoPlaces({
      videoId,
      title,
      description: (body.description || '').toString().slice(0, 5000),
      city: (body.city || '').toString().slice(0, 80),
    });
    return NextResponse.json(result, {
      headers: { ...createRateLimitHeaders(limit), 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error) {
    console.error('[VideoPlaces] Error:', error);
    return NextResponse.json({ error: 'Could not read this video' }, { status: 502 });
  }
}
