import type { Event, ToolResult } from '@/types';

/**
 * Events API Integration
 * Uses Ticketmaster Discovery API
 * Requires TICKETMASTER_API_KEY environment variable
 */

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

/**
 * Category mappings for Ticketmaster
 */
const CATEGORY_MAPPINGS: Record<string, string> = {
  all: '',
  music: 'KZFzniwnSyZfZ7v7nJ',
  sports: 'KZFzniwnSyZfZ7v7nE',
  arts: 'KZFzniwnSyZfZ7vAvE',
  family: 'KZFzniwnSyZfZ7v7n1',
  food: '', // Not a Ticketmaster category, handled separately
};

/**
 * Search for events in a location
 */
export async function searchEvents(params: {
  location: string;
  dates?: { start: string; end: string };
  category?: string;
}): Promise<ToolResult<Event[]>> {
  if (!TICKETMASTER_API_KEY) {
    // Return mock data if API key not configured
    return {
      success: true,
      data: [],
      sources: [
        {
          url: 'https://www.ticketmaster.com',
          title: 'Events API Configuration Required',
          snippet: 'Ticketmaster API not configured. Set TICKETMASTER_API_KEY in environment variables.',
          timestamp: new Date().toISOString(),
          confidence: 0,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { location, dates, category = 'all' } = params;

    const searchParams = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      city: location,
      size: '20',
      sort: 'date,asc',
    });

    // Add date filters if provided
    if (dates) {
      searchParams.append('startDateTime', `${dates.start}T00:00:00Z`);
      searchParams.append('endDateTime', `${dates.end}T23:59:59Z`);
    }

    // Add category filter
    if (category !== 'all' && CATEGORY_MAPPINGS[category]) {
      searchParams.append('classificationId', CATEGORY_MAPPINGS[category]);
    }

    const url = `${TICKETMASTER_BASE_URL}/events.json?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `Events API error: ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();

    if (!data._embedded?.events) {
      return {
        success: true,
        data: [],
        sources: [],
        timestamp: new Date().toISOString(),
      };
    }

    const events: Event[] = data._embedded.events.map((event: any) => {
      const venue = event._embedded?.venues?.[0];
      const priceRange = event.priceRanges?.[0];

      return {
        id: event.id,
        name: event.name,
        date: event.dates.start.localDate,
        venue: venue?.name || 'Venue TBD',
        price: priceRange ? priceRange.min : undefined,
        url: event.url,
        category: event.classifications?.[0]?.segment?.name || 'Event',
      };
    });

    return {
      success: true,
      data: events,
      sources: [
        {
          url: 'https://www.ticketmaster.com',
          title: 'Ticketmaster Events',
          snippet: `Found ${events.length} events in ${location}`,
          timestamp: new Date().toISOString(),
          confidence: 0.9,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Events search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Format events for display
 */
export function formatEvents(events: Event[]): string {
  if (events.length === 0) {
    return 'No events found for the specified dates and location.';
  }

  let formatted = `Found ${events.length} upcoming events:\n\n`;

  events.forEach((event, index) => {
    const date = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    formatted += `${index + 1}. **${event.name}** (${event.category})\n`;
    formatted += `   Date: ${date}\n`;
    formatted += `   Venue: ${event.venue}\n`;
    if (event.price) {
      formatted += `   From $${event.price}\n`;
    }
    formatted += `   ${event.url}\n\n`;
  });

  return formatted;
}
