import type { ToolResult } from '@/types';
import type { YouTubeVideo } from '@/types/video';
import OpenAI from 'openai';
import { filterByCity, filterByAIRelevance } from '@/lib/video';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Video search tool for AI chat
 * Searches YouTube for travel shorts related to a destination
 */

interface VideoSearchParams {
  query: string;
  location: string;
  country?: string;
  travelerType?: string;
}

/**
 * Use AI to generate an optimized YouTube search query
 * Handles typos, understands context, and creates search-friendly queries
 */
async function generateVideoSearchQuery(
  userMessage: string,
  location: string,
  country?: string,
  travelerType?: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You generate optimized YouTube search queries for travel videos.
Given a user's travel question, create a SHORT search query (5-8 words max) that will find relevant YouTube Shorts.

Rules:
- Include the location name first
- Fix any typos in the user's message
- Focus on the main topic - be SPECIFIC to what user is asking
- For accommodation/hotels/where to stay: use keywords like "where to stay", "neighborhoods", "hotels", "accommodation", "best areas"
- For things to do: use keywords like "things to do", "activities", "attractions"
- For food: use keywords like "restaurants", "food", "street food", "cafes"
- If traveler type is provided (family, couple, solo), include relevant keywords
- Add "#shorts" at the end
- Keep it concise for YouTube search
- Output ONLY the search query, nothing else

Examples:
- "parks and museums" + family in Tokyo → "Tokyo family parks museums kids #shorts"
- "BEST RESTAUNT FOR COUPLE" in Tokyo → "Tokyo romantic restaurants date night #shorts"
- "must see places" in Paris → "Paris must see attractions travel #shorts"
- "hidden gems food" in Bangkok → "Bangkok hidden gem street food #shorts"
- "what to do with kids" in London → "London family activities kids travel #shorts"
- "nightlife clubs" in Miami → "Miami nightlife best clubs bars #shorts"
- "best areas to stay" in Tokyo → "Tokyo where to stay best neighborhoods hotels #shorts"
- "where should I stay" in Paris → "Paris best areas neighborhoods accommodation guide #shorts"
- "hotel recommendations" in Bali → "Bali where to stay hotels areas guide #shorts"`
        },
        {
          role: 'user',
          content: `User question: "${userMessage}"
Location: ${location}${country ? `, ${country}` : ''}${travelerType ? `\nTraveler type: ${travelerType}` : ''}

Generate YouTube search query:`
        }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    const generatedQuery = response.choices[0]?.message?.content?.trim();

    // Ensure query has #shorts if AI forgot
    if (generatedQuery && !generatedQuery.includes('#shorts')) {
      return `${generatedQuery} #shorts`;
    }

    return generatedQuery || `${location} travel guide #shorts`;
  } catch (error) {
    console.error('[Videos] AI query generation failed:', error);
    // Fallback to basic query if AI fails
    return `${location} travel guide #shorts`;
  }
}

/**
 * Extract 1-5 specific search titles from user query using AI
 * For complex queries, generates multiple focused search topics
 *
 * @param userQuery - The user's original question
 * @param location - City or destination name
 * @returns Array of optimized YouTube search queries (1-5 items)
 */
export async function extractSearchTitles(
  userQuery: string,
  location: string
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You extract YouTube search queries from travel questions.
Given a user's travel question, extract 1-5 specific search topics.
Each topic should be a focused YouTube search query for MEDIUM-LENGTH travel guide videos (5-20 min).

Rules:
- Generate 1 title for simple/specific queries
- Generate 2-3 titles for moderate queries
- Generate 4-5 titles for complex multi-topic queries
- Include location in each title
- Focus on TRAVEL/TOURIST content (NOT residential, NOT expat life)
- DO NOT add #shorts - these are for longer guide videos
- Each title should be distinct and search different content
- Output as JSON array of strings

Examples:
User: "Best restaurants in Tokyo"
Location: Tokyo
Output: ["Tokyo best restaurants food guide"]

User: "Best areas to stay in Tokyo and what to do there"
Location: Tokyo
Output: ["Tokyo best areas stay tourists hotels", "Tokyo neighborhoods travel guide", "Tokyo things to do attractions"]

User: "I want to know about hotels, nightlife, and hidden gems in Bali"
Location: Bali
Output: ["Bali best hotels where to stay", "Bali nightlife bars clubs guide", "Bali hidden gems off beaten path", "Bali secret spots tourists"]

User: "Where should I stay in Paris"
Location: Paris
Output: ["Paris best areas stay tourists", "Paris hotel neighborhoods guide"]

Output ONLY the JSON array, nothing else.`
        },
        {
          role: 'user',
          content: `User question: "${userQuery}"
Location: ${location}

Extract search titles:`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const content = response.choices[0]?.message?.content?.trim() || '[]';
    console.log(`[Videos] AI extracted titles raw: ${content}`);

    // Parse JSON array
    const titles = JSON.parse(content) as string[];

    // Validate and limit to 5
    if (Array.isArray(titles) && titles.length > 0) {
      return titles.slice(0, 5);
    }

    // Fallback
    return [`${location} travel guide`];
  } catch (error) {
    console.error('[Videos] extractSearchTitles failed:', error);
    return [`${location} travel guide`];
  }
}

/**
 * Search for travel videos about a destination
 * Uses AI to generate optimized YouTube search queries
 *
 * @param params.query - User's search query (e.g., "best restaurants for couple")
 * @param params.location - City or destination name
 */
export async function searchVideos(
  params: VideoSearchParams
): Promise<ToolResult<YouTubeVideo[]>> {
  const { query, location, country, travelerType } = params;

  console.log(`[Videos] User query: "${query}" in ${location}${country ? `, ${country}` : ''}${travelerType ? ` (${travelerType})` : ''}`);

  try {
    // Use AI to generate an optimized search query
    const searchQuery = await generateVideoSearchQuery(query, location, country, travelerType);
    console.log(`[Videos] AI generated query: "${searchQuery}"`);

    // Generate unique ID for this search
    const searchId = `chat-${location.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Use the existing video API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const url = `${baseUrl}/api/travel/videos?type=collection&name=${encodeURIComponent(searchQuery)}&id=${encodeURIComponent(searchId)}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('[Videos] API error:', response.status);
      return {
        success: false,
        data: [],
        error: `Video API error: ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();

    if (data.error && !data.videos?.length) {
      console.log('[Videos] API returned error:', data.error);
      return {
        success: false,
        data: [],
        error: data.error,
        timestamp: new Date().toISOString(),
      };
    }

    // Fetch more videos initially to have enough after filtering
    const videos = data.videos?.slice(0, 10) || [];

    // Step 1: Filter by city name
    const cityFiltered = filterByCity(videos, location);

    // Step 2: AI ranks and filters by relevance to user query
    const finalVideos = await filterByAIRelevance(cityFiltered, query, location);

    console.log(`[Videos] Found ${videos.length} videos, ${cityFiltered.length} in city, returning ${finalVideos.length} AI-ranked for "${location}"`);

    return {
      success: true,
      data: finalVideos,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Videos] Search error:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to search videos',
      timestamp: new Date().toISOString(),
    };
  }
}
