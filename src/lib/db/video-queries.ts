import { createServiceRoleClient } from './supabase';

// ============================================
// Types
// ============================================

export interface CityVideoCache {
  cityKey: string;
  cityName: string;
  country: string | null;
  coordinates: { lat: number; lng: number } | null;
  fetchedAt: Date;
  expiresAt: Date;
  fetchCount: number;
}

export interface VideoItem {
  id?: string;
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  durationSeconds: number;
  videoType: 'short' | 'medium' | 'long';
  score: number;
  source: 'youtube' | 'pexels';
  viewCount?: number;
  likeCount?: number;
}

export interface CityData {
  cityName: string;
  country?: string;
  lat: number;
  lng: number;
  collectionId?: string; // Optional collection ID for collection-specific caching
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique city key from city name and coordinates
 * Format: "tokyo_35.6762_139.6503" or "tokyo_35.6762_139.6503_hidden-gems" (with collectionId)
 *
 * @param collectionId - Optional collection ID to create unique keys per collection type
 *                       (e.g., "hidden-gems", "best-food", "must-see", "cultural")
 */
export function generateCityKey(
  cityName: string,
  lat: number,
  lng: number,
  collectionId?: string
): string {
  const normalizedName = cityName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const roundedLat = lat.toFixed(4);
  const roundedLng = lng.toFixed(4);
  const suffix = collectionId ? `_${collectionId}` : '';
  return `${normalizedName}_${roundedLat}_${roundedLng}${suffix}`;
}

/**
 * Classify video type based on duration
 */
export function classifyVideoType(durationSeconds: number): 'short' | 'medium' | 'long' {
  if (durationSeconds <= 60) return 'short';
  if (durationSeconds <= 1200) return 'medium'; // 20 minutes
  return 'long';
}

/**
 * Calculate dynamic TTL based on fetch count (popularity)
 */
function calculateTTLDays(fetchCount: number): number {
  if (fetchCount > 200) return 7;   // Very popular: 7 days
  if (fetchCount > 50) return 14;   // Popular: 14 days
  return 30;                         // Default: 30 days
}

// ============================================
// Query Functions
// ============================================

/**
 * Get city video cache metadata
 */
export async function getCityVideos(cityKey: string): Promise<CityVideoCache | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('city_videos')
    .select('*')
    .eq('city_key', cityKey)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') { // Not a "not found" error
      console.error('[VideoCache] Error fetching city videos:', error);
    }
    return null;
  }

  return {
    cityKey: data.city_key,
    cityName: data.city_name,
    country: data.country,
    coordinates: data.coordinates,
    fetchedAt: new Date(data.fetched_at),
    expiresAt: new Date(data.expires_at),
    fetchCount: data.fetch_count,
  };
}

/**
 * Get individual video items for a city
 */
export async function getCityVideoItems(
  cityKey: string,
  videoType?: 'short' | 'medium' | 'long'
): Promise<VideoItem[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('city_video_items')
    .select('*')
    .eq('city_key', cityKey)
    .order('score', { ascending: false });

  if (videoType) {
    query = query.eq('video_type', videoType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[VideoCache] Error fetching video items:', error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    videoId: item.video_id,
    title: item.title || '',
    description: item.description || '',
    thumbnailUrl: item.thumbnail_url || '',
    channelTitle: item.channel_title || '',
    publishedAt: item.published_at || '',
    durationSeconds: item.duration_seconds || 0,
    videoType: item.video_type as 'short' | 'medium' | 'long',
    score: item.score || 0,
    source: item.source as 'youtube' | 'pexels',
    viewCount: item.view_count,
    likeCount: item.like_count,
  }));
}

/**
 * Save city and its videos to the database
 * Uses upsert for city metadata and inserts videos (replacing old ones)
 */
