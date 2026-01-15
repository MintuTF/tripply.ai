import { createServerComponentClient } from '@/lib/db/supabase-server';
import { getTripCards, createCard } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

// GET /api/cards?trip_id=xxx - Get all cards for a trip
export async function GET(request: Request) {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('trip_id');

    if (!tripId) {
      return NextResponse.json(
        { error: 'trip_id is required' },
        { status: 400 }
      );
    }

    const cards = await getTripCards(tripId);
    return NextResponse.json({ cards });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}

// POST /api/cards - Create a new card
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
    const { trip_id, type, payload_json, labels, favorite } = body;
    // Note: day, time_slot, order are used in the frontend but not stored in DB yet

    if (!trip_id || !type || !payload_json) {
      return NextResponse.json(
        { error: 'trip_id, type, and payload_json are required' },
        { status: 400 }
      );
    }

    // Only insert fields that exist in the database schema
    const { data: card, error } = await supabase
      .from('cards')
      .insert({
        trip_id,
        type,
        payload_json,
        labels: labels || [],
        favorite: favorite || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating card:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create card' },
        { status: 500 }
      );
    }

    if (!card) {
      return NextResponse.json(
        { error: 'Failed to create card - no data returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({ card }, { status: 201 });
  } catch (err) {
    console.error('Error in POST /api/cards:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create card' },
      { status: 500 }
    );
  }
}
