import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { VideoAnalysis, VideoPlaceWithNote } from '@/types/video';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalyzeVideoRequest {
  videoId: string;
  videoTitle: string;
  videoDescription: string;
  destination: string;
}

/**
 * POST /api/chat/analyze-video
 * Analyzes a YouTube video to extract summary, highlights, and places mentioned
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeVideoRequest = await request.json();
    const { videoId, videoTitle, videoDescription, destination } = body;

    if (!videoId || !videoTitle) {
      return NextResponse.json(
        { error: 'videoId and videoTitle are required' },
        { status: 400 }
      );
    }

    // Use GPT-4o-mini to analyze the video content
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a travel video analyst. Analyze YouTube video titles and descriptions to extract useful travel information.

Given a video about ${destination || 'a travel destination'}, extract:
1. A 2-3 sentence summary of what the video likely covers
2. 3-5 key highlights or takeaways (practical tips for travelers)
3. Places mentioned (restaurants, attractions, hotels, landmarks) with brief notes

Output ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence summary of video content",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "places": [
    {"name": "Place Name", "type": "restaurant|attraction|hotel|landmark|other", "note": "Brief note about this place from video context"}
  ]
}

Rules:
- Be concise but informative
- Extract real place names if mentioned in title/description
- If no specific places are mentioned, return empty places array
- Highlights should be actionable travel tips
- Type must be one of: restaurant, attraction, hotel, landmark, other`
        },
        {
          role: 'user',
          content: `Analyze this travel video:

Title: ${videoTitle}

Description: ${videoDescription || 'No description available'}

Destination: ${destination || 'Unknown'}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to analyze video' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const parsed = JSON.parse(content) as {
      summary: string;
      highlights: string[];
      places: VideoPlaceWithNote[];
    };

    const analysis: VideoAnalysis = {
      videoId,
      summary: parsed.summary || '',
      highlights: parsed.highlights || [],
      places: parsed.places || [],
      analyzedAt: Date.now(),
    };

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('[Analyze Video] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze video' },
      { status: 500 }
    );
  }
}
