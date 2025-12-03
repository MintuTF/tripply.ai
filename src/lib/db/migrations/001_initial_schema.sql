-- Voyagr Database Schema
-- Initial Migration: Core Tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  prefs_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  dates JSONB NOT NULL, -- {start: "2024-03-01", end: "2024-03-10"}
  party_json JSONB DEFAULT '{}'::jsonb, -- {adults: 2, children: 0}
  budget_range NUMERIC[2], -- [min, max] per night
  privacy TEXT NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'shared')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  text TEXT NOT NULL,
  tool_calls_json JSONB DEFAULT '[]'::jsonb,
  citations_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table (saved items: hotels, spots, food, activities, notes)
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('hotel', 'spot', 'food', 'activity', 'note')),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  labels TEXT[] DEFAULT ARRAY[]::TEXT[],
  favorite BOOLEAN DEFAULT FALSE,
  ranking INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table (for collaboration)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_type TEXT NOT NULL CHECK (parent_type IN ('message', 'card')),
  parent_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('price', 'weather', 'visa', 'itinerary')),
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  next_fire_at TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payload_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Share links table (for collaboration)
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'commenter', 'editor')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_trip_id ON messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_cards_trip_id ON cards(trip_id);
CREATE INDEX IF NOT EXISTS idx_cards_favorite ON cards(favorite) WHERE favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_type, parent_id);
CREATE INDEX IF NOT EXISTS idx_reminders_trip_id ON reminders(trip_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_trip_id ON audit_log(trip_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_trip_id ON share_links(trip_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Users: can only see/update their own profile
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

-- Trips: can see own trips or shared trips
CREATE POLICY trips_select_own ON trips FOR SELECT USING (
  auth.uid() = user_id OR
  id IN (SELECT trip_id FROM share_links WHERE token IN (
    SELECT token FROM share_links WHERE trip_id = trips.id
  ))
);

CREATE POLICY trips_insert_own ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY trips_update_own ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY trips_delete_own ON trips FOR DELETE USING (auth.uid() = user_id);

-- Messages: can see messages for trips they have access to
CREATE POLICY messages_select ON messages FOR SELECT USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid() OR id IN (
    SELECT trip_id FROM share_links
  ))
);

CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);

-- Cards: can see/modify cards for trips they have access to
CREATE POLICY cards_select ON cards FOR SELECT USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid() OR id IN (
    SELECT trip_id FROM share_links
  ))
);

CREATE POLICY cards_insert ON cards FOR INSERT WITH CHECK (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);

CREATE POLICY cards_update ON cards FOR UPDATE USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid() OR id IN (
    SELECT trip_id FROM share_links WHERE role IN ('editor')
  ))
);

CREATE POLICY cards_delete ON cards FOR DELETE USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);

-- Comments: can see/add comments on shared trips
CREATE POLICY comments_select ON comments FOR SELECT USING (
  (parent_type = 'message' AND parent_id IN (SELECT id FROM messages WHERE trip_id IN (
    SELECT id FROM trips WHERE user_id = auth.uid() OR id IN (SELECT trip_id FROM share_links)
  ))) OR
  (parent_type = 'card' AND parent_id IN (SELECT id FROM cards WHERE trip_id IN (
    SELECT id FROM trips WHERE user_id = auth.uid() OR id IN (SELECT trip_id FROM share_links)
  )))
);

CREATE POLICY comments_insert ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reminders: owner only
CREATE POLICY reminders_all ON reminders FOR ALL USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);

-- Audit log: read-only for trip owner
CREATE POLICY audit_log_select ON audit_log FOR SELECT USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);

-- Share links: owner can manage
CREATE POLICY share_links_select ON share_links FOR SELECT USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);

CREATE POLICY share_links_insert ON share_links FOR INSERT WITH CHECK (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);

CREATE POLICY share_links_delete ON share_links FOR DELETE USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
