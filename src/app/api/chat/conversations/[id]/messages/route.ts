import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/db/supabase-server';
import {
  getConversation,
  addMessageToConversation,
} from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/chat/conversations/[id]/messages
 * Add a message to a conversation
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conversation = await getConversation(id);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role, text, chat_mode, cards_json, itinerary_json, trip_id } = body;

    if (!role || !text) {
      return NextResponse.json(
        { error: 'Role and text are required' },
        { status: 400 }
      );
    }

    // Validate trip_id is a valid UUID or null (prevent 'draft', 'travel-chat', etc.)
    const isValidUUID = (id: string | null | undefined): boolean => {
      if (!id) return true; // null/undefined is valid
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    };

    const validatedTripId = isValidUUID(trip_id) ? trip_id :
                            isValidUUID(conversation.trip_id) ? conversation.trip_id : null;

    const message = await addMessageToConversation(id, {
      trip_id: validatedTripId,
      role,
      text,
      chat_mode,
      cards_json,
      itinerary_json,
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to add message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}
