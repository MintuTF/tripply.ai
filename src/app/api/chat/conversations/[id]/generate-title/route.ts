import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/db/supabase-server';
import { openai } from '@/lib/ai/openai';

interface MessageInput {
  role: 'user' | 'assistant';
  text: string;
}

/**
 * POST /api/chat/conversations/[id]/generate-title
 * Generates an AI-powered title for a conversation based on its messages
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { messages } = await request.json() as { messages: MessageInput[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Verify user owns this conversation
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate title using OpenAI
    const conversationSnippet = messages
      .slice(0, 3)
      .map(m => `${m.role}: ${m.text.slice(0, 200)}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that generates short, descriptive titles for travel chat conversations.
Generate a title that captures the main topic or intent of the conversation.
Rules:
- Maximum 6 words
- Be specific and descriptive
- Use title case
- No quotes or punctuation at the end
- Focus on the destination and activity/intent

Examples:
- "Tokyo Food Tour Planning"
- "Paris Hidden Gems"
- "Budget Beach Vacation Ideas"
- "Rome Family Trip Itinerary"
- "Best Cafes in Barcelona"`,
        },
        {
          role: 'user',
          content: `Generate a title for this travel chat conversation:\n\n${conversationSnippet}`,
        },
      ],
      max_tokens: 20,
      temperature: 0.7,
    });

    const title = completion.choices[0]?.message?.content?.trim() || 'New Conversation';

    // Update the conversation title in the database
    const { error: updateError } = await supabase
      .from('chat_conversations')
      .update({ title })
      .eq('id', conversationId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update conversation title:', updateError);
      // Still return the generated title even if DB update fails
    }

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Generate title error:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}
