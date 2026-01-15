-- Trip Invitations Table
-- Tracks email invitations sent for trips

CREATE TABLE IF NOT EXISTS trip_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'commenter', 'editor')),
  share_token TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Index for fast lookups by trip
CREATE INDEX IF NOT EXISTS idx_trip_invitations_trip_id ON trip_invitations(trip_id);

-- Index for fast lookups by email
CREATE INDEX IF NOT EXISTS idx_trip_invitations_email ON trip_invitations(email);

-- Index for fast lookups by inviter
CREATE INDEX IF NOT EXISTS idx_trip_invitations_invited_by ON trip_invitations(invited_by);

-- RLS Policies
ALTER TABLE trip_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Trip owners can view all invitations for their trips
CREATE POLICY "Trip owners can view invitations"
  ON trip_invitations FOR SELECT
  USING (
    trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
  );

-- Policy: Trip owners can create invitations for their trips
CREATE POLICY "Trip owners can create invitations"
  ON trip_invitations FOR INSERT
  WITH CHECK (
    trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
  );

-- Policy: Trip owners can update invitations for their trips
CREATE POLICY "Trip owners can update invitations"
  ON trip_invitations FOR UPDATE
  USING (
    trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
  );

-- Policy: Trip owners can delete invitations for their trips
CREATE POLICY "Trip owners can delete invitations"
  ON trip_invitations FOR DELETE
  USING (
    trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
  );

-- Policy: Invited users can view their own invitations by email
CREATE POLICY "Invited users can view their invitations"
  ON trip_invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Invited users can update their own invitation status (accept)
CREATE POLICY "Invited users can accept invitations"
  ON trip_invitations FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
