import { createServerComponentClient } from '@/lib/db/supabase-server';
import { NextResponse } from 'next/server';

// GET /api/research/trips - Get research trips for user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination');
  const status = searchParams.get('status') || 'researching';

  // Check if Supabase is configured
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabase) {
    return NextResponse.json({ trips: [] });
  }

  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ trips: [] });
  }

  try {
    // Query trips filtered by status
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching research trips:', error);
      return NextResponse.json({ trips: [] });
    }

    // Filter by destination if provided
    let trips = data || [];
    if (destination) {
      trips = trips.filter((t) => {
        const destName = t.destination?.name || '';
        return destName.toLowerCase() === destination.toLowerCase();
      });
    }

    return NextResponse.json({ trips });
  } catch (error) {
    console.error('Research trips GET error:', error);
    return NextResponse.json({ trips: [] });
  }
}

// POST /api/research/trips - Create new research trip
export async function POST(request: Request) {
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
    const body = await request.json();
    const { destination, status = 'researching' } = body;

    if (!destination || !destination.name) {
      return NextResponse.json(
        { error: 'Destination name is required' },
        { status: 400 }
      );
    }

    // Create research trip
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        title: `Research: ${destination.name}`,
        destination,
        status,
        dates: {
          start: new Date().toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
        party_json: { adults: 1 },
        privacy: 'private',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating research trip:', error);
      return NextResponse.json(
        { error: 'Failed to create research trip' },
        { status: 500 }
      );
    }

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error('Research trips POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
