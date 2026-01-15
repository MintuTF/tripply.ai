/**
 * Run database migration to add 'researching' status
 *
 * Usage:
 * npx tsx scripts/run-migration.ts
 *
 * Or manually run this SQL in Supabase SQL Editor:
 *
 * ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
 * ALTER TABLE trips ADD CONSTRAINT trips_status_check
 * CHECK (status IN ('researching', 'planning', 'in_progress', 'completed', 'archived'));
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:\n');
  console.log('ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;');
  console.log("ALTER TABLE trips ADD CONSTRAINT trips_status_check CHECK (status IN ('researching', 'planning', 'in_progress', 'completed', 'archived'));");
  process.exit(1);
}

async function runMigration() {
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  console.log('🚀 Running migration: Add researching status...\n');

  try {
    // Execute raw SQL
    const sql = `
      ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
      ALTER TABLE trips ADD CONSTRAINT trips_status_check
      CHECK (status IN ('researching', 'planning', 'in_progress', 'completed', 'archived'));
    `;

    const { error } = await (supabase as any).rpc('exec', { sql });

    if (error) {
      throw error;
    }

    console.log('✅ Migration completed successfully!');
    console.log('   Added "researching" to allowed trip statuses');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:\n');
    console.log('ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;');
    console.log("ALTER TABLE trips ADD CONSTRAINT trips_status_check CHECK (status IN ('researching', 'planning', 'in_progress', 'completed', 'archived'));");
    process.exit(1);
  }
}

runMigration();
