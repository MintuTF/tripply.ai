import { createServerComponentClient } from '@/lib/db/supabase';
import { createTrip, getUserTrips } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

// GET /api/trips - Get all trips for the authenticated user
export async function GET() {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trips = await getUserTrips(user.id);
    return NextResponse.json({ trips });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: Request) {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, destination, dates, party_json, budget_range } = body;

    // Validate required fields
    if (!dates?.start || !dates?.end) {
      return NextResponse.json(
        { error: 'Travel dates are required' },
        { status: 400 }
      );
    }

    // Note: User record is automatically created by database trigger on auth.users insert
    // This fallback handles legacy users who signed up before the trigger was created
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      // Fallback: create user if trigger didn't run (legacy users)
      await supabase.from('users').insert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      });
    }

    // Generate title from destination if not provided
    const tripTitle = title || (destination?.name ? `${destination.name.split(',')[0]} Trip` : 'My Trip');

    const trip = await createTrip({
      user_id: user.id,
      title: tripTitle,
      destination: destination || undefined,
      dates,
      party_json: party_json || { adults: 2 },
      budget_range,
      privacy: 'private',
      status: 'planning',
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Failed to create trip' },
        { status: 500 }
      );
    }

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}
