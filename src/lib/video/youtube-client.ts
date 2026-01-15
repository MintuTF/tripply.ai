/**
 * YouTube API Client for Database Video Caching
 *
 * Handles:
 * - YouTube Search API calls
 * - YouTube Videos API calls (for duration + stats)
 * - Duration parsing and video type classification
 * - Video scoring algorithm
 */

import type { VideoItem } from '@/lib/db/video-queries';
import { classifyVideoType } from '@/lib/db/video-queries';
import type { YouTubeVideosResponse, YouTubeVideoResource } from './types';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

// ============================================
// Types
// ============================================

interface SearchOptions {
  maxResults?: number;
  videoDuration?: 'any' | 'short' | 'medium' | 'long';
  order?: 'relevance' | 'date' | 'rating' | 'viewCount';
  videoDefinition?: 'any' | 'high' | 'standard';
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  pageInfo: { totalResults: number };
}

// ============================================
// Duration Parsing
// ============================================

/**
 * Parse ISO 8601 duration to seconds
 * Examples: "PT4M13S" → 253, "PT1H30M" → 5400, "PT45S" → 45
 */
export function parseDuration(isoDuration: string): number {
  if (!isoDuration) return 0;

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds to human-readable duration (e.g., "5:30" or "1:05:30")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// Video Scoring
// ============================================

/**
 * Calculate video score for ranking
 *
 * Score formula:
 * - View count (log scale): 40%
 * - Engagement ratio (likes/views): 30%
 * - Short video bonus: 20%
 * - Title quality: 10%
 */
export function calculateVideoScore(
  viewCount: number,
  likeCount: number,
  durationSeconds: number,
  title: string
): number {
  let score = 0;

  // View count score (log scale, max ~10 for 10B views)
  if (viewCount > 0) {
    score += Math.log10(viewCount) * 0.04; // 40% weight, normalized
  }

  // Engagement ratio (likes/views)
  if (viewCount > 0 && likeCount > 0) {
    const engagementRatio = likeCount / viewCount;
    score += Math.min(engagementRatio * 10, 0.3); // Cap at 30%
  }

  // Short video bonus (under 60 seconds)
  if (durationSeconds > 0 && durationSeconds <= 60) {
    score += 0.2;
  }

  // Title quality score (travel-related keywords)
  const travelKeywords = ['travel', 'tour', 'guide', 'visit', 'explore', 'trip', 'vacation', 'cinematic', '4k', 'walking'];
  const titleLower = title.toLowerCase();
  const matchedKeywords = travelKeywords.filter((k) => titleLower.includes(k));
  score += Math.min(matchedKeywords.length * 0.025, 0.1); // Max 10%

  return Math.round(score * 100) / 100; // Round to 2 decimals
}

// ============================================
// Collection Search Terms
// ============================================

/**
 * Map collection IDs to specific search terms for differentiated results
 */
const COLLECTION_SEARCH_TERMS: Record<string, string> = {
  'hidden-gems': 'hidden gems secret spots local',
  'best-food': 'best food restaurants street food',
  'must-see': 'must see top attractions sightseeing',
  'cultural': 'cultural temples shrines heritage traditions',
};

// ============================================
// YouTube API Functions
// ============================================

/**
 * Search YouTube for videos
 * Returns basic video info (no duration - need separate API call)
 */
export async function searchYouTubeVideos(
  query: string,
  options: SearchOptions = {}
): Promise<YouTubeSearchItem[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTubeClient] API key not configured');
    return [];
  }

  const url = new URL(YOUTUBE_SEARCH_URL);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('safeSearch', 'strict');
  url.searchParams.set('maxResults', String(options.maxResults || 25));
  url.searchParams.set('order', options.order || 'relevance');
  url.searchParams.set('q', query);
  url.searchParams.set('key', YOUTUBE_API_KEY);

  if (options.videoDuration && options.videoDuration !== 'any') {
    url.searchParams.set('videoDuration', options.videoDuration);
  }

  if (options.videoDefinition && options.videoDefinition !== 'any') {
    url.searchParams.set('videoDefinition', options.videoDefinition);
  }

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[YouTubeClient] Search API error:', response.status, error);

      if (response.status === 403) {
        throw new Error('QUOTA_EXCEEDED');
      }
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data: YouTubeSearchResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('[YouTubeClient] Search failed:', error);
    throw error;
  }
}

