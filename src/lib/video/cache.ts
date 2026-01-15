import type { VideoCollection, VideoAnalysis } from '@/types/video';
import type { TravelPlace } from '@/lib/travel/types';

/**
 * Generic cache class with TTL and LRU eviction
 * Can be used for any data type with configurable options
 */

interface CacheOptions {
  maxEntries: number;
  ttlDays: number;
  name?: string; // For logging
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class GenericCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttlMs: number;
  private maxEntries: number;
  private name: string;

  constructor(options: CacheOptions) {
    this.ttlMs = options.ttlDays * 24 * 60 * 60 * 1000;
    this.maxEntries = options.maxEntries;
    this.name = options.name || 'Cache';
  }

  /**
   * Get cached item by key
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store item in cache
   */
  set(key: string, data: T): void {
    // Cleanup if cache is too large
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest(Math.ceil(this.maxEntries * 0.1)); // Evict 10%
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached items
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Evict oldest entries from cache (LRU)
   */
  private evictOldest(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, count);

    entries.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): { name: string; size: number; maxSize: number; ttlDays: number } {
    return {
      name: this.name,
      size: this.cache.size,
      maxSize: this.maxEntries,
      ttlDays: this.ttlMs / (24 * 60 * 60 * 1000),
    };
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// ============================================
// Pre-configured cache instances
// ============================================

/**
 * Cache for video search results (YouTube API responses)
 * Used by: /api/travel/videos
 */
export const videoSearchCache = new GenericCache<VideoCollection>({
  maxEntries: 500,
  ttlDays: 10,
  name: 'VideoSearch',
});

/**
 * Cache for video analysis (AI-generated summaries and places)
 * Used by: /api/travel/videos/analyze
 */
export const videoAnalysisCache = new GenericCache<VideoAnalysis>({
  maxEntries: 200,
  ttlDays: 30,
  name: 'VideoAnalysis',
});

/**
 * Cache for place details (Google Places lookups)
 * Used by: /api/travel/videos/place-details
 */
export const placeDetailsCache = new GenericCache<TravelPlace>({
  maxEntries: 500,
  ttlDays: 10,
  name: 'PlaceDetails',
});

// ============================================
// Helper functions for cache key generation
// ============================================

/**
 * Generate cache key for video search
 */
export function getVideoSearchKey(
  entityType: 'city' | 'place' | 'collection',
  entityId: string
): string {
  return `video:${entityType}:${entityId}`;
}

/**
 * Generate cache key for video analysis
 */
export function getAnalysisKey(videoId: string): string {
  return `analysis:${videoId}`;
}

/**
 * Generate cache key for place details
 */
export function getPlaceKey(placeName: string, cityName: string): string {
  return `place:${placeName.toLowerCase()}:${cityName.toLowerCase()}`;
}

// ============================================
// Legacy export for backward compatibility
// ============================================

/**
 * @deprecated Use videoSearchCache instead
 */
class LegacyVideoCache {
  get(entityType: 'city' | 'place' | 'collection', entityId: string): VideoCollection | null {
    const key = getVideoSearchKey(entityType, entityId);
    return videoSearchCache.get(key);
  }

  set(entityType: 'city' | 'place' | 'collection', entityId: string, data: VideoCollection): void {
    const key = getVideoSearchKey(entityType, entityId);
    videoSearchCache.set(key, data);
  }

  has(entityType: 'city' | 'place' | 'collection', entityId: string): boolean {
    const key = getVideoSearchKey(entityType, entityId);
    return videoSearchCache.has(key);
  }

  getStats() {
    return videoSearchCache.getStats();
  }

  clear(): void {
    videoSearchCache.clear();
  }
}

export const videoCache = new LegacyVideoCache();
