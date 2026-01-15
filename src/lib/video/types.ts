/**
 * Shared video types for the video player module
 * Used by video page, related videos, and video analysis
 */

import type { YouTubeVideo, VideoPlace } from '@/types/video';

/**
 * Extended video details with statistics from YouTube API
 */
export interface VideoDetails extends YouTubeVideo {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string; // ISO 8601 duration (e.g., "PT5M30S")
  durationFormatted: string; // Human readable (e.g., "5:30")
  tags: string[];
}

/**
 * AI-generated video analysis
 */
export interface VideoPageAnalysis {
  summary: string;
  places: VideoPlace[];
  highlights: string[];
  analyzedAt: number;
}

/**
 * Options for fetching related videos
 */
export interface RelatedVideosOptions {
  videoId: string;
  videoTitle: string;
  city?: string;
  limit?: number;
}

/**
 * Response from related videos API
 */
export interface RelatedVideosResponse {
  videos: YouTubeVideo[];
  cached: boolean;
  error?: string;
}

/**
 * Response from video details API
 */
export interface VideoDetailsResponse {
  video: VideoDetails | null;
  error?: string;
}

/**
 * Response from video analysis API
 */
export interface VideoAnalysisResponse {
  analysis: VideoPageAnalysis | null;
  error?: string;
}

/**
 * YouTube video statistics from API
 */
export interface YouTubeVideoStatistics {
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

/**
 * YouTube content details from API
 */
export interface YouTubeContentDetails {
  duration: string;
  dimension: string;
  definition: string;
}

/**
 * YouTube video resource response
 */
export interface YouTubeVideoResource {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
  };
  contentDetails?: YouTubeContentDetails;
  statistics?: YouTubeVideoStatistics;
}

/**
 * YouTube videos list response
 */
export interface YouTubeVideosResponse {
  kind: string;
  etag: string;
  items: YouTubeVideoResource[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}
