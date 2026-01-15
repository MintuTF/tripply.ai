import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { searchVideos } from '@/lib/tools/videos';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for travel recommendations
const TRAVEL_SYSTEM_PROMPT = `You are a travel planning assistant. You receive structured JSON containing:
- City and places data (ONLY recommend places from this data)
- Traveler profile (couple, family, solo, friends)
- Trip duration
- Conversation history

RULES:
1. ONLY recommend places from the provided places JSON
2. Use simple English (ESL-friendly)
3. Keep responses concise - bullets over paragraphs
4. ALWAYS include "Why it fits" for each recommendation:
   - How it matches their traveler type
   - How it fits their trip length
   - Relevant context (time of day, nearby activities)
5. Never repeat the same place unless asked
6. If impossible, offer closest alternatives

OUTPUT FORMAT (respond with valid JSON only):
{
  "title": "Short summary",
  "summary": "One sentence direct answer",
  "items": [
    {
      "placeId": "...",
      "placeName": "...",
      "headline": "Tokyo Tower at sunset",
      "whyItFits": [
        "Romantic skyline experience perfect for couples",
        "Short visit (1-2 hrs) fits a 2-day itinerary",
        "Close to dinner spots for a date night"
      ],
      "duration": "1-2 hrs",
      "bestTime": "Evening",
      "priority": 1
    }
  ],
  "followUpSuggestions": [
    "What about romantic dinner spots?",
    "Any nighttime activities?"
  ]
}`;

// System prompt for place-specific chat
const PLACE_CHAT_SYSTEM_PROMPT = `You are a knowledgeable travel assistant helping a user learn more about a specific place they're interested in visiting.

RULES:
1. Answer questions specifically about this place
2. Be helpful, friendly, and concise
3. Use simple English (ESL-friendly)
4. Provide practical information when possible
5. If you don't have specific information, give general travel advice relevant to the place type
6. Keep responses to 2-3 short paragraphs maximum

Place Context:
- Name: {placeName}
- Categories: {categories}
- Description: {description}

Respond naturally as a helpful travel assistant. Do NOT use JSON format - just respond with plain text.`;

// System prompt for "Why worth a visit"
const WHY_VISIT_SYSTEM_PROMPT = `You are a travel expert. Given a place's details, provide 3-5 compelling reasons why this place is worth visiting.

RULES:
1. Be specific to the place, not generic
2. Use simple, engaging language
3. Include practical tips when relevant
4. Each reason should be 1-2 sentences max

OUTPUT FORMAT (respond with valid JSON only):
{
  "reasons": [
    "Reason 1...",
    "Reason 2...",
    "Reason 3..."
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle "whyVisit" requests
    if (body.type === 'whyVisit') {
      return handleWhyVisit(body);
    }

    // Handle place-specific chat requests
    if (body.type === 'placeChat') {
      return handlePlaceChat(body);
    }

    // Handle chat messages
    return handleChatMessage(body);
  } catch (error) {
    console.error('AI respond error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function handleWhyVisit(body: any) {
  const { place, city } = body;

  if (!place) {
    return NextResponse.json(
      { error: 'Place data is required' },
      { status: 400 }
    );
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: WHY_VISIT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            place: {
              name: place.name,
              categories: place.categories,
              rating: place.rating,
              description: place.description,
            },
            city,
          }),
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('WhyVisit error:', error);
    // Return fallback reasons
    return NextResponse.json({
      reasons: [
        `Highly rated ${place.categories?.[0] || 'destination'} in ${city}`,
        'Popular among travelers for its unique atmosphere',
        'Perfect for exploring and capturing memorable moments',
      ],
    });
  }
}

async function handlePlaceChat(body: any) {
  const { place, message, conversationHistory = [] } = body;

  if (!place || !message) {
    return NextResponse.json(
      { error: 'Place and message are required' },
      { status: 400 }
    );
  }

  try {
    // Build the system prompt with place context
    const systemPrompt = PLACE_CHAT_SYSTEM_PROMPT
      .replace('{placeName}', place.name || 'this place')
      .replace('{categories}', (place.categories || []).join(', ') || 'General')
      .replace('{description}', place.description || 'A popular destination');

    // Build messages array with conversation history
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    conversationHistory.forEach((msg: { role: string; content: string }) => {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    });

    // Add the current message
    messages.push({ role: 'user', content: message });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    return NextResponse.json({ response: content });
  } catch (error) {
    console.error('Place chat error:', error);
    // Return a fallback response
    return NextResponse.json({
      response: `I'd be happy to help you learn more about ${place.name}! This ${
        place.categories?.[0] || 'destination'
      } is a great choice for your trip. Feel free to ask me about visiting hours, tips for your visit, what to expect, or anything else you'd like to know!`,
    });
  }
}

async function handleChatMessage(body: any) {
  const {
    sessionId,
    city,
    country,
    travelerProfile,
    durationDays,
    message,
    alreadyRecommendedPlaceIds = [],
    places = [],
  } = body;

  if (!city || !message) {
    return NextResponse.json(
      { error: 'City and message are required' },
      { status: 400 }
    );
  }

  try {
    // ALWAYS search for videos in parallel with AI response
    // AI will generate optimized search query and filter by relevance
    console.log(`[Videos] Auto searching for: "${message}" in ${city}`);
    const videoPromise = searchVideos({
      query: message,
      location: city,
      country,
      travelerType: travelerProfile,
    });

    // Build context for the AI
    const context = {
      city,
      travelerProfile: travelerProfile || 'solo',
      durationDays: durationDays || 2,
      places: places.filter((p: any) => !alreadyRecommendedPlaceIds.includes(p.id)),
      alreadyRecommended: alreadyRecommendedPlaceIds,
      userMessage: message,
    };

    const [aiResponse, videoResult] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: TRAVEL_SYSTEM_PROMPT },
          {
            role: 'user',
            content: JSON.stringify(context),
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
      videoPromise,
    ]);

    const content = aiResponse.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);

    // Enrich items with place data
    if (parsed.items) {
      parsed.items = parsed.items.map((item: any) => {
        const place = places.find((p: any) => p.id === item.placeId);
        return {
          ...item,
          placeName: place?.name || item.placeName,
          placeImage: place?.imageUrl,
        };
      });
    }

    // Include videos in response
    const videos = videoResult.success ? videoResult.data : [];
    console.log(`[Videos] Response includes ${videos.length} videos`);

    return NextResponse.json({
      message: parsed.summary,
      structured: parsed,
      videos,
    });
  } catch (error) {
    console.error('Chat message error:', error);
    return NextResponse.json({
      message: `I'd love to help you explore ${city}! Based on your preferences, I recommend starting with the most popular attractions and working your way to hidden gems. What specific type of experience are you looking for?`,
      structured: {
        title: `Exploring ${city}`,
        summary: `Let me help you discover the best of ${city}.`,
        items: places.slice(0, 3).map((p: any, i: number) => ({
          placeId: p.id,
          placeName: p.name,
          headline: `Discover ${p.name}`,
          whyItFits: [
            `Highly rated with ${p.rating} stars`,
            `Popular ${p.categories?.[0] || 'destination'}`,
            'Recommended by travelers',
          ],
          duration: '1-2 hrs',
          bestTime: 'Anytime',
          priority: i + 1,
        })),
        followUpSuggestions: [
          `What's the best food in ${city}?`,
          `Any romantic spots?`,
          `Hidden gems nearby?`,
        ],
      },
      videos: [],
    });
  }
}
