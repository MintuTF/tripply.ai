import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSubtitles } from 'youtube-caption-extractor';
import type { VideoDeepAnalysis, VideoPlaceWithNote } from '@/types/video';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory cache for deep video analysis
const deepAnalysisCache = new Map<string, { data: VideoDeepAnalysis; expiresAt: number }>();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

interface DeepAnalyzeRequest {
  videoId: string;
  title: string;
  description?: string;
  destination: string;
  userQuery: string; // Context for what user is asking about
}

/**
 * POST /api/chat/analyze-video-deep
 * Deep analysis of video transcript to extract actionable travel insights
 */
export async function POST(request: NextRequest) {
  try {
    const body: DeepAnalyzeRequest = await request.json();
    const { videoId, title, description, destination, userQuery } = body;

    if (!videoId || !title) {
      return NextResponse.json(
        { error: 'videoId and title are required' },
        { status: 400 }
      );
    }

    // Use destination or infer from video title
    const effectiveDestination = destination || 'this destination';

    const cacheKey = `deep-analysis:${videoId}:${userQuery.slice(0, 50)}`;

    // Check cache first
    const cached = deepAnalysisCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`[DeepAnalysis] Cache hit for: ${videoId}`);
      return NextResponse.json({
        ...cached.data,
        cached: true,
      });
    }

    console.log(`[DeepAnalysis] Starting deep analysis for: ${title}`);

    // Step 1: Fetch video transcript
    let transcriptText = '';
    try {
      console.log(`[DeepAnalysis] Fetching captions for: ${videoId}`);

      const subtitles = await getSubtitles({ videoID: videoId, lang: 'en' });

      if (subtitles && subtitles.length > 0) {
        transcriptText = subtitles
          .map((s: { text: string }) => s.text)
          .filter((text: string) => !text.match(/^\[.*\]$/)) // Filter [Music], etc.
          .join(' ')
          .slice(0, 8000); // More text for deeper analysis

        console.log(`[DeepAnalysis] Transcript length: ${transcriptText.length} chars`);
      } else {
        console.log(`[DeepAnalysis] No captions found for: ${videoId}`);
      }
    } catch (e: unknown) {
      const error = e as Error;
      console.log(`[DeepAnalysis] Caption error: ${error.message}`);
    }

    // Step 2: AI Analysis with transcript
    const hasTranscript = transcriptText.length > 100;

    const content = `Video Title: ${title}

Description: ${description || 'No description'}

${hasTranscript ? `Transcript:\n${transcriptText}` : 'No transcript available'}`;

    const systemPrompt = `You are a travel expert extracting actionable advice from a YouTube video about ${effectiveDestination}.
User is asking about: "${userQuery}"

${hasTranscript ? 'Analyze the video TRANSCRIPT to extract specific advice mentioned.' : 'Based on the title and your travel knowledge, provide likely advice this video would cover.'}

Extract and respond in JSON:
{
  "summary": "2-3 sentence summary focusing on what's relevant to user's question",
  "thingsToDo": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3"
  ],
  "thingsToAvoid": [
    "Specific warning or mistake to avoid 1",
    "Specific warning or mistake to avoid 2"
  ],
  "tips": [
    "Practical travel tip 1",
    "Practical travel tip 2",
    "Practical travel tip 3"
  ],
  "places": [
    {"name": "Place Name", "type": "restaurant|attraction|hotel|landmark|other", "note": "Why it was mentioned/recommended"}
  ]
}

RULES:
1. thingsToDo: 3-5 specific, actionable recommendations for tourists
2. thingsToAvoid: 2-4 warnings, common mistakes, or things to skip
3. tips: 3-5 practical tips (booking, timing, money-saving, etc.)
4. places: Extract real place names mentioned, with why they're recommended
5. Be SPECIFIC - not generic advice. Use actual info from transcript if available.
6. Focus on advice relevant to: "${userQuery}"
7. All arrays must have at least 2 items`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 1000,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    console.log(`[DeepAnalysis] Extracted: ${result.thingsToDo?.length || 0} dos, ${result.thingsToAvoid?.length || 0} don'ts, ${result.tips?.length || 0} tips, ${result.places?.length || 0} places`);

    const analysis: VideoDeepAnalysis = {
      videoId,
      summary: result.summary || 'Travel insights from this video.',
      thingsToDo: result.thingsToDo || [],
      thingsToAvoid: result.thingsToAvoid || [],
      tips: result.tips || [],
      places: (result.places || []) as VideoPlaceWithNote[],
      analyzedAt: Date.now(),
    };

    // Cache the result
    deepAnalysisCache.set(cacheKey, {
      data: analysis,
      expiresAt: Date.now() + CACHE_TTL,
    });

    // Cleanup old cache entries
    if (deepAnalysisCache.size > 200) {
      const entries = Array.from(deepAnalysisCache.entries());
      entries
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
        .slice(0, 50)
        .forEach(([key]) => deepAnalysisCache.delete(key));
    }

    return NextResponse.json({
      ...analysis,
      cached: false,
      hasTranscript,
    });
  } catch (error) {
    console.error('[DeepAnalysis] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze video',
        summary: 'Unable to analyze this video.',
        thingsToDo: [],
        thingsToAvoid: [],
        tips: [],
        places: [],
      },
      { status: 200 } // Graceful degradation
    );
  }
}
