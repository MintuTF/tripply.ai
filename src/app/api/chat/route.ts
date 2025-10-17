import { createServerComponentClient } from '@/lib/db/supabase';
import { createMessage, getTripMessages, getTrip } from '@/lib/db/queries';
import { orchestrateChat } from '@/lib/ai/orchestrator';
import { NextResponse } from 'next/server';

// POST /api/chat - Send a message and get AI response
export async function POST(request: Request) {
  try {
    const { trip_id, message, messages: clientMessages } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let messages: any[] = [];
    let tripContext: any = {};

    if (hasSupabase && trip_id) {
      const supabase = await createServerComponentClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get trip context
      const trip = await getTrip(trip_id);
      if (trip) {
        tripContext = {
          title: trip.title,
          dates: trip.dates as { start: string; end: string },
          budget_range: trip.budget_range
            ? (trip.budget_range as [number, number])
            : undefined,
        };
      }

      // Save user message
      await createMessage({
        trip_id,
        role: 'user',
        text: message,
      });

      // Get conversation history
      messages = await getTripMessages(trip_id);
    } else if (clientMessages && Array.isArray(clientMessages)) {
      // Use client-provided conversation history when Supabase is not configured
      messages = clientMessages;
    }

    // Call AI orchestrator
    const aiResponse = await orchestrateChat({
      messages: hasSupabase ? messages.slice(0, -1) : messages, // Only slice if from DB (includes new message)
      userMessage: message,
      tripContext,
    });

    // Create response messages
    const userMessage = {
      id: crypto.randomUUID(),
      trip_id: trip_id || 'temp',
      role: 'user' as const,
      text: message,
      created_at: new Date().toISOString(),
    };

    const assistantMessage = {
      id: crypto.randomUUID(),
      trip_id: trip_id || 'temp',
      role: 'assistant' as const,
      text: aiResponse.response,
      tool_calls_json: aiResponse.toolCalls,
      citations_json: aiResponse.citations,
      created_at: new Date().toISOString(),
    };

    // Save assistant message if Supabase is configured
    if (hasSupabase && trip_id) {
      await createMessage({
        trip_id,
        role: 'assistant',
        text: aiResponse.response,
        tool_calls_json: aiResponse.toolCalls,
        citations_json: aiResponse.citations,
      });
    }

    return NextResponse.json({
      userMessage,
      assistantMessage,
      intent: aiResponse.intent,
      toolCalls: aiResponse.toolCalls,
      citations: aiResponse.citations,
    });
  } catch (_error) {
    console.error('Chat error:', _error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// GET /api/chat?trip_id=xxx - Get chat history for a trip
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

    const messages = await getTripMessages(tripId);
    return NextResponse.json({ messages });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
