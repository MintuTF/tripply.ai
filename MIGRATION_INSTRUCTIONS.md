# Database Migration: Add 'researching' Status

## Issue
The application is trying to create trips with status 'researching', but the database constraint only allows: `'planning'`, `'in_progress'`, `'completed'`, `'archived'`.

## Solution
Run the following SQL in your Supabase SQL Editor:

```sql
-- Drop the existing check constraint
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;

-- Add new check constraint with 'researching' status
ALTER TABLE trips
ADD CONSTRAINT trips_status_check
CHECK (status IN ('researching', 'planning', 'in_progress', 'completed', 'archived'));
```

## Steps

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Paste the SQL above
5. Click **Run** or press `Ctrl/Cmd + Enter`
6. You should see: "Success. No rows returned"

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db execute --file src/lib/db/migrations/006_add_researching_status.sql
```

### Option 3: psql (Direct Database Connection)
```bash
# Using your Supabase database URL
psql "postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/postgres" -f src/lib/db/migrations/006_add_researching_status.sql
```

## Verification
After running the migration, try creating a research trip again. The error should be resolved.

You can verify the constraint was updated by running:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'trips_status_check';
```

This should show the new constraint including 'researching'.
