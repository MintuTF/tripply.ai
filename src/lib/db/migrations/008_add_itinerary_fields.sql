-- Migration: Add itinerary planning fields to cards table
-- Description: Adds day, time_slot, order, and travel_info columns to support itinerary planning features
-- Created: 2025-12-26

-- Add itinerary planning fields to cards table
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS day INTEGER,
  ADD COLUMN IF NOT EXISTS time_slot TEXT,
  ADD COLUMN IF NOT EXISTS "order" INTEGER,
  ADD COLUMN IF NOT EXISTS travel_info JSONB DEFAULT NULL;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cards_day
  ON cards(day)
  WHERE day IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cards_trip_day
  ON cards(trip_id, day);

CREATE INDEX IF NOT EXISTS idx_cards_trip_day_order
  ON cards(trip_id, day, "order")
  WHERE day IS NOT NULL;

-- Add constraints
ALTER TABLE cards
  ADD CONSTRAINT cards_day_check
  CHECK (day IS NULL OR (day >= 1 AND day <= 365));

ALTER TABLE cards
  ADD CONSTRAINT cards_order_check
  CHECK ("order" IS NULL OR "order" >= 0);

-- Create function to validate time slot format (HH:MM 24-hour)
CREATE OR REPLACE FUNCTION validate_time_slot(slot TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Format: HH:MM (24-hour)
  RETURN slot ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add time slot format constraint
ALTER TABLE cards
  ADD CONSTRAINT cards_time_slot_format
  CHECK (time_slot IS NULL OR validate_time_slot(time_slot));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at on any change
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add column comments for documentation
COMMENT ON COLUMN cards.day IS 'Which day of the trip (1-based index, 1-365)';
COMMENT ON COLUMN cards.time_slot IS 'Scheduled time in HH:MM format (24-hour)';
COMMENT ON COLUMN cards."order" IS 'Position within the day (0-based)';
COMMENT ON COLUMN cards.travel_info IS 'Travel details to next stop: {distance, duration, mode, next_stop_id}';

-- Rollback script (for reference, commented out)
/*
-- To rollback this migration, run:
ALTER TABLE cards
  DROP COLUMN IF EXISTS day,
  DROP COLUMN IF EXISTS time_slot,
  DROP COLUMN IF EXISTS "order",
  DROP COLUMN IF EXISTS travel_info;

DROP INDEX IF EXISTS idx_cards_day;
DROP INDEX IF EXISTS idx_cards_trip_day;
DROP INDEX IF EXISTS idx_cards_trip_day_order;
DROP FUNCTION IF EXISTS validate_time_slot(TEXT);
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
DROP FUNCTION IF EXISTS update_updated_at_column();
*/
