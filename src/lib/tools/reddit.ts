import type { ToolResult, Citation } from '@/types';

/**
 * Reddit API integration for travel tips
 * Uses OAuth2 client credentials flow
 */

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  created_utc: number;
  author: string;
}

interface RedditSearchParams {
  destination: string;
  sort?: 'relevance' | 'hot' | 'top' | 'new';
  time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  limit?: number;
}

// Token cache for OAuth
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get OAuth access token from Reddit
 * Implements client_credentials grant type
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const userAgent = process.env.REDDIT_USER_AGENT || 'voyagr-travel-app/1.0';

  if (!clientId || !clientSecret) {
    throw new Error('Reddit API credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Reddit] Token error:', response.status, errorText);
    throw new Error(`Reddit auth failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('No access token in response');
  }

  accessToken = data.access_token;
  // Set expiry 1 minute before actual expiry for safety
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

  console.log('[Reddit] Got new access token, expires in', data.expires_in, 'seconds');
  return accessToken;
}

/**
 * Search Reddit r/travel for travel tips and recommendations
 *
 * @param params.destination - The destination to search for (e.g., "Tokyo", "Paris")
 * @param params.sort - How to sort results (relevance, hot, top, new)
 * @param params.time - Time filter for posts (week, month, year, all)
 * @param params.limit - Max number of posts to return (default: 10)
 */
export async function searchReddit(
  params: RedditSearchParams
): Promise<ToolResult<RedditPost[]>> {
  const {
    destination,
    sort = 'relevance',
    time = 'year',
    limit = 10
  } = params;

  console.log(`[Reddit] Searching r/travel for: ${destination}`);

  try {
    const token = await getAccessToken();
    const userAgent = process.env.REDDIT_USER_AGENT || 'voyagr-travel-app/1.0';

    // Build search query - include destination and travel-related terms
    const searchQuery = encodeURIComponent(`${destination} travel tips`);
    const url = `https://oauth.reddit.com/r/travel/search?q=${searchQuery}&restrict_sr=on&sort=${sort}&t=${time}&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': userAgent,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Reddit] Search error:', response.status, errorText);
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse Reddit's response format
    const posts: RedditPost[] = (data.data?.children || [])
      .filter((child: any) => child.kind === 't3') // t3 = link/post
      .map((child: any) => ({
        id: child.data.id,
        title: child.data.title,
        selftext: child.data.selftext?.substring(0, 1500) || '', // Limit text length
        score: child.data.score,
        num_comments: child.data.num_comments,
        url: child.data.url,
        permalink: `https://reddit.com${child.data.permalink}`,
        created_utc: child.data.created_utc,
        author: child.data.author,
      }));

    console.log(`[Reddit] Found ${posts.length} posts for "${destination}"`);

    // Build citations from top posts
    const sources: Citation[] = posts.slice(0, 5).map(post => ({
      url: post.permalink,
      title: post.title,
      snippet: post.selftext
        ? post.selftext.substring(0, 200) + (post.selftext.length > 200 ? '...' : '')
        : `${post.score} upvotes · ${post.num_comments} comments`,
      timestamp: new Date(post.created_utc * 1000).toISOString(),
    }));

    return {
      success: true,
      data: posts,
      sources,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Reddit] Search error:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to search Reddit',
      timestamp: new Date().toISOString(),
    };
  }
}
