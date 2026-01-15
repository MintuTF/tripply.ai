-- City Videos Cache Migration
-- Persistent database cache for YouTube video search results
-- Reduces API calls and provides instant results for repeat city searches

-- ============================================
-- Table 1: city_videos (Parent - Cache Metadata)
-- ============================================
CREATE TABLE IF NOT EXISTS city_videos (
  city_key TEXT PRIMARY KEY,                    -- "tokyo_35.6762_139.6503"
  city_name TEXT NOT NULL,                      -- "Tokyo"
  country TEXT,
  coordinates JSONB,                            -- { lat, lng }

  fetched_at TIMESTAMPTZ DEFAULT NOW(),         -- When videos were fetched
  expires_at TIMESTAMPTZ NOT NULL,              -- When cache expires (TTL)

  fetch_count INTEGER DEFAULT 1,                -- Popularity tracking

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for city_videos
CREATE INDEX IF NOT EXISTS idx_city_videos_city_name ON city_videos(city_name);
CREATE INDEX IF NOT EXISTS idx_city_videos_expires_at ON city_videos(expires_at);
CREATE INDEX IF NOT EXISTS idx_city_videos_fetch_count ON city_videos(fetch_count DESC);

-- ============================================
-- Table 2: city_video_items (Child - Individual Videos)
-- ============================================
CREATE TABLE IF NOT EXISTS city_video_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_key TEXT NOT NULL REFERENCES city_videos(city_key) ON DELETE CASCADE,

  video_id TEXT NOT NULL,                       -- YouTube videoId
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  channel_title TEXT,
  published_at TIMESTAMPTZ,

  duration_seconds INTEGER NOT NULL DEFAULT 0,  -- Video duration in seconds
  video_type TEXT NOT NULL DEFAULT 'medium',    -- 'short' | 'medium' | 'long'
  score FLOAT DEFAULT 0,                        -- Ranking score
  source TEXT DEFAULT 'youtube',                -- 'youtube' | 'pexels'

  view_count BIGINT,                            -- For re-scoring
  like_count BIGINT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique video per city
  CONSTRAINT unique_video_per_city UNIQUE (city_key, video_id),
  -- Validate video_type
  CONSTRAINT valid_video_type CHECK (video_type IN ('short', 'medium', 'long'))
);

-- Indexes for city_video_items
CREATE INDEX IF NOT EXISTS idx_city_video_items_city_key ON city_video_items(city_key);
CREATE INDEX IF NOT EXISTS idx_city_video_items_video_type ON city_video_items(video_type);
CREATE INDEX IF NOT EXISTS idx_city_video_items_score ON city_video_items(score DESC);
CREATE INDEX IF NOT EXISTS idx_city_video_items_city_type ON city_video_items(city_key, video_type);

-- ============================================
-- Triggers
-- ============================================

-- Apply updated_at trigger to city_videos
DROP TRIGGER IF EXISTS update_city_videos_updated_at ON city_videos;
CREATE TRIGGER update_city_videos_updated_at
  BEFORE UPDATE ON city_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- ============================================
-- Note: City videos are public cache data, but we still enable RLS
-- for security. All users can read, only service role can write.

ALTER TABLE city_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_video_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached videos (public cache)
CREATE POLICY city_videos_select_all ON city_videos
  FOR SELECT USING (true);

CREATE POLICY city_video_items_select_all ON city_video_items
  FOR SELECT USING (true);

-- Only service role can insert/update/delete (via API routes)
-- Authenticated users cannot directly modify cache
CREATE POLICY city_videos_service_insert ON city_videos
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY city_videos_service_update ON city_videos
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY city_videos_service_delete ON city_videos
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY city_video_items_service_insert ON city_video_items
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY city_video_items_service_update ON city_video_items
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY city_video_items_service_delete ON city_video_items
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================
-- Grant Permissions
-- ============================================
GRANT SELECT ON city_videos TO anon, authenticated;
GRANT SELECT ON city_video_items TO anon, authenticated;
GRANT ALL ON city_videos TO service_role;
GRANT ALL ON city_video_items TO service_role;

-- ============================================
-- Helper function to calculate dynamic TTL
-- ============================================
CREATE OR REPLACE FUNCTION calculate_video_ttl(p_fetch_count INTEGER)
RETURNS INTERVAL AS $$
BEGIN
  -- Very popular cities (>200 fetches): 7 days
  IF p_fetch_count > 200 THEN
    RETURN INTERVAL '7 days';
  -- Popular cities (>50 fetches): 14 days
  ELSIF p_fetch_count > 50 THEN
    RETURN INTERVAL '14 days';
  -- Default: 30 days
  ELSE
    RETURN INTERVAL '30 days';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Function to upsert city videos
-- ============================================
CREATE OR REPLACE FUNCTION upsert_city_videos(
  p_city_key TEXT,
  p_city_name TEXT,
  p_country TEXT,
  p_coordinates JSONB,
  p_ttl_days INTEGER DEFAULT 30
)
RETURNS city_videos AS $$
DECLARE
  v_result city_videos;
BEGIN
  INSERT INTO city_videos (city_key, city_name, country, coordinates, expires_at)
  VALUES (
    p_city_key,
    p_city_name,
    p_country,
    p_coordinates,
    NOW() + (p_ttl_days || ' days')::INTERVAL
  )
  ON CONFLICT (city_key) DO UPDATE SET
    city_name = EXCLUDED.city_name,
    country = EXCLUDED.country,
    coordinates = EXCLUDED.coordinates,
    fetched_at = NOW(),
    expires_at = NOW() + (p_ttl_days || ' days')::INTERVAL,
    fetch_count = city_videos.fetch_count + 1,
    updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
