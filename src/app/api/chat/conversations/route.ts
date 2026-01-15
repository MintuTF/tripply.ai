import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/db/supabase-server';
import { getConversations, createConversation } from '@/lib/db/queries';

/**
 * GET /api/chat/conversations
 * List user's conversations (max 5)
 */
export async function GET() {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conversations = await getConversations(user.id);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { destination, chat_mode = 'ask', trip_id } = body;

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination is required' },
        { status: 400 }
      );
    }

    // Validate trip_id is a valid UUID or null (prevent 'draft', 'travel-chat', etc.)
    const isValidUUID = (id: string | null | undefined): boolean => {
      if (!id) return true; // null/undefined is valid
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    };

    const validatedTripId = isValidUUID(trip_id) ? trip_id : undefined;

    const conversation = await createConversation(
      user.id,
      destination,
      chat_mode,
      validatedTripId
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
