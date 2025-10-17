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
    const { title, dates, party_json, budget_range } = body;

    if (!title || !dates) {
      return NextResponse.json(
        { error: 'Title and dates are required' },
        { status: 400 }
      );
    }

    const trip = await createTrip({
      user_id: user.id,
      title,
      dates,
      party_json: party_json || { adults: 1 },
      budget_range,
      privacy: 'private',
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Failed to create trip' },
        { status: 500 }
      );
    }

    return NextResponse.json({ trip }, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}