export async function saveCityVideos(
  city: CityData,
  videos: VideoItem[]
): Promise<void> {
  console.log('[VideoCache] === SAVE OPERATION STARTING ===');
  console.log('[VideoCache] City data:', { cityName: city.cityName, country: city.country, lat: city.lat, lng: city.lng, collectionId: city.collectionId });
  console.log('[VideoCache] Videos to save:', videos.length);

  const supabase = createServiceRoleClient();
  console.log('[VideoCache] Service role client created');

  const cityKey = generateCityKey(city.cityName, city.lat, city.lng, city.collectionId);
  const ttlDays = 30; // Default TTL for new entries
  console.log('[VideoCache] Generated city key:', cityKey);

  // Upsert city metadata
  const upsertData = {
    city_key: cityKey,
    city_name: city.cityName,
    country: city.country || null,
    coordinates: { lat: city.lat, lng: city.lng },
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString(),
    fetch_count: 1,
  };
  console.log('[VideoCache] Upserting city_videos with:', upsertData);

  const { data: upsertResult, error: cityError } = await supabase
    .from('city_videos')
    .upsert(upsertData, {
      onConflict: 'city_key',
    })
    .select();

  if (cityError) {
    console.error('[VideoCache] CITY UPSERT FAILED:', cityError);
    throw cityError;
  }
  console.log('[VideoCache] City upsert SUCCESS, result:', upsertResult);

  // Delete existing videos for this city (to replace with fresh data)
  console.log('[VideoCache] Deleting existing videos for city_key:', cityKey);
  const { error: deleteError } = await supabase
    .from('city_video_items')
    .delete()
    .eq('city_key', cityKey);

  if (deleteError) {
    console.error('[VideoCache] Error deleting old videos:', deleteError);
    // Continue anyway - we still want to insert new videos
  } else {
    console.log('[VideoCache] Old videos deleted (or none existed)');
  }

  // Insert new videos
  if (videos.length > 0) {
    const videoRows = videos.map((video) => ({
      city_key: cityKey,
      video_id: video.videoId,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnailUrl,
      channel_title: video.channelTitle,
      published_at: video.publishedAt || null,
      duration_seconds: video.durationSeconds,
      video_type: video.videoType,
      score: video.score,
      source: video.source || 'youtube',
      view_count: video.viewCount || null,
      like_count: video.likeCount || null,
    }));

    console.log('[VideoCache] Inserting video rows, first video:', videoRows[0]);
    const { data: insertResult, error: insertError } = await supabase
      .from('city_video_items')
      .insert(videoRows)
      .select();

    if (insertError) {
      console.error('[VideoCache] VIDEO INSERT FAILED:', insertError);
      throw insertError;
    }
    console.log('[VideoCache] Videos inserted SUCCESS, count:', insertResult?.length);
  }

  console.log(`[VideoCache] === SAVE COMPLETE: ${videos.length} videos for ${city.cityName} (${cityKey}) ===`);
}

/**
 * Increment fetch count and optionally update TTL based on popularity
 */
export async function incrementFetchCount(cityKey: string): Promise<void> {
  const supabase = createServiceRoleClient();

  // First get current fetch count
  const { data: current } = await supabase
    .from('city_videos')
    .select('fetch_count')
    .eq('city_key', cityKey)
    .single();

  if (!current) return;

  const newFetchCount = (current.fetch_count || 0) + 1;
  const ttlDays = calculateTTLDays(newFetchCount);

  // Update fetch count and potentially adjust TTL
  const { error } = await supabase
    .from('city_videos')
    .update({
      fetch_count: newFetchCount,
      expires_at: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('city_key', cityKey);

  if (error) {
    console.error('[VideoCache] Error incrementing fetch count:', error);
  }
}

/**
 * Check if cache for a city has expired
 */
export async function isCacheExpired(cityKey: string): Promise<boolean> {
  const cache = await getCityVideos(cityKey);

  if (!cache) return true; // No cache = expired

  return new Date() > cache.expiresAt;
}

/**
 * Check if cache is within grace period (1 hour after expiry)
 * During grace period, return stale data but trigger background refresh
 */
export async function isWithinGracePeriod(cityKey: string): Promise<boolean> {
  const cache = await getCityVideos(cityKey);

  if (!cache) return false;

  const now = new Date();
  const graceEnd = new Date(cache.expiresAt.getTime() + 60 * 60 * 1000); // 1 hour grace

  return now > cache.expiresAt && now < graceEnd;
}

/**
 * Get all expired city keys (for background refresh job)
 */
export async function getExpiredCities(): Promise<string[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('city_videos')
    .select('city_key')
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('[VideoCache] Error fetching expired cities:', error);
    return [];
  }

  return (data || []).map((row) => row.city_key);
}

/**
 * Get cached videos for a city by name (searches by city_name, not city_key)
 * Useful when we don't have coordinates
 */
export async function getCityVideosByName(
  cityName: string
): Promise<{ cache: CityVideoCache; videos: VideoItem[] } | null> {
  const supabase = createServiceRoleClient();

  const normalizedName = cityName.toLowerCase().trim();

  const { data, error } = await supabase
    .from('city_videos')
    .select('*')
    .ilike('city_name', normalizedName)
    .order('fetch_count', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  const videos = await getCityVideoItems(data.city_key);

  return {
    cache: {
      cityKey: data.city_key,
      cityName: data.city_name,
      country: data.country,
      coordinates: data.coordinates,
      fetchedAt: new Date(data.fetched_at),
      expiresAt: new Date(data.expires_at),
      fetchCount: data.fetch_count,
    },
    videos,
  };
}
