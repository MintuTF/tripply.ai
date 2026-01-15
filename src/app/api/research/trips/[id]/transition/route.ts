import { createServerComponentClient } from '@/lib/db/supabase-server';
import { NextResponse } from 'next/server';

// POST /api/research/trips/[id]/transition - Transition trip status
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check if Supabase is configured
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { status } = await request.json();
    const tripId = params.id;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Transition trip status
    const { error } = await supabase
      .from('trips')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error transitioning trip:', error);
      return NextResponse.json(
        { error: 'Failed to transition trip' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Trip transition error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
