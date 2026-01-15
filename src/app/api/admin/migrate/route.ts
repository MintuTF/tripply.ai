import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// POST /api/admin/migrate - Run database migration to add 'researching' status
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      {
        error: 'Database not configured',
        instructions: 'Run the migration manually in Supabase SQL Editor:\n\n' +
          'ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;\n' +
          'ALTER TABLE trips ADD CONSTRAINT trips_status_check CHECK (status IN (\'researching\', \'planning\', \'in_progress\', \'completed\', \'archived\'));'
      },
      { status: 503 }
    );
  }

  try {
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Drop existing constraint
    const { error: dropError } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check'
    });

    if (dropError) {
      console.error('Error dropping constraint:', dropError);
    }

    // Add new constraint with 'researching' status
    const { error: addError } = await supabase.rpc('exec_sql', {
      query: "ALTER TABLE trips ADD CONSTRAINT trips_status_check CHECK (status IN ('researching', 'planning', 'in_progress', 'completed', 'archived'))"
    });

    if (addError) {
      console.error('Error adding constraint:', addError);
      return NextResponse.json(
        {
          error: 'Migration failed',
          details: addError,
          instructions: 'Run the migration manually in Supabase SQL Editor:\n\n' +
            'ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;\n' +
            'ALTER TABLE trips ADD CONSTRAINT trips_status_check CHECK (status IN (\'researching\', \'planning\', \'in_progress\', \'completed\', \'archived\'));'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed: Added researching status to trips table',
    });
  } catch (error) {
    console.error('Migration execution error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run migration',
        details: error,
        instructions: 'Run the migration manually in Supabase SQL Editor:\n\n' +
          'ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;\n' +
          'ALTER TABLE trips ADD CONSTRAINT trips_status_check CHECK (status IN (\'researching\', \'planning\', \'in_progress\', \'completed\', \'archived\'));'
      },
      { status: 500 }
    );
  }
}
