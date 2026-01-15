import type { YouTubeVideo } from '@/types/video';

// Lazy-load OpenAI client only when needed (server-side only)
let openaiClient: import('openai').default | null = null;

async function getOpenAI() {
  if (!openaiClient) {
    const OpenAI = (await import('openai')).default;
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * Video filtering utilities
 * Centralizes all video filtering logic used by Chat and Explore
 */

/**
 * Filter videos to only include those that mention the city name
 * in their title or description
 *
 * @param videos - Array of YouTube videos to filter
 * @param city - City name to search for
 * @returns Filtered array of relevant videos
 */
export function filterByCity(videos: YouTubeVideo[], city: string): YouTubeVideo[] {
  if (!city || !videos.length) return videos;

  const cityLower = city.toLowerCase();

  return videos.filter((video) => {
    const title = video.title.toLowerCase();
    const description = (video.description || '').toLowerCase();
    const text = title + ' ' + description;

    return text.includes(cityLower);
  });
}

/**
 * Filter videos by multiple keywords (any match)
 *
 * @param videos - Array of YouTube videos to filter
 * @param keywords - Keywords to search for (any match)
 * @returns Filtered array of videos matching any keyword
 */
export function filterByKeywords(
  videos: YouTubeVideo[],
  keywords: string[]
): YouTubeVideo[] {
  if (!keywords.length || !videos.length) return videos;

  const keywordsLower = keywords.map((k) => k.toLowerCase());

  return videos.filter((video) => {
    const title = video.title.toLowerCase();
    const description = (video.description || '').toLowerCase();
    const text = title + ' ' + description;

    return keywordsLower.some((keyword) => text.includes(keyword));
  });
}

/**
 * Filter videos by channel name
 *
 * @param videos - Array of YouTube videos to filter
 * @param channelName - Channel name to match
 * @returns Filtered array of videos from the specified channel
 */
export function filterByChannel(
  videos: YouTubeVideo[],
  channelName: string
): YouTubeVideo[] {
  if (!channelName || !videos.length) return videos;

  const channelLower = channelName.toLowerCase();

  return videos.filter((video) => {
    return video.channelTitle?.toLowerCase().includes(channelLower);
  });
}

/**
 * Filter and limit videos with logging
 * Commonly used pattern for both Chat and Explore
 *
 * @param videos - Array of videos to process
 * @param city - City name to filter by
 * @param limit - Maximum number of videos to return
 * @param logPrefix - Prefix for console logging (optional)
 * @returns Filtered and limited array of videos
 */
export function filterAndLimit(
  videos: YouTubeVideo[],
  city: string,
  limit: number = 4,
  logPrefix?: string
): YouTubeVideo[] {
  const originalCount = videos.length;
  const filtered = filterByCity(videos, city);
  const result = filtered.slice(0, limit);

  if (logPrefix) {
    console.log(
      `[${logPrefix}] Found ${originalCount} videos, ${filtered.length} relevant, returning ${result.length} for "${city}"`
    );
  }

  return result;
}

/**
 * Use AI to filter and rank videos by relevance to user query
 * Returns videos sorted by relevance (most relevant first)
 *
 * @param videos - Array of YouTube videos to filter
 * @param userQuery - The user's original query
 * @param location - The destination city/location
 * @param limit - Maximum number of videos to return (default: 4)
 * @returns Promise of filtered and ranked videos
 */
export async function filterByAIRelevance(
  videos: YouTubeVideo[],
  userQuery: string,
  location: string,
  limit: number = 4
): Promise<YouTubeVideo[]> {
  if (videos.length === 0) return [];
  if (videos.length <= limit) return videos; // No need to filter if at or below limit

  try {
    // Build compact video list (only titles for efficiency)
    const videoList = videos.map((v, i) => `${i}. ${v.title}`).join('\n');

    const openai = await getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You filter YouTube travel videos by STRICT relevance to the user's question.
This is a TRAVEL app - users are TOURISTS planning trips, not residents.

Given a user's travel question and video titles, return ONLY the indices of the ${limit} most relevant videos.

CRITICAL RULES:
- Return exactly ${limit} indices as comma-separated numbers (e.g., "2,5,1,7")
- Most relevant video index first
- BE STRICT about TRAVEL relevance - videos must help tourists plan trips

TRAVEL CONTEXT (very important):
- Users are TOURISTS, not residents or expats
- "where to stay" = where tourists should book hotels, NOT residential areas
- Prioritize travel guides, hotel recommendations, tourist accommodation

QUERY TYPE MATCHING:
- "where to stay" / "best areas" / "hotels" →
  ONLY select: travel accommodation guides, hotel recommendations, "best areas FOR TOURISTS"
  REJECT: "what it's like to live in X", "rich neighborhoods", residential tours, expat content

- "things to do" / "activities" → tourist activities, attractions
- "restaurants" / "food" → food guides for travelers
- "nightlife" → nightlife for tourists
- "hidden gems" → off-beaten-path spots for travelers

REJECTION RULES (strict):
- Videos about "living in" or "moving to" a city = NOT travel relevant
- "Rich/poor neighborhood" lifestyle videos = NOT travel relevant
- Real estate or property content = NOT travel relevant
- Generic walkthroughs without travel focus = low relevance
- "Things to do" videos are NOT relevant for "where to stay" questions

If fewer than ${limit} videos are truly relevant, still return ${limit} indices but put the less relevant ones last.
Output ONLY the indices, nothing else.`,
        },
        {
          role: 'user',
          content: `User question: "${userQuery}"
Location: ${location}

Videos:
${videoList}

Return the ${limit} most relevant video indices:`,
        },
      ],
      temperature: 0.1,
      max_tokens: 100, // Increased for more indices
    });

    const indicesStr = response.choices[0]?.message?.content?.trim() || '';
    console.log(`[Video Filter] AI returned indices: ${indicesStr}`);

    const indices = indicesStr
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((i) => !isNaN(i) && i >= 0 && i < videos.length);

    // Return videos in AI-ranked order
    const rankedVideos = indices.map((i) => videos[i]);

    // Fallback: if AI returned fewer than expected, add remaining videos
    if (rankedVideos.length < limit) {
      const usedIndices = new Set(indices);
      for (let i = 0; i < videos.length && rankedVideos.length < limit; i++) {
        if (!usedIndices.has(i)) {
          rankedVideos.push(videos[i]);
        }
      }
    }

    return rankedVideos.slice(0, limit);
  } catch (error) {
    console.error('[Video Filter] AI relevance filter failed:', error);
    // Fallback to first N videos
    return videos.slice(0, limit);
  }
}
