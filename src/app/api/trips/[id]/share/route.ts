import { createServerComponentClient } from '@/lib/db/supabase';
import { createShareLink, getTripShareLinks, getTrip } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

// GET /api/trips/[id]/share - Get all share links for a trip
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the trip
    const trip = await getTrip(tripId);
    if (!trip || trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const shareLinks = await getTripShareLinks(tripId);
    return NextResponse.json({ shareLinks });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}

// POST /api/trips/[id]/share - Create a new share link
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the trip
    const trip = await getTrip(tripId);
    if (!trip || trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const body = await request.json();
    const { role = 'viewer', expires_in_days } = body;

    // Validate role
    if (!['viewer', 'commenter', 'editor'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Calculate expiration date if provided
    let expiresAt: string | undefined;
    if (expires_in_days) {
      const date = new Date();
      date.setDate(date.getDate() + expires_in_days);
      expiresAt = date.toISOString();
    }

    const shareLink = await createShareLink(tripId, role, expiresAt);

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        shareLink: {
          ...shareLink,
          role,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
