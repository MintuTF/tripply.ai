import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/db/supabase';

/**
 * Shared (database) cache for what the AI read out of a video, so every server instance and every visitor
 * reuses one AI call per video. Optional: when Supabase is not configured, or the table is missing,
 * every call quietly does nothing and the in-memory cache in videoPlaces.ts is used on its own.
 */
const TTL_WITH_CAPTIONS_MS = 30 * 24 * 60 * 60 * 1000;
// Without captions the result is thin and may just be a temporary YouTube/library hiccup: retry soon
const TTL_NO_CAPTIONS_MS = 24 * 60 * 60 * 1000;

export async function readInsightsCache<T>(videoId: string): Promise<T | null> {
  if (!isServiceRoleConfigured()) return null;
  try {
    const { data } = await createServiceRoleClient()
      .from('video_insights')
      .select('insights, expires_at')
      .eq('video_id', videoId)
      .maybeSingle();
    if (!data || new Date(data.expires_at) < new Date()) return null;
    return data.insights as T;
  } catch {
    return null;
  }
}

export async function writeInsightsCache(videoId: string, insights: unknown, hasTranscript: boolean, model: string): Promise<void> {
  if (!isServiceRoleConfigured()) return;
  try {
    await createServiceRoleClient()
      .from('video_insights')
      .upsert({
        video_id: videoId,
        insights,
        has_transcript: hasTranscript,
        model,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (hasTranscript ? TTL_WITH_CAPTIONS_MS : TTL_NO_CAPTIONS_MS)).toISOString(),
      });
  } catch (error) {
    console.error('[InsightsCache] write failed:', error instanceof Error ? error.message : error);
  }
}
