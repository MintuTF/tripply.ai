-- Add status column to trips table
-- Status values: planning, in_progress, completed, archived

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'planning'
CHECK (status IN ('planning', 'in_progress', 'completed', 'archived'));

-- Add destination column to store destination info as JSONB
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS destination JSONB;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- Index for filtering active trips (non-archived)
CREATE INDEX IF NOT EXISTS idx_trips_active ON trips(user_id, status) WHERE status != 'archived';
