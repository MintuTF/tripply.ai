-- Shared cache for what the AI read out of a YouTube video (summary, key points, tips, named places).
-- One AI call per video for everyone, instead of one per server instance. Only the server (service role) touches
-- this table: RLS is on and there are deliberately no policies, so the browser can neither read nor write it.

CREATE TABLE IF NOT EXISTS video_insights (
  video_id       TEXT        PRIMARY KEY,
  insights       JSONB       NOT NULL,
  has_transcript BOOLEAN     NOT NULL DEFAULT FALSE,
  model          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_video_insights_expires_at ON video_insights(expires_at);

ALTER TABLE video_insights ENABLE ROW LEVEL SECURITY;
