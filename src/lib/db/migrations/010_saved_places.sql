-- Saved places: the places a signed-in user has bookmarked while exploring.
-- The app (src/app/api/travel/saved-places) already reads and writes this table.

CREATE TABLE IF NOT EXISTS saved_places (
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id   TEXT        NOT NULL,
  place_data JSONB,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_places_user ON saved_places(user_id, saved_at DESC);

ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_places_own ON saved_places;
CREATE POLICY saved_places_own ON saved_places
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