/**
 * Get video details including duration and statistics
 * Call this after search to get full video info
 */
export async function getVideoDetails(
  videoIds: string[]
): Promise<Map<string, YouTubeVideoResource>> {
  if (!YOUTUBE_API_KEY || videoIds.length === 0) {
    return new Map();
  }

  // YouTube API allows max 50 IDs per request
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const results = new Map<string, YouTubeVideoResource>();

  for (const chunk of chunks) {
    const url = new URL(YOUTUBE_VIDEOS_URL);
    url.searchParams.set('part', 'contentDetails,statistics');
    url.searchParams.set('id', chunk.join(','));
    url.searchParams.set('key', YOUTUBE_API_KEY);

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error('[YouTubeClient] Videos API error:', response.status);
        continue;
      }

      const data: YouTubeVideosResponse = await response.json();

      for (const item of data.items || []) {
        results.set(item.id, item);
      }
    } catch (error) {
      console.error('[YouTubeClient] Videos API failed:', error);
    }
  }

  return results;
}

/**
 * Search and enrich videos with full details
 * This is the main function to call for fetching videos to cache
 *
 * @param cityName - Name of the city to search for
 * @param country - Optional country for more specific results
 * @param collectionType - Optional collection type for differentiated search queries
 */
export async function fetchVideosForCity(
  cityName: string,
  country?: string,
  collectionType?: string
): Promise<VideoItem[]> {
  // Build search query based on collection type
  let query = cityName;

  if (collectionType && COLLECTION_SEARCH_TERMS[collectionType]) {
    // Use collection-specific search terms
    query += ` ${COLLECTION_SEARCH_TERMS[collectionType]}`;
  } else {
    // Default generic travel search
    query += ' travel cinematic';
  }

  if (country) {
    query += ` ${country}`;
  }

  console.log(`[YouTubeClient] Searching: "${query}"`);

  // Step 1: Search for videos
  const searchResults = await searchYouTubeVideos(query, {
    maxResults: 25,
    order: 'relevance',
    videoDefinition: 'high',
  });

  if (searchResults.length === 0) {
    console.log('[YouTubeClient] No videos found');
    return [];
  }

  console.log(`[YouTubeClient] Found ${searchResults.length} videos from search`);

  // Step 2: Get video details (duration + stats)
  const videoIds = searchResults.map((item) => item.id.videoId);
  const videoDetails = await getVideoDetails(videoIds);

  console.log(`[YouTubeClient] Got details for ${videoDetails.size} videos`);

  // Step 3: Merge and transform
  const videos: VideoItem[] = [];

  for (const item of searchResults) {
    const details = videoDetails.get(item.id.videoId);

    // Parse duration
    const durationSeconds = details?.contentDetails?.duration
      ? parseDuration(details.contentDetails.duration)
      : 0;

    // Parse stats
    const viewCount = details?.statistics?.viewCount
      ? parseInt(details.statistics.viewCount, 10)
      : 0;
    const likeCount = details?.statistics?.likeCount
      ? parseInt(details.statistics.likeCount, 10)
      : 0;

    // Calculate score
    const score = calculateVideoScore(viewCount, likeCount, durationSeconds, item.snippet.title);

    // Classify video type
    const videoType = classifyVideoType(durationSeconds);

    videos.push({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description || '',
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url ||
        '',
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      durationSeconds,
      videoType,
      score,
      source: 'youtube',
      viewCount,
      likeCount,
    });
  }

  // Sort by score (highest first)
  videos.sort((a, b) => b.score - a.score);

  console.log(`[YouTubeClient] Processed ${videos.length} videos with scores`);
  console.log(
    `[YouTubeClient] Video types: ${videos.filter((v) => v.videoType === 'short').length} short, ` +
      `${videos.filter((v) => v.videoType === 'medium').length} medium, ` +
      `${videos.filter((v) => v.videoType === 'long').length} long`
  );

  return videos;
}

