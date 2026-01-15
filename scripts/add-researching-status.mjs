#!/usr/bin/env node

/**
 * Add 'researching' status to trips table
 *
 * Usage: node scripts/add-researching-status.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

async function runMigration() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('🚀 Running migration: Add researching status to trips table...\n');

  try {
    // First, drop the existing constraint
    console.log('   Dropping existing constraint...');
    const { error: dropError } = await supabase
      .from('trips')
      .select('id')
      .limit(0); // Just to test connection

    if (dropError && dropError.code !== 'PGRST116') {
      console.warn('   Note: Testing connection:', dropError.message);
    }

    // Execute the SQL using the REST API
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          query: `
            ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
            ALTER TABLE trips ADD CONSTRAINT trips_status_check
            CHECK (status IN ('researching', 'planning', 'in_progress', 'completed', 'archived'));
          `
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log('✅ Migration completed successfully!');
    console.log('   Allowed trip statuses: researching, planning, in_progress, completed, archived\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:\n');
    console.log('   ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;');
    console.log("   ALTER TABLE trips ADD CONSTRAINT trips_status_check");
    console.log("   CHECK (status IN ('researching', 'planning', 'in_progress', 'completed', 'archived'));\n");
    process.exit(1);
  }
}

runMigration();
