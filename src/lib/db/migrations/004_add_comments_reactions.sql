-- Add reactions column to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_comments_card ON comments(parent_id) WHERE parent_type = 'card';