/**
 * Check if YouTube API is configured and working
 */
export function isYouTubeConfigured(): boolean {
  return !!YOUTUBE_API_KEY;
}

// ============================================
// Medium-Length Video Search with Captions
// ============================================

/**
 * Video with caption availability info
 */
export interface MediumVideoWithCaption {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  durationSeconds: number;
  duration: string; // Formatted duration
  viewCount: number;
  likeCount: number;
  hasCaption: boolean;
}

/**
 * Search for medium-length videos (5-20 min) with caption availability
 * Perfect for travel guides with detailed information
 *
 * @param query - Search query (location + topic)
 * @param limit - Max videos to return (default 2)
 * @returns Videos with caption info, sorted by relevance and caption availability
 */
export async function searchMediumVideosWithCaptions(
  query: string,
  limit: number = 2
): Promise<MediumVideoWithCaption[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTubeClient] API key not configured');
    return [];
  }

  console.log(`[YouTubeClient] Searching medium videos: "${query}"`);

  try {
    // Step 1: Search for medium-duration videos
    const searchResults = await searchYouTubeVideos(query, {
      maxResults: 15, // Get more to filter by caption
      videoDuration: 'medium', // 4-20 minutes
      order: 'relevance',
      videoDefinition: 'high',
    });

    if (searchResults.length === 0) {
      console.log('[YouTubeClient] No medium videos found');
      return [];
    }

    console.log(`[YouTubeClient] Found ${searchResults.length} medium videos`);

    // Step 2: Get video details with caption info
    const videoIds = searchResults.map((item) => item.id.videoId);
    const videoDetails = await getVideoDetailsWithCaptions(videoIds);

    // Step 3: Transform and filter
    const videos: MediumVideoWithCaption[] = [];

    for (const item of searchResults) {
      const details = videoDetails.get(item.id.videoId);
      if (!details) continue;

      const durationSeconds = parseDuration(details.contentDetails?.duration || '');

      // Filter: 5-20 minutes only
      if (durationSeconds < 300 || durationSeconds > 1200) {
        continue;
      }

      const viewCount = parseInt(details.statistics?.viewCount || '0', 10);
      const likeCount = parseInt(details.statistics?.likeCount || '0', 10);
      const hasCaption = details.contentDetails?.caption === 'true';

      videos.push({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description || '',
        thumbnailUrl:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url ||
          '',
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        durationSeconds,
        duration: formatDuration(durationSeconds),
        viewCount,
        likeCount,
        hasCaption,
      });
    }

    // Sort: Prioritize videos with captions, then by view count
    videos.sort((a, b) => {
      // Caption priority
      if (a.hasCaption && !b.hasCaption) return -1;
      if (!a.hasCaption && b.hasCaption) return 1;
      // Then by views
      return b.viewCount - a.viewCount;
    });

    console.log(
      `[YouTubeClient] Found ${videos.length} videos (5-20min), ` +
        `${videos.filter((v) => v.hasCaption).length} with captions`
    );

    return videos.slice(0, limit);
  } catch (error) {
    console.error('[YouTubeClient] Medium video search failed:', error);
    return [];
  }
}

/**
 * Get video details including caption availability
 */
async function getVideoDetailsWithCaptions(
  videoIds: string[]
): Promise<Map<string, YouTubeVideoResource>> {
  if (!YOUTUBE_API_KEY || videoIds.length === 0) {
    return new Map();
  }

  const url = new URL(YOUTUBE_VIDEOS_URL);
  url.searchParams.set('part', 'contentDetails,statistics');
  url.searchParams.set('id', videoIds.join(','));
  url.searchParams.set('key', YOUTUBE_API_KEY);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error('[YouTubeClient] Videos API error:', response.status);
      return new Map();
    }

    const data: YouTubeVideosResponse = await response.json();
    const results = new Map<string, YouTubeVideoResource>();

    for (const item of data.items || []) {
      results.set(item.id, item);
    }

    return results;
  } catch (error) {
    console.error('[YouTubeClient] Videos API failed:', error);
    return new Map();
  }
}
