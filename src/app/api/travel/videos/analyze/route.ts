import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSubtitles } from 'youtube-caption-extractor';
import type { VideoAnalysis, VideoPlace } from '@/types/video';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory cache for video analysis
const analysisCache = new Map<string, { data: VideoAnalysis; expiresAt: number }>();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * POST /api/travel/videos/analyze
 * Analyze video content to extract summary and places
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, title, description, cityName } = body;

    if (!videoId || !title || !cityName) {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, title, cityName' },
        { status: 400 }
      );
    }

    const cacheKey = `analysis:${videoId}`;

    // Check cache first
    const cached = analysisCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
      });
    }

    console.log(`[VideoAnalysis] Starting analysis for videoId: ${videoId}, title: ${title}`);

    // Fetch video transcript/captions using youtube-caption-extractor
    let transcriptText = '';
    try {
      console.log(`[VideoAnalysis] Fetching captions for: ${videoId}`);

      // Try fetching captions - first try English, then auto-detect
      const subtitles = await getSubtitles({ videoID: videoId, lang: 'en' });

      console.log(`[VideoAnalysis] Captions found: ${subtitles?.length || 0} segments`);

      if (subtitles && subtitles.length > 0) {
        // Combine all caption segments, filtering out [Music] tags
        transcriptText = subtitles
          .map((s: { text: string }) => s.text)
          .filter((text: string) => !text.match(/^\[.*\]$/)) // Filter out [Music], [Applause], etc.
          .join(' ')
          .slice(0, 8000); // Allow more text for comprehensive analysis
        console.log(`[VideoAnalysis] Transcript text length: ${transcriptText.length}`);
        console.log(`[VideoAnalysis] Transcript preview: ${transcriptText.slice(0, 300)}...`);
      } else {
        console.log(`[VideoAnalysis] No captions found for: ${videoId}`);
      }
    } catch (e: unknown) {
      const error = e as Error;
      console.log(`[VideoAnalysis] Caption error for ${videoId}:`, error.message);
    }

    // Combine title, description, and transcript for analysis
    const content = `Title: ${title}

Description: ${description || 'No description available'}

Video Transcript/Captions:
${transcriptText || 'Transcript not available'}`;

    // Build the AI prompt based on whether we have transcript
    const hasTranscript = transcriptText.length > 100;

    const systemPrompt = hasTranscript
      ? `You are a travel expert analyzing a YouTube video about ${cityName}.

YOUR TASK: Extract a comprehensive summary, key highlights, and specific places from the video transcript.

Respond in JSON format with this exact structure:
{
  "summary": "3-4 sentence summary that includes: (1) specific neighborhoods/areas covered, (2) the creator's perspective (local/tourist/food-focused/budget), (3) what makes this video unique, (4) practical info if mentioned",
  "highlights": [
    "First key insight or recommendation from the video (be specific)",
    "Second insight or tip (quote the creator if possible)",
    "Third takeaway or unique perspective shared",
    "Fourth practical tip or insider secret (if available)"
  ],
  "places": [
    {
      "name": "Exact Place Name as mentioned",
      "type": "restaurant|attraction|hotel|landmark|other",
      "note": "WHY was this place mentioned? WHAT did they say about it? Include quotes if possible. Examples: 'Best ramen in the area according to locals', 'Hidden gem with amazing sunset views', 'Mentioned as must-visit for first-timers'"
    }
  ]
}

CRITICAL RULES:
1. PRIORITIZE places actually mentioned in the transcript with their context
2. For highlights: Extract ACTUAL tips/recommendations from the video, not generic travel advice
3. For place notes: Include specific details from the transcript - what makes it special, when to visit, what to try, etc.
4. Extract 3-5 highlights (specific and actionable)
5. Extract 4-8 places with detailed notes
6. Only include real places that can be found on Google Maps in ${cityName}
7. If a place is mentioned multiple times, combine all context into one comprehensive note
8. Use quotes from the transcript when they add value

EXAMPLES OF GOOD vs BAD:

GOOD Highlight: "The creator recommends visiting Tsukiji Market early morning (before 8am) to avoid crowds and get the freshest sushi"
BAD Highlight: "Discover local attractions and hidden gems"

GOOD Place Note: "Featured as the creator's favorite ramen spot - known for rich tonkotsu broth and long lines (arrive before 11am)"
BAD Place Note: "A popular restaurant"

GOOD Summary: "This video guides viewers through Kichijoji neighborhood in Tokyo, showcasing it as a local's favorite with a quieter atmosphere than central Tokyo. The creator, a Tokyo resident, highlights family-friendly parks, vintage shops, and affordable dining options within walking distance of the station."
BAD Summary: "This video explores Tokyo and showcases various points of interest."`
      : `You are a travel expert analyzing a YouTube video about ${cityName}.

YOUR TASK: Based on the video title and your knowledge of ${cityName}, infer the likely content, highlights, and places covered.

Respond in JSON format with this exact structure:
{
  "summary": "3-4 sentence summary inferring: (1) what areas/neighborhoods this likely covers based on title, (2) the probable focus (tourist spots/hidden gems/food/culture), (3) target audience",
  "highlights": [
    "First likely key point based on title and your knowledge",
    "Second probable insight or tip",
    "Third expected takeaway or recommendation"
  ],
  "places": [
    {
      "name": "Specific Place Name",
      "type": "restaurant|attraction|hotel|landmark|other",
      "note": "Why this place would likely be covered in a video with this title"
    }
  ]
}

INFERENCE EXAMPLES:
- Title: "10 Must Visit Places in Las Vegas" → Bellagio fountains, Fremont Street, The Strip, High Roller
- Title: "Hidden Gems in Tokyo" → TeamLab Borderless, Golden Gai, Yanaka district, local izakayas
- Title: "Best Street Food in Bangkok" → Yaowarat (Chinatown), Khao San Road, Chatuchak Market

RULES:
1. Highlights should reflect what videos with this title typically cover
2. For "top 10" videos: list most famous tourist attractions
3. For "hidden gems" videos: list lesser-known local favorites
4. For "food" videos: list famous restaurants and food districts
5. Provide 3-4 highlights and 4-8 places
6. Place notes should explain why these places fit this video topic
7. All places must be real and findable on Google Maps in ${cityName}`;

    // Use OpenAI to extract summary and places
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5, // Lower temperature for more accurate extraction
      max_tokens: 1500, // Increased to accommodate longer highlights and place notes
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    console.log(`[VideoAnalysis] Had transcript: ${hasTranscript}, AI extracted ${result.places?.length || 0} places:`, result.places);

    const analysis: VideoAnalysis = {
      videoId,
      summary: result.summary || 'This video explores travel destinations and experiences.',
      highlights: (result.highlights || []).slice(0, 5), // Add highlights extracted from transcript
      places: (result.places || []).slice(0, 8), // Now includes 'note' field from AI
      analyzedAt: Date.now(),
    };

    // Cache the result
    analysisCache.set(cacheKey, {
      data: analysis,
      expiresAt: Date.now() + CACHE_TTL,
    });

    // Cleanup old cache entries (simple LRU-like cleanup)
    if (analysisCache.size > 200) {
      const entries = Array.from(analysisCache.entries());
      entries
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
        .slice(0, 50)
        .forEach(([key]) => analysisCache.delete(key));
    }

    return NextResponse.json({
      ...analysis,
      cached: false,
    });
  } catch (error) {
    console.error('Video analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze video',
        summary: 'Unable to analyze this video at the moment.',
        places: [],
      },
      { status: 200 } // Return 200 with empty data for graceful degradation
    );
  }
}
