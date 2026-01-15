/**
 * Related Videos Service
 * Fetches and ranks related videos from YouTube API using AI
 *
 * Usage:
 * ```typescript
 * import { relatedVideosService } from '@/lib/video';
 *
 * const videos = await relatedVideosService.getRelatedVideos({
 *   videoId: 'abc123',
 *   videoTitle: 'Tokyo Museums Guide',
 *   city: 'Tokyo',
 *   limit: 10,
 * });
 * ```
 */

import type { YouTubeVideo, YouTubeSearchResponse } from '@/types/video';
import type { RelatedVideosOptions } from './types';
import { filterByAIRelevance } from './filter';
import { GenericCache } from './cache';

// Cache for related videos (1 hour TTL)
const relatedVideosCache = new GenericCache<YouTubeVideo[]>(60 * 60 * 1000);

/**
 * Service for fetching and ranking related videos
 */
export class RelatedVideosService {
  private youtubeApiKey: string | undefined;
  private youtubeApiUrl = 'https://www.googleapis.com/youtube/v3/search';

  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
  }

  /**
   * Get related videos for a given video, sorted by AI relevance
   *
   * @param options - Options for fetching related videos
   * @returns Promise of AI-sorted related videos
   */
  async getRelatedVideos(options: RelatedVideosOptions): Promise<YouTubeVideo[]> {
    const { videoId, videoTitle, city, limit = 10 } = options;

    // Check cache first
    const cacheKey = `related:${videoId}:${city || 'no-city'}`;
    const cached = relatedVideosCache.get(cacheKey);
    if (cached) {
      console.log(`[RelatedVideos] Cache HIT for ${videoId}`);
      return cached.slice(0, limit);
    }

    if (!this.youtubeApiKey) {
      console.warn('[RelatedVideos] YouTube API key not configured');
      return [];
    }

    try {
      // Fetch related videos from YouTube API
      const url = new URL(this.youtubeApiUrl);
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('relatedToVideoId', videoId);
      url.searchParams.set('type', 'video');
      url.searchParams.set('maxResults', String(Math.min(limit * 2, 25))); // Fetch more for filtering
      url.searchParams.set('videoEmbeddable', 'true');
      url.searchParams.set('safeSearch', 'strict');
      url.searchParams.set('key', this.youtubeApiKey);

      console.log(`[RelatedVideos] Fetching related videos for: ${videoId}`);
      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[RelatedVideos] YouTube API error:', response.status, errorData);
        return [];
      }

      const data: YouTubeSearchResponse = await response.json();
      let videos = this.mapYouTubeResponse(data);

      console.log(`[RelatedVideos] YouTube returned ${videos.length} videos`);

      // Use AI to sort by relevance to current video
      if (videos.length > limit) {
        console.log(`[RelatedVideos] Sorting by AI relevance to: "${videoTitle}"`);
        videos = await filterByAIRelevance(videos, videoTitle, city || '', limit);
      }

      const result = videos.slice(0, limit);

      // Cache the result
      relatedVideosCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('[RelatedVideos] Error fetching related videos:', error);
      return [];
    }
  }

  /**
   * Search for videos similar to the current video
   * Alternative when relatedToVideoId doesn't return enough results
   *
   * @param videoTitle - Title of the current video
   * @param city - City context
   * @param limit - Max videos to return
   */
  async searchSimilarVideos(
    videoTitle: string,
    city: string,
    limit: number = 10
  ): Promise<YouTubeVideo[]> {
    if (!this.youtubeApiKey) {
      console.warn('[RelatedVideos] YouTube API key not configured');
      return [];
    }

    try {
      // Extract key terms from title for search
      const searchTerms = this.extractSearchTerms(videoTitle, city);
      const searchQuery = `${searchTerms} travel`;

      const url = new URL(this.youtubeApiUrl);
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('type', 'video');
      url.searchParams.set('q', searchQuery);
      url.searchParams.set('maxResults', String(Math.min(limit * 2, 25)));
      url.searchParams.set('videoEmbeddable', 'true');
      url.searchParams.set('safeSearch', 'strict');
      url.searchParams.set('videoDuration', 'medium');
      url.searchParams.set('videoDefinition', 'high');
      url.searchParams.set('order', 'relevance');
      url.searchParams.set('key', this.youtubeApiKey);

      console.log(`[RelatedVideos] Searching similar videos: "${searchQuery}"`);
      const response = await fetch(url.toString());

      if (!response.ok) {
        return [];
      }

      const data: YouTubeSearchResponse = await response.json();
      let videos = this.mapYouTubeResponse(data);

      // Use AI to sort by relevance
      if (videos.length > limit) {
        videos = await filterByAIRelevance(videos, videoTitle, city, limit);
      }

      return videos.slice(0, limit);
    } catch (error) {
      console.error('[RelatedVideos] Error searching similar videos:', error);
      return [];
    }
  }

  /**
   * Map YouTube API response to our video format
   */
  private mapYouTubeResponse(data: YouTubeSearchResponse): YouTubeVideo[] {
    return (
      data.items?.map((item) => ({
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
      })) || []
    );
  }

  /**
   * Extract search terms from video title
   */
  private extractSearchTerms(title: string, city: string): string {
    // Remove common YouTube title patterns
    let cleaned = title
      .replace(/[|•\-–—]/g, ' ')
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/#\w+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If city is in title, use it; otherwise add it
    if (!cleaned.toLowerCase().includes(city.toLowerCase())) {
      cleaned = `${city} ${cleaned}`;
    }

    // Limit to reasonable length
    const words = cleaned.split(' ').slice(0, 8);
    return words.join(' ');
  }

  /**
   * Clear cache for a specific video
   */
  clearCache(videoId: string): void {
    // Note: GenericCache doesn't support delete, so we'd need to enhance it
    // For now, cache will expire naturally
    console.log(`[RelatedVideos] Cache clear requested for ${videoId}`);
  }
}

// Singleton export for easy usage across the app
export const relatedVideosService = new RelatedVideosService();
