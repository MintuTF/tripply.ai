-- Migration: Add welcome_email_sent_at column to users table
-- Purpose: Track when welcome email was sent to prevent duplicate sends

-- Add welcome_email_sent_at column to track when welcome email was sent
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Create partial index for efficient null checks (only indexes rows where email hasn't been sent)
CREATE INDEX IF NOT EXISTS idx_users_welcome_email_not_sent ON users(welcome_email_sent_at)
WHERE welcome_email_sent_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.welcome_email_sent_at IS 'Timestamp when welcome email was sent. NULL means not sent yet.';
