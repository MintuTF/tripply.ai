/**
 * Video module - Centralized video functionality
 *
 * This module provides:
 * - YouTube utilities (embed URLs, iframe commands)
 * - Video filtering (by city, keywords, AI relevance)
 * - Caching (generic + pre-configured instances)
 * - VideoService (central service for all video operations)
 * - RelatedVideosService (fetch and rank related videos)
 * - Shared types for video player page
 *
 * Usage:
 * ```typescript
 * import {
 *   // YouTube utilities
 *   buildEmbedUrl,
 *   sendYouTubeCommand,
 *   buildSearchQuery,
 *
 *   // Filtering
 *   filterByCity,
 *   filterAndLimit,
 *   filterByAIRelevance,
 *
 *   // Caching
 *   videoSearchCache,
 *   videoAnalysisCache,
 *   placeDetailsCache,
 *
 *   // Services
 *   videoService,
 *   relatedVideosService,
 *
 *   // Types
 *   type VideoDetails,
 *   type RelatedVideosOptions,
 * } from '@/lib/video';
 * ```
 */

// YouTube utilities
export {
  buildEmbedUrl,
  sendYouTubeCommand,
  replayVideo,
  buildSearchQuery,
  extractVideoId,
  buildThumbnailUrl,
  type EmbedOptions,
} from './youtube';

// Video filtering
export {
  filterByCity,
  filterByKeywords,
  filterByChannel,
  filterAndLimit,
  filterByAIRelevance,
} from './filter';

// Caching
export {
  GenericCache,
  videoSearchCache,
  videoAnalysisCache,
  placeDetailsCache,
  getVideoSearchKey,
  getAnalysisKey,
  getPlaceKey,
  // Legacy export
  videoCache,
} from './cache';

// Video service
export {
  VideoService,
  videoService,
  type VideoSearchParams,
  type VideoSearchResult,
  type AnalyzeVideoParams,
} from './service';

// Related videos service
export {
  RelatedVideosService,
  relatedVideosService,
} from './related';

// Shared types for video player
export type {
  VideoDetails,
  VideoPageAnalysis,
  RelatedVideosOptions,
  RelatedVideosResponse,
  VideoDetailsResponse,
  VideoAnalysisResponse,
  YouTubeVideoResource,
  YouTubeVideosResponse,
} from './types';

// YouTube client for database caching
export {
  parseDuration,
  formatDuration,
  calculateVideoScore,
  searchYouTubeVideos,
  getVideoDetails,
  fetchVideosForCity,
  isYouTubeConfigured,
} from './youtube-client';
