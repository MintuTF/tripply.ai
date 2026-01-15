import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { filterByAIRelevance } from '@/lib/video/filter';
import { fetchVideosForCity, isYouTubeConfigured } from '@/lib/video/youtube-client';
import {
  getCityVideos,
  getCityVideoItems,
  saveCityVideos,
  incrementFetchCount,
  isCacheExpired,
  isWithinGracePeriod,
  generateCityKey,
  type VideoItem,
  type CityData,
} from '@/lib/db/video-queries';
import type { YouTubeVideo, VideoSearchResponse } from '@/types/video';

/**
 * GET /api/travel/videos
 * Search for cinematic travel videos for a city
 *
 * Flow:
 * 1. Check database for cached videos
 * 2. If DB HIT and not expired: return videos + AI filter
 * 3. If DB MISS or EXPIRED: fetch from YouTube, save ALL to DB, AI filter, return
 *
 * Query params:
 * - type: 'city' | 'place' | 'collection' (required)
 * - name: Search query or entity name (required)
 * - id: Entity ID for cache key (required)
 * - cityName: City name for AI filtering context
 * - country: Country for better search results
 * - lat: Latitude for city key generation
 * - lng: Longitude for city key generation
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`youtube-videos:${clientIP}`, {
      windowMs: 60 * 1000,
      maxRequests: 20, // Increased since DB caching reduces API calls
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { videos: [], cached: false, error: 'Rate limit exceeded' } as VideoSearchResponse,
        { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('type') as 'city' | 'place' | 'collection' | null;
    const entityName = searchParams.get('name');
    const entityId = searchParams.get('id');
    const cityName = searchParams.get('cityName') || entityName;
    const country = searchParams.get('country') || undefined;
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const skipFilter = searchParams.get('skipFilter') === 'true'; // Skip AI filtering for Explore collections

    // Validate params
    if (!entityType || !['city', 'place', 'collection'].includes(entityType)) {
      return NextResponse.json(
        { videos: [], cached: false, error: 'Invalid type parameter' } as VideoSearchResponse,
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    if (!entityName || entityName.trim().length < 2) {
      return NextResponse.json(
        { videos: [], cached: false, error: 'Name parameter required' } as VideoSearchResponse,
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    if (!entityId) {
      return NextResponse.json(
        { videos: [], cached: false, error: 'ID parameter required' } as VideoSearchResponse,
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Generate city key for database lookup
    // Use coordinates if available, otherwise generate from city name
    // For collections, include entityId to create unique cache keys per collection type
    const effectiveCityName = cityName || entityName;
    const collectionId = entityType === 'collection' ? entityId : undefined;
    const cityKey = lat && lng
      ? generateCityKey(effectiveCityName!, lat, lng, collectionId)
      : generateCityKey(effectiveCityName!, 0, 0, collectionId); // Fallback without coordinates

    console.log(`[Videos] Request: type=${entityType}, city=${effectiveCityName}, key=${cityKey}`);

    // ========================================
    // Step 1: Check Database Cache
    // ========================================
    let dbCacheHit = false;
    let fromGracePeriod = false;
    let cachedVideos: VideoItem[] = [];

    try {
      const cityCache = await getCityVideos(cityKey);

      if (cityCache) {
        const expired = await isCacheExpired(cityKey);
        const inGrace = await isWithinGracePeriod(cityKey);

        if (!expired) {
          // Cache is valid - use it
          dbCacheHit = true;
          cachedVideos = await getCityVideoItems(cityKey);
          console.log(`[Videos] DB HIT: ${cachedVideos.length} videos for ${effectiveCityName}`);

          // Increment fetch count (async, don't wait)
          incrementFetchCount(cityKey).catch((err) =>
            console.error('[Videos] Failed to increment fetch count:', err)
          );
        } else if (inGrace) {
          // Cache expired but within grace period - return stale data
          dbCacheHit = true;
          fromGracePeriod = true;
          cachedVideos = await getCityVideoItems(cityKey);
          console.log(`[Videos] GRACE PERIOD: returning ${cachedVideos.length} stale videos`);

          // Trigger background refresh (don't await)
          refreshCityVideos(cityKey, effectiveCityName!, country, lat, lng, collectionId).catch((err) =>
            console.error('[Videos] Background refresh failed:', err)
          );
        }
      }
    } catch (dbError) {
      console.error('[Videos] Database error, falling back to YouTube:', dbError);
      // Continue to YouTube API
    }

    // ========================================
    // Step 2: Return from DB Cache if available
    // ========================================
    if (dbCacheHit && cachedVideos.length > 0) {
      // Transform DB format to API format
      let videos: YouTubeVideo[] = cachedVideos.map(videoItemToYouTubeVideo);

      // AI filter the cached videos (unless skipFilter=true for Explore collections)
      if (!skipFilter && videos.length > 4) {
        videos = await filterByAIRelevance(videos, entityName!, effectiveCityName!);
        console.log(`[Videos] AI filtered ${cachedVideos.length} → ${videos.length} videos`);
      } else if (!skipFilter) {
        videos = videos.slice(0, 4);
      }
      // If skipFilter=true, return ALL videos without filtering

      return NextResponse.json(
        {
          videos,
          cached: true,
          entityName: effectiveCityName,
          source: 'database',
          stale: fromGracePeriod,
        } as VideoSearchResponse & { source: string; stale?: boolean },
        {
          headers: {
            'Cache-Control': 'public, max-age=3600', // 1 hour browser cache
            'X-Cache': 'HIT',
            'X-Cache-Source': 'database',
            ...createRateLimitHeaders(rateLimitResult),
          },
        }
      );
    }

    // ========================================
    // Step 3: Fetch from YouTube API
    // ========================================
    if (!isYouTubeConfigured()) {
      console.warn('[Videos] YouTube API not configured');
      return NextResponse.json(
        {
          videos: [],
          cached: false,
          entityName: effectiveCityName,
          error: 'YouTube API not configured',
        } as VideoSearchResponse,
        { status: 200, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    console.log(`[Videos] DB MISS: Fetching from YouTube for ${effectiveCityName}`);

    let allVideos: VideoItem[];
    try {
      // Pass collectionId for collection-specific search queries
      allVideos = await fetchVideosForCity(effectiveCityName!, country, collectionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'QUOTA_EXCEEDED') {
        console.error('[Videos] YouTube quota exceeded');
        return NextResponse.json(
          {
            videos: [],
            cached: false,
            entityName: effectiveCityName,
            error: 'YouTube quota exceeded',
          } as VideoSearchResponse,
          { status: 200, headers: createRateLimitHeaders(rateLimitResult) }
        );
      }

      throw error;
    }

    if (allVideos.length === 0) {
      console.log('[Videos] No videos found from YouTube');
      return NextResponse.json(
        {
          videos: [],
          cached: false,
          entityName: effectiveCityName,
        } as VideoSearchResponse,
        { status: 200, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // ========================================
    // Step 4: Save ALL videos to Database
    // ========================================
    try {
      const cityData: CityData = {
        cityName: effectiveCityName!,
        country,
        lat: lat || 0,
        lng: lng || 0,
        collectionId, // Include collection ID for unique cache keys per collection type
      };

      await saveCityVideos(cityData, allVideos);
      console.log(`[Videos] Saved ${allVideos.length} videos to database (key: ${cityKey})`);
    } catch (saveError) {
      console.error('[Videos] Failed to save to database:', saveError);
      // Continue anyway - still return the videos
    }

    // ========================================
    // Step 5: AI Filter and Return (unless skipFilter=true)
    // ========================================
    let videos: YouTubeVideo[] = allVideos.map(videoItemToYouTubeVideo);

    console.log(`\n========== VIDEO SEARCH DEBUG ==========`);
    console.log(`City: ${effectiveCityName}, Total videos: ${videos.length}, skipFilter: ${skipFilter}`);
    videos.forEach((v, i) => {
      console.log(`  ${i}. "${v.title}" by ${v.channelTitle}`);
    });

    if (skipFilter) {
      // Return ALL videos for Explore collections
      console.log(`\nSkipping AI filter - returning all ${videos.length} videos`);
    } else if (videos.length > 4) {
      console.log(`\nSending to AI for filtering...`);
      videos = await filterByAIRelevance(videos, entityName!, effectiveCityName!);
      console.log(`\nAI selected these ${videos.length} videos:`);
      videos.forEach((v, i) => {
        console.log(`  ${i}. "${v.title}" by ${v.channelTitle}`);
      });
    } else {
      videos = videos.slice(0, 4);
      console.log(`Only ${videos.length} videos, no AI filtering needed`);
    }
    console.log(`========================================\n`);

    return NextResponse.json(
      {
        videos,
        cached: false,
        entityName: effectiveCityName,
        source: 'youtube',
        totalInPool: allVideos.length,
      } as VideoSearchResponse & { source: string; totalInPool: number },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'MISS',
          'X-Cache-Source': 'youtube',
          ...createRateLimitHeaders(rateLimitResult),
        },
      }
    );
  } catch (error) {
    console.error('[Videos] Error:', error);
    return NextResponse.json(
      {
        videos: [],
        cached: false,
        error: 'Failed to fetch videos',
      } as VideoSearchResponse,
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convert VideoItem (DB format) to YouTubeVideo (API format)
 */
function videoItemToYouTubeVideo(item: VideoItem): YouTubeVideo {
  return {
    videoId: item.videoId,
    title: item.title,
    description: item.description,
    thumbnailUrl: item.thumbnailUrl,
    channelTitle: item.channelTitle,
    publishedAt: item.publishedAt,
  };
}

/**
 * Background refresh for expired cache (grace period)
 */
async function refreshCityVideos(
  cityKey: string,
  cityName: string,
  country: string | undefined,
  lat: number,
  lng: number,
  collectionId?: string
): Promise<void> {
  console.log(`[Videos] Background refresh started for ${cityName}${collectionId ? ` (${collectionId})` : ''}`);

  try {
    const allVideos = await fetchVideosForCity(cityName, country, collectionId);

    if (allVideos.length > 0) {
      await saveCityVideos(
        { cityName, country, lat: lat || 0, lng: lng || 0, collectionId },
        allVideos
      );
      console.log(`[Videos] Background refresh completed: ${allVideos.length} videos`);
    }
  } catch (error) {
    console.error(`[Videos] Background refresh failed for ${cityName}:`, error);
  }
}
