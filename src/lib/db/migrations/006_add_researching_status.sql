-- Add 'researching' status to trips table
-- This allows trips to be created in a research phase before planning

-- Drop the existing check constraint
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;

-- Add new check constraint with 'researching' status
ALTER TABLE trips
ADD CONSTRAINT trips_status_check
CHECK (status IN ('researching', 'planning', 'in_progress', 'completed', 'archived'));
