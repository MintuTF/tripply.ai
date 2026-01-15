import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import type {
  VideoDetails,
  VideoDetailsResponse,
  YouTubeVideosResponse,
} from '@/lib/video/types';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/videos';

/**
 * Parse ISO 8601 duration to human-readable format
 * e.g., "PT5M30S" -> "5:30"
 */
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * GET /api/travel/videos/[videoId]
 * Get video details including statistics from YouTube API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`youtube-video-details:${clientIP}`, {
      windowMs: 60 * 1000,
      maxRequests: 30,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { video: null, error: 'Rate limit exceeded' } as VideoDetailsResponse,
        { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Validate videoId
    if (!videoId || videoId.length < 5) {
      return NextResponse.json(
        { video: null, error: 'Invalid video ID' } as VideoDetailsResponse,
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check if API key is configured
    if (!YOUTUBE_API_KEY) {
      console.warn('YouTube API key not configured');
      return NextResponse.json(
        { video: null, error: 'YouTube API not configured' } as VideoDetailsResponse,
        { status: 200, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Fetch video details from YouTube API
    const url = new URL(YOUTUBE_API_URL);
    url.searchParams.set('part', 'snippet,contentDetails,statistics');
    url.searchParams.set('id', videoId);
    url.searchParams.set('key', YOUTUBE_API_KEY);

    console.log(`[VideoDetails] Fetching details for: ${videoId}`);
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[VideoDetails] YouTube API error:', response.status, errorData);

      if (response.status === 403) {
        return NextResponse.json(
          { video: null, error: 'YouTube quota exceeded' } as VideoDetailsResponse,
          { status: 200, headers: createRateLimitHeaders(rateLimitResult) }
        );
      }

      return NextResponse.json(
        { video: null, error: 'YouTube API error' } as VideoDetailsResponse,
        { status: 200, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    const data: YouTubeVideosResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { video: null, error: 'Video not found' } as VideoDetailsResponse,
        { status: 404, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    const item = data.items[0];
    const duration = item.contentDetails?.duration || 'PT0S';

    const videoDetails: VideoDetails = {
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl:
        item.snippet.thumbnails.maxres?.url ||
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        '',
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: parseInt(item.statistics?.viewCount || '0'),
      likeCount: parseInt(item.statistics?.likeCount || '0'),
      commentCount: parseInt(item.statistics?.commentCount || '0'),
      duration,
      durationFormatted: formatDuration(duration),
      tags: item.snippet.tags || [],
    };

    console.log(`[VideoDetails] Found: "${videoDetails.title}" (${videoDetails.viewCount} views)`);

    return NextResponse.json(
      { video: videoDetails } as VideoDetailsResponse,
      {
        headers: {
          'Cache-Control': 'public, max-age=3600', // 1 hour browser cache
          ...createRateLimitHeaders(rateLimitResult),
        },
      }
    );
  } catch (error) {
    console.error('[VideoDetails] Error:', error);
    return NextResponse.json(
      { video: null, error: 'Failed to fetch video details' } as VideoDetailsResponse,
      { status: 500 }
    );
  }
}
