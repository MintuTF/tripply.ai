import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prepareStoryData } from '@/lib/story/prepareStoryData';
import { Card } from '@/types';

/**
 * GET /api/trips/[id]/story-data
 * Returns all data needed for story video generation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check authorization
    if (trip.user_id !== user.id && trip.privacy !== 'shared') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch cards for this trip
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .eq('trip_id', tripId);

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
      return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
    }

    // Prepare story data
    const storyData = await prepareStoryData(trip, cards || []);

    // Check if there are any confirmed cards
    const confirmedCount = (cards || []).filter((c: Card) => c.labels?.includes('confirmed')).length;

    if (confirmedCount === 0) {
      return NextResponse.json({
        error: 'No confirmed items',
        message: 'Move cards to the "Confirmed" column to generate a story',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: storyData,
      meta: {
        tripId,
        confirmedCount,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Story data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
