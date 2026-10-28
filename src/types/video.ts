/**
 * Video types for YouTube Data API integration
 */

// Video data from YouTube API
export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt?: string;
  // Enhanced metadata (optional, from Videos API)
  viewCount?: number | string;
  duration?: string; // Formatted duration e.g., "5:30"
  likeCount?: number;
}

// Video result for chat messages (alias for consistency)
export type ChatVideoResult = YouTubeVideo;

// Extracted place from video
export interface VideoPlace {
  name: string;
  type: 'restaurant' | 'attraction' | 'hotel' | 'landmark' | 'other';
}

// Extended place with AI-extracted note
export interface VideoPlaceWithNote extends VideoPlace {
  note: string; // AI-extracted note about this place from the video
}

// Video analysis result
export interface VideoAnalysis {
  videoId: string;
  summary: string;
  highlights: string[]; // Key highlights/takeaways from the video
  places: VideoPlaceWithNote[];
  analyzedAt: number;
}

// Deep analysis from video transcript
export interface VideoDeepAnalysis {
  videoId: string;
  summary: string;
  thingsToDo: string[];    // Specific recommendations for tourists
  thingsToAvoid: string[]; // Warnings, mistakes to avoid
  tips: string[];          // Practical travel tips
  places: VideoPlaceWithNote[];
  analyzedAt: number;
}

// Smart video search result with natural AI response
export interface SmartVideoResult {
  aiResponse: string;      // Natural conversational AI response using video transcript context
  videos: Array<{
    video: YouTubeVideo;
  }>;
  searchTitles: string[];  // The AI-generated search titles used
}

// Video collection for caching
export interface VideoCollection {
  entityId: string;
  entityType: 'city' | 'place' | 'collection';
  entityName: string;
  videos: YouTubeVideo[];
  fetchedAt: number;
  expiresAt: number;
}

// API response structure
export interface VideoSearchResponse {
  videos: YouTubeVideo[];
  cached: boolean;
  entityName?: string; // Optional - may not be available in error responses
  error?: string;
}

// YouTube API raw response types
export interface YouTubeSearchResult {
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchResult[];
}

// A place named in a video, resolved to a real map place when possible
export interface VideoPlaceMatch {
  /** Name as said in the video */
  name: string;
  type: VideoPlace['type'];
  cardType: 'hotel' | 'spot' | 'food' | 'activity';
  /** Moment (seconds) where it is first mentioned */
  startSec: number;
  /** Why the video mentions it */
  note: string;
  /** Real place from Google; absent when nothing was found */
  place?: import('@/lib/travel/types').TravelPlace;
  /** 'check' = Google's top result under a different name (often the English name): the traveler confirms it */
  matchLevel?: 'exact' | 'check';
}

// A point the video makes, with the moment it is said
export interface VideoNote {
  text: string;
  startSec?: number;
}

export interface VideoPlacesResult {
  videoId: string;
  /** What the video actually covers, 2-3 sentences */
  summary: string;
  /** Specific facts and recommendations the video states (prices, times, routes) */
  takeaways: VideoNote[];
  /** Practical advice the video gives: booking, money, transport, timing, what to bring */
  tips: VideoNote[];
  /** Warnings and mistakes the video tells viewers to avoid */
  avoid: VideoNote[];
  places: VideoPlaceMatch[];
  /** True when the places came from captions; false = title/description only */
  hasTranscript: boolean;
  /** True when a very long video was only read up to a point */
  truncated: boolean;
}
