import type { YouTubeVideo, VideoAnalysis, VideoCollection } from '@/types/video';
import type { TravelPlace } from '@/lib/travel/types';
import {
  videoSearchCache,
  videoAnalysisCache,
  placeDetailsCache,
  getVideoSearchKey,
  getAnalysisKey,
  getPlaceKey,
} from './cache';
import { filterByCity } from './filter';
import { buildSearchQuery } from './youtube';

/**
 * VideoService - Central service for all video-related operations
 *
 * Provides a unified interface for:
 * - Searching YouTube videos
 * - Analyzing video content (AI-powered)
 * - Looking up place details from videos
 *
 * All operations use centralized caching.
 */

export interface VideoSearchParams {
  query: string;
  city: string;
  country?: string;
  type?: 'city' | 'place' | 'collection';
  limit?: number;
}

export interface VideoSearchResult {
  videos: YouTubeVideo[];
  cached: boolean;
  error?: string;
}

export interface AnalyzeVideoParams {
  videoId: string;
  title: string;
  description?: string;
  cityName: string;
}

class VideoService {
  private baseUrl: string;

  constructor() {
    // Determine base URL for API calls
    this.baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  }

  /**
   * Search for videos about a destination
   * Uses AI to optimize search queries and filters results by city
   */
  async searchVideos(params: VideoSearchParams): Promise<VideoSearchResult> {
    const { query, city, country, type = 'collection', limit = 4 } = params;

    // Generate cache key
    const cacheId = `${city}-${query}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-');
    const cacheKey = getVideoSearchKey(type, cacheId);

    // Build search query with city and country
    const searchQuery = buildSearchQuery(city, country, query, true);

    console.log(`[VideoService] Searching: "${searchQuery}"`);

    try {
      const url = `${this.baseUrl}/api/travel/videos?type=${type}&name=${encodeURIComponent(searchQuery)}&id=${encodeURIComponent(cacheId)}&cityName=${encodeURIComponent(city)}`;

      const response = await fetch(url);

      if (!response.ok) {
        return {
          videos: [],
          cached: false,
          error: `API error: ${response.status}`,
        };
      }

      const data = await response.json();

      if (data.error && !data.videos?.length) {
        return {
          videos: [],
          cached: data.cached || false,
          error: data.error,
        };
      }

      // Filter and limit videos
      const videos = data.videos || [];
      const filtered = filterByCity(videos, city);
      const result = filtered.slice(0, limit);

      console.log(
        `[VideoService] Found ${videos.length} videos, ${filtered.length} relevant, returning ${result.length}`
      );

      return {
        videos: result,
        cached: data.cached || false,
      };
    } catch (error) {
      console.error('[VideoService] Search error:', error);
      return {
        videos: [],
        cached: false,
        error: error instanceof Error ? error.message : 'Failed to search videos',
      };
    }
  }

  /**
   * Analyze video content to extract summary and places
   * Uses AI to process video title/description or transcript
   */
  async analyzeVideo(params: AnalyzeVideoParams): Promise<VideoAnalysis | null> {
    const { videoId, title, description, cityName } = params;

    // Check cache first
    const cacheKey = getAnalysisKey(videoId);
    const cached = videoAnalysisCache.get(cacheKey);

    if (cached) {
      console.log(`[VideoService] Analysis cache hit for ${videoId}`);
      return cached;
    }

    console.log(`[VideoService] Analyzing video: ${videoId}`);

    try {
      const response = await fetch(`${this.baseUrl}/api/travel/videos/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          title,
          description,
          cityName,
        }),
      });

      const data = await response.json();

      if (data.error && !data.summary) {
        console.error('[VideoService] Analysis error:', data.error);
        return null;
      }

      const analysis: VideoAnalysis = {
        videoId: data.videoId || videoId,
        summary: data.summary,
        places: data.places || [],
        analyzedAt: data.analyzedAt || Date.now(),
      };

      // Cache the result
      videoAnalysisCache.set(cacheKey, analysis);

      return analysis;
    } catch (error) {
      console.error('[VideoService] Analysis error:', error);
      return null;
    }
  }

  /**
   * Get place details from a place mentioned in a video
   * Uses Google Places API with caching
   */
  async getPlaceDetails(placeName: string, cityName: string): Promise<TravelPlace | null> {
    // Check cache first
    const cacheKey = getPlaceKey(placeName, cityName);
    const cached = placeDetailsCache.get(cacheKey);

    if (cached) {
      console.log(`[VideoService] Place cache hit for ${placeName}`);
      return cached;
    }

    console.log(`[VideoService] Looking up place: ${placeName} in ${cityName}`);

    try {
      const response = await fetch(
        `${this.baseUrl}/api/travel/videos/place-details?name=${encodeURIComponent(placeName)}&city=${encodeURIComponent(cityName)}`
      );

      const data = await response.json();

      if (!data.place) {
        console.log(`[VideoService] Place not found: ${placeName}`);
        return null;
      }

      // Cache the result
      placeDetailsCache.set(cacheKey, data.place);

      return data.place;
    } catch (error) {
      console.error('[VideoService] Place lookup error:', error);
      return null;
    }
  }

  /**
   * Get cache statistics for all video caches
   */
  getCacheStats() {
    return {
      videoSearch: videoSearchCache.getStats(),
      videoAnalysis: videoAnalysisCache.getStats(),
      placeDetails: placeDetailsCache.getStats(),
    };
  }

  /**
   * Clear all video caches
   */
  clearAllCaches() {
    videoSearchCache.clear();
    videoAnalysisCache.clear();
    placeDetailsCache.clear();
    console.log('[VideoService] All caches cleared');
  }
}

// Singleton instance
export const videoService = new VideoService();

// Export class for testing
export { VideoService };
