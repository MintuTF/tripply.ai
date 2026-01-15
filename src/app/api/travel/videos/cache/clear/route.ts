import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/db/supabase';
import { videoSearchCache } from '@/lib/video/cache';

/**
 * GET /api/travel/videos/cache/clear
 * List all cache entries (for debugging)
 */
export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    const { data: cities, error } = await supabase
      .from('city_videos')
      .select('city_key, city_name, fetch_count, fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[CacheList] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      memory: videoSearchCache.getStats(),
      memoryKeys: videoSearchCache.keys(),
      database: cities || [],
    });
  } catch (error) {
    console.error('[CacheList] Error:', error);
    return NextResponse.json({ error: 'Failed to list cache' }, { status: 500 });
  }
}

/**
 * POST /api/travel/videos/cache/clear
 * Clear video cache entries from both in-memory and database
 *
 * Body params:
 * - cityName: City name to clear cache for (optional - clears all if not provided)
 * - collectionId: Specific collection to clear (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { cityName, collectionId } = body;

    // Clear in-memory cache first
    const memoryStatsBefore = videoSearchCache.getStats();
    videoSearchCache.clear();
    console.log(`[CacheClear] Cleared in-memory cache: ${memoryStatsBefore.size} entries`);

    const supabase = createServiceRoleClient();

    let deletedItems = 0;
    let deletedCities = 0;

    if (cityName) {
      // Clear cache for specific city
      const normalizedCity = cityName.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Build pattern for city_key
      let keyPattern = `${normalizedCity}%`;
      if (collectionId) {
        keyPattern = `${normalizedCity}%_${collectionId}`;
      }

      // Delete video items first (foreign key constraint)
      const { data: itemsData, error: itemsError } = await supabase
        .from('city_video_items')
        .delete()
        .ilike('city_key', keyPattern)
        .select('id');

      if (itemsError) {
        console.error('[CacheClear] Error deleting video items:', itemsError);
      } else {
        deletedItems = itemsData?.length || 0;
      }

      // Delete city cache entries
      const { data: citiesData, error: citiesError } = await supabase
        .from('city_videos')
        .delete()
        .ilike('city_key', keyPattern)
        .select('city_key');

      if (citiesError) {
        console.error('[CacheClear] Error deleting city cache:', citiesError);
      } else {
        deletedCities = citiesData?.length || 0;
      }

      console.log(`[CacheClear] Cleared cache for "${cityName}": ${deletedCities} cities, ${deletedItems} videos`);
    } else {
      // Clear ALL cache (be careful!)
      const { data: itemsData, error: itemsError } = await supabase
        .from('city_video_items')
        .delete()
        .neq('city_key', '') // Delete all
        .select('id');

      if (itemsError) {
        console.error('[CacheClear] Error deleting all video items:', itemsError);
      } else {
        deletedItems = itemsData?.length || 0;
      }

      const { data: citiesData, error: citiesError } = await supabase
        .from('city_videos')
        .delete()
        .neq('city_key', '') // Delete all
        .select('city_key');

      if (citiesError) {
        console.error('[CacheClear] Error deleting all city cache:', citiesError);
      } else {
        deletedCities = citiesData?.length || 0;
      }

      console.log(`[CacheClear] Cleared ALL cache: ${deletedCities} cities, ${deletedItems} videos`);
    }

    return NextResponse.json({
      success: true,
      cleared: {
        memory: memoryStatsBefore.size,
        dbCities: deletedCities,
        dbVideos: deletedItems,
      },
      message: cityName
        ? `Cleared cache for "${cityName}"`
        : 'Cleared all video cache',
    });
  } catch (error) {
    console.error('[CacheClear] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
