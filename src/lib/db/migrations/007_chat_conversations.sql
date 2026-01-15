-- Chat Conversations Migration
-- Adds conversation management with max 5 conversations globally per user

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  destination TEXT NOT NULL,
  title TEXT,
  chat_mode TEXT DEFAULT 'ask' CHECK (chat_mode IN ('ask', 'itinerary')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS chat_mode TEXT CHECK (chat_mode IN ('ask', 'itinerary'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS cards_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS itinerary_json JSONB;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_destination ON chat_conversations(user_id, destination);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- Apply updated_at trigger to chat_conversations
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on chat_conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
-- Users can only see their own conversations
CREATE POLICY conversations_select_own ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY conversations_insert_own ON chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY conversations_update_own ON chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY conversations_delete_own ON chat_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Update messages RLS to also allow access via conversation ownership
DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages FOR SELECT USING (
  -- Original: trip-based access
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid() OR id IN (
    SELECT trip_id FROM share_links
  ))
  OR
  -- New: conversation-based access
  conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (
  -- Original: trip-based access
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
  OR
  -- New: conversation-based access
  conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
);

-- Function to enforce max 5 conversations per user
CREATE OR REPLACE FUNCTION enforce_conversation_limit()
RETURNS TRIGGER AS $$
DECLARE
  conversation_count INTEGER;
  oldest_id UUID;
BEGIN
  -- Count user's conversations
  SELECT COUNT(*) INTO conversation_count
  FROM chat_conversations
  WHERE user_id = NEW.user_id;

  -- If more than 5, delete the oldest
  WHILE conversation_count > 5 LOOP
    SELECT id INTO oldest_id
    FROM chat_conversations
    WHERE user_id = NEW.user_id
    ORDER BY updated_at ASC
    LIMIT 1;

    DELETE FROM chat_conversations WHERE id = oldest_id;
    conversation_count := conversation_count - 1;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce limit after insert
CREATE TRIGGER enforce_conversation_limit_trigger
  AFTER INSERT ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION enforce_conversation_limit();

-- Grant permissions
GRANT ALL ON chat_conversations TO anon, authenticated;
