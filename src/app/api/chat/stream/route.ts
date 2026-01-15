import { createServerComponentClient } from '@/lib/db/supabase-server';
import { createMessage, getTripMessages, getTrip, touchConversation } from '@/lib/db/queries';
import { orchestrateChatStream } from '@/lib/ai/orchestrator';
import type { Message, ToolCall, Citation, PlaceCard, ChatMode, ItineraryResponse } from '@/types';
import type { ChatVideoResult, VideoAnalysis, SmartVideoResult } from '@/types/video';

// POST /api/chat/stream - Send a message and get streaming AI response
export async function POST(request: Request) {
  const encoder = new TextEncoder();

  try {
    const { trip_id, conversation_id, message, messages: clientMessages, budget_constraints, chatMode = 'ask', context } = await request.json() as {
      trip_id?: string;
      conversation_id?: string;
      message: string;
      messages?: any[];
      budget_constraints?: any;
      chatMode?: ChatMode;
      context?: {
        destination?: string;
        country?: string;
        savedPlacesCount?: number;
      };
    };

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if Supabase is configured
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if trip_id is a valid UUID (not "draft" or other placeholder)
    const isValidUUID = trip_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trip_id);

    let messages: Message[] = [];
    let tripContext:
      | {
          title: string;
          destination?: string;
          dates?: { start: string; end: string };
          budget_range?: [number, number];
          preferences?: Record<string, unknown>;
          savedPlacesCount?: number;
        }
      | undefined = undefined;

    if (hasSupabase && isValidUUID) {
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
          destination: context?.destination || trip.title, // Use context destination or trip title
          dates: trip.dates as { start: string; end: string },
          budget_range: trip.budget_range
            ? (trip.budget_range as [number, number])
            : undefined,
          preferences: context?.country ? { country: context.country } : undefined,
          savedPlacesCount: context?.savedPlacesCount,
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
      // Transform frontend message format (content) to backend format (text)
      messages = clientMessages
        .filter((m: any) => m.content && m.content.trim() !== '')
        .map((m: any) => ({
          id: m.id,
          trip_id: trip_id || '', // Add trip_id to satisfy Message type
          role: m.role,
          text: m.content, // Map 'content' to 'text'
          created_at: m.timestamp || new Date().toISOString(),
        }));
    }

    // If no tripContext from database, use client-provided context
    if (!tripContext && context?.destination) {
      tripContext = {
        title: context.destination,
        destination: context.destination,
        preferences: context.country ? { country: context.country } : undefined,
        savedPlacesCount: context.savedPlacesCount,
      };
    }

    // Debug log for video search context
    console.log('[Chat Stream] Context:', { destination: tripContext?.destination, title: tripContext?.title, hasContext: !!context });

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Buffer for database save
          let fullResponse = '';
          let toolCallsData: ToolCall[] = [];
          let citationsData: Citation[] = [];
          let cardsData: PlaceCard[] = [];
          let videosData: ChatVideoResult[] = [];
          let itineraryData: ItineraryResponse | null = null;

          // Stream the AI response
          for await (const chunk of orchestrateChatStream({
            messages: isValidUUID ? messages.slice(0, -1) : messages,
            userMessage: message,
            chatMode, // Pass explicit mode from client
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
            } else if (chunk.type === 'videos') {
              // Send videos from search_videos tool
              videosData = chunk.videos || [];
              const data = JSON.stringify({
                type: 'videos',
                videos: chunk.videos,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (chunk.type === 'videoAnalysis') {
              // Send video analysis (summary, highlights, places)
              const data = JSON.stringify({
                type: 'videoAnalysis',
                videoAnalysis: chunk.videoAnalysis,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (chunk.type === 'smartVideoResult') {
              // Send smart video result (text + video grid with deep analysis)
              const data = JSON.stringify({
                type: 'smartVideoResult',
                smartVideoResult: chunk.smartVideoResult,
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
            } else if (chunk.type === 'itinerary') {
              // Send parsed itinerary data
              itineraryData = chunk.itinerary || null;
              const data = JSON.stringify({
                type: 'itinerary',
                itinerary: chunk.itinerary,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (chunk.type === 'done') {
              // Send final metadata (citations, intent, and mode)
              citationsData = chunk.citations || [];
              const data = JSON.stringify({
                type: 'done',
                citations: chunk.citations,
                intent: chunk.intent,
                chatMode: chunk.chatMode,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Save assistant message to database if Supabase is configured and trip_id is valid
          if (hasSupabase && isValidUUID && fullResponse) {
            await createMessage({
              trip_id,
              role: 'assistant',
              text: fullResponse,
              tool_calls_json: toolCallsData,
              citations_json: citationsData,
              // Note: cards_json omitted as they're saved separately via the cards API
            });
          }

          // Update conversation timestamp if conversation_id provided
          if (conversation_id) {
            await touchConversation(conversation_id);
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
