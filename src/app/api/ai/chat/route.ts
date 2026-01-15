import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * POST /api/ai/chat
 * OpenAI GPT-4 chat completions for travel assistance
 *
 * Body params:
 * - messages (required): Array of chat messages
 * - destination (required): The destination city for context
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`ai-chat:${clientIP}`, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    const body = await request.json();
    const { messages, destination } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination is required' },
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // System prompt for travel assistance
    const systemPrompt = `You are an expert travel assistant specializing in ${destination}.
Your role is to provide helpful, accurate, and personalized travel advice including:
- Local attractions, landmarks, and hidden gems
- Restaurant and food recommendations
- Accommodation suggestions
- Transportation tips
- Cultural insights and customs
- Budget and cost estimates
- Seasonal considerations and weather
- Safety tips

Keep your responses conversational, concise (3-5 sentences unless asked for more detail), and actionable.
When suggesting places or activities, include practical details like approximate costs, best times to visit, or how to get there.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });

    const responseContent = completion.choices[0].message.content;

    return NextResponse.json(
      {
        content: responseContent,
        model: completion.model,
        usage: completion.usage,
      },
      {
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error: any) {
    console.error('AI Chat error:', error);

    // Handle OpenAI specific errors
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'OpenAI rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
