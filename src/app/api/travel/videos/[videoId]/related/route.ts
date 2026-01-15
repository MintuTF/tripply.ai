import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { relatedVideosService } from '@/lib/video';
import type { RelatedVideosResponse } from '@/lib/video/types';

/**
 * GET /api/travel/videos/[videoId]/related
 * Get related videos sorted by AI relevance
 *
 * Query params:
 * - title: Current video title (required for AI context)
 * - city: City name for filtering (optional)
 * - limit: Max number of videos (default 10, max 25)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(request.url);

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`youtube-related:${clientIP}`, {
      windowMs: 60 * 1000,
      maxRequests: 20,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { videos: [], cached: false, error: 'Rate limit exceeded' } as RelatedVideosResponse,
        { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Validate videoId
    if (!videoId || videoId.length < 5) {
      return NextResponse.json(
        { videos: [], cached: false, error: 'Invalid video ID' } as RelatedVideosResponse,
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse query params
    const videoTitle = searchParams.get('title') || '';
    const city = searchParams.get('city') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '10'), 1), 25);

    console.log(`[RelatedVideos API] Fetching for: ${videoId}, city: ${city}, limit: ${limit}`);

    // Fetch related videos using the service
    const videos = await relatedVideosService.getRelatedVideos({
      videoId,
      videoTitle,
      city,
      limit,
    });

    // If no related videos found, try searching for similar videos
    if (videos.length === 0 && videoTitle && city) {
      console.log(`[RelatedVideos API] No related videos, searching similar videos`);
      const similarVideos = await relatedVideosService.searchSimilarVideos(
        videoTitle,
        city,
        limit
      );

      return NextResponse.json(
        { videos: similarVideos, cached: false } as RelatedVideosResponse,
        {
          headers: {
            'Cache-Control': 'public, max-age=3600',
            'X-Fallback': 'similar-search',
            ...createRateLimitHeaders(rateLimitResult),
          },
        }
      );
    }

    return NextResponse.json(
      { videos, cached: false } as RelatedVideosResponse,
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          ...createRateLimitHeaders(rateLimitResult),
        },
      }
    );
  } catch (error) {
    console.error('[RelatedVideos API] Error:', error);
    return NextResponse.json(
      { videos: [], cached: false, error: 'Failed to fetch related videos' } as RelatedVideosResponse,
      { status: 500 }
    );
  }
}
