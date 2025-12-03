import { createServerComponentClient } from '@/lib/db/supabase';
import { createMessage, getTripMessages, getTrip } from '@/lib/db/queries';
import { orchestrateChatStream } from '@/lib/ai/orchestrator';
import type { Message, ToolCall, Citation, PlaceCard } from '@/types';

// POST /api/chat/stream - Send a message and get streaming AI response
export async function POST(request: Request) {
  const encoder = new TextEncoder();

  try {
    const { trip_id, message, messages: clientMessages } = await request.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if Supabase is configured
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let messages: Message[] = [];
    let tripContext:
      | {
          title: string;
          dates?: { start: string; end: string };
          budget_range?: [number, number];
          preferences?: Record<string, unknown>;
        }
      | undefined = undefined;

    if (hasSupabase && trip_id) {
      const supabase = await createServerComponentClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
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
      // Use client-provided conversation history
      messages = clientMessages;
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Buffer for database save
          let fullResponse = '';
          let toolCallsData: ToolCall[] = [];
          let citationsData: Citation[] = [];
          let cardsData: PlaceCard[] = [];

          // Stream the AI response
          for await (const chunk of orchestrateChatStream({
            messages: hasSupabase ? messages.slice(0, -1) : messages,
            userMessage: message,
            tripContext,
          })) {
            if (chunk.type === 'toolCalls') {
              // Send tool calls first
              toolCallsData = chunk.toolCalls || [];
              const data = JSON.stringify({
                type: 'toolCalls',
                toolCalls: chunk.toolCalls,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (chunk.type === 'cards') {
              // Send cards immediately after tools complete (BEFORE AI writes response)
              cardsData = chunk.cards || [];
              const data = JSON.stringify({
                type: 'cards',
                cards: chunk.cards,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (chunk.type === 'content') {
              // Stream content chunks
              fullResponse += chunk.content;
              const data = JSON.stringify({
                type: 'content',
                content: chunk.content,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (chunk.type === 'done') {
              // Send final metadata (citations and intent only, cards already sent)
              citationsData = chunk.citations || [];
              const data = JSON.stringify({
                type: 'done',
                citations: chunk.citations,
                intent: chunk.intent,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Save assistant message to database if Supabase is configured
          if (hasSupabase && trip_id && fullResponse) {
            await createMessage({
              trip_id,
              role: 'assistant',
              text: fullResponse,
              tool_calls_json: toolCallsData,
              citations_json: citationsData,
              cards_json: cardsData,
            });
          }

          controller.close();
        } catch (_error) {
          console.error('Streaming error:', _error);
          const errorData = JSON.stringify({
            type: 'error',
            error: 'Failed to generate response',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (_error) {
    console.error('Chat stream error:', _error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
