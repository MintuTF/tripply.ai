import type { SearchResult, ToolResult } from '@/types';

/**
 * Web Search Integration
 * Uses Google Programmable Search Engine (formerly Custom Search)
 * Requires GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID
 */

const SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

/**
 * Search the web for travel information
 */
export async function searchWeb(params: {
  query: string;
  num_results?: number;
}): Promise<ToolResult<SearchResult[]>> {
  if (!SEARCH_API_KEY || !SEARCH_ENGINE_ID) {
    // Fallback: Return a helpful message if API keys aren't configured
    return {
      success: true,
      data: [],
      sources: [
        {
          url: 'https://google.com/search?q=' + encodeURIComponent(params.query),
          title: 'Search Configuration Required',
          snippet: 'Google Search API not configured. Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID in environment variables.',
          timestamp: new Date().toISOString(),
          confidence: 0,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { query, num_results = 5 } = params;

    const searchParams = new URLSearchParams({
      key: SEARCH_API_KEY,
      cx: SEARCH_ENGINE_ID,
      q: query,
      num: Math.min(num_results, 10).toString(), // Google CSE max is 10
    });

    const url = `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `Search API error: ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return {
        success: true,
        data: [],
        sources: [],
        timestamp: new Date().toISOString(),
      };
    }

    const results: SearchResult[] = data.items.map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet || '',
      source: new URL(item.link).hostname.replace('www.', ''),
      timestamp: new Date().toISOString(),
    }));

    return {
      success: true,
      data: results,
      sources: results.map((r) => ({
        url: r.url,
        title: r.title,
        snippet: r.snippet,
        timestamp: r.timestamp,
        confidence: 0.8,
      })),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Web search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Format search results for display
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.';
  }

  let formatted = `Found ${results.length} results:\n\n`;

  results.forEach((result, index) => {
    formatted += `${index + 1}. **${result.title}**\n`;
    formatted += `   ${result.snippet}\n`;
    formatted += `   Source: ${result.source} - ${result.url}\n\n`;
  });

  return formatted;
}
