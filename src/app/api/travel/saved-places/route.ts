import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/travel/saved-places - Get user's saved places
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ savedPlaceIds: [] });
    }

    // Get saved places from database
    const { data, error } = await supabase
      .from('saved_places')
      .select('place_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching saved places:', error);
      return NextResponse.json({ savedPlaceIds: [] });
    }

    const savedPlaceIds = data.map((row: { place_id: string }) => row.place_id);

    return NextResponse.json({ savedPlaceIds });
  } catch (error) {
    console.error('Failed to fetch saved places:', error);
    return NextResponse.json({ savedPlaceIds: [] });
  }
}

// POST /api/travel/saved-places - Save a place
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { placeId, placeData } = body;

    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    // Insert or update saved place
    const { error } = await supabase.from('saved_places').upsert(
      {
        user_id: user.id,
        place_id: placeId,
        place_data: placeData || null,
        saved_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,place_id',
      }
    );

    if (error) {
      console.error('Error saving place:', error);
      return NextResponse.json(
        { error: 'Failed to save place' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save place:', error);
    return NextResponse.json(
      { error: 'Failed to save place' },
      { status: 500 }
    );
  }
}

// DELETE /api/travel/saved-places - Remove a saved place
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('saved_places')
      .delete()
      .eq('user_id', user.id)
      .eq('place_id', placeId);

    if (error) {
      console.error('Error removing saved place:', error);
      return NextResponse.json(
        { error: 'Failed to remove saved place' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove saved place:', error);
    return NextResponse.json(
      { error: 'Failed to remove saved place' },
      { status: 500 }
    );
  }
}
