-- Migration to add itinerary columns to cards table
-- Run this in your Supabase SQL editor

ALTER TABLE cards
ADD COLUMN IF NOT EXISTS day INTEGER,
ADD COLUMN IF NOT EXISTS time_slot TEXT,
ADD COLUMN IF NOT EXISTS "order" INTEGER,
ADD COLUMN IF NOT EXISTS travel_info JSONB;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cards_trip_day ON cards(trip_id, day);
CREATE INDEX IF NOT EXISTS idx_cards_trip_day_order ON cards(trip_id, day, "order");

COMMENT ON COLUMN cards.day IS 'Which day of the trip (1-based: Day 1, Day 2, etc.)';
COMMENT ON COLUMN cards.time_slot IS 'Time for this activity (e.g., "09:00", "14:30")';
COMMENT ON COLUMN cards."order" IS 'Order within the day for sequencing activities';
COMMENT ON COLUMN cards.travel_info IS 'Travel time/distance to next activity in sequence';
