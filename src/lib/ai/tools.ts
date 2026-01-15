import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Tool definitions for OpenAI function calling
 * These define the interface between the AI and external data sources
 */

export const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_web',
      description:
        'Search the web for travel information, destination guides, and general queries. Use this for broad research questions.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query',
          },
          num_results: {
            type: 'number',
            description: 'Number of results to return (default: 5)',
            default: 5,
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description:
        'Get weather forecast and historical averages for a location. Returns 10-day forecast and climate data.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name or coordinates (e.g., "Paris" or "48.8566,2.3522")',
          },
          dates: {
            type: 'object',
            properties: {
              start: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              end: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
            },
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_places',
      description:
        'Search for hotels, restaurants, attractions, or other points of interest. Returns detailed information including ratings, prices, and photos.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'What to search for (e.g., "hotels in Paris")',
          },
          location: {
            type: 'string',
            description: 'Location to search in',
          },
          type: {
            type: 'string',
            enum: ['hotel', 'restaurant', 'attraction', 'cafe', 'bar', 'all'],
            description: 'Type of place to search for',
          },
          radius: {
            type: 'number',
            description: 'Search radius in meters (default: 5000)',
            default: 5000,
          },
          price_level: {
            type: 'array',
            items: {
              type: 'number',
              enum: [1, 2, 3, 4],
            },
            description: 'Price levels to filter by (1=cheap, 4=expensive)',
          },
          min_rating: {
            type: 'number',
            description: 'Minimum rating (1-5)',
          },
        },
        required: ['query', 'location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_place_details',
      description:
        'Get detailed information about a specific place including opening hours, photos, reviews, and amenities.',
      parameters: {
        type: 'object',
        properties: {
          place_id: {
            type: 'string',
            description: 'Google Places ID',
          },
        },
        required: ['place_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_events',
      description:
        'Search for events, festivals, concerts, and activities happening in a location during specific dates.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City or venue name',
          },
          dates: {
            type: 'object',
            properties: {
              start: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              end: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
            },
          },
          category: {
            type: 'string',
            enum: ['all', 'music', 'sports', 'arts', 'family', 'food'],
            description: 'Event category',
            default: 'all',
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_travel_time',
      description:
        'Calculate travel time and distance between two locations, including different transport modes.',
      parameters: {
        type: 'object',
        properties: {
          origin: {
            type: 'string',
            description: 'Starting location (address or coordinates)',
          },
          destination: {
            type: 'string',
            description: 'Ending location (address or coordinates)',
          },
          mode: {
            type: 'string',
            enum: ['driving', 'walking', 'transit', 'bicycling'],
            description: 'Transportation mode',
            default: 'walking',
          },
          departure_time: {
            type: 'string',
            description: 'Departure time in ISO format (optional)',
          },
        },
        required: ['origin', 'destination'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_hotel_offers',
      description:
        'Search for hotel offers with real-time pricing and availability. Use this when users ask about hotels, accommodations, or places to stay. Returns hotels with prices, ratings, and amenities.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'City name (e.g., "Seattle", "Paris", "Tokyo")',
          },
          check_in_date: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format',
          },
          check_out_date: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format',
          },
          adults: {
            type: 'integer',
            description: 'Number of adult guests (default: 2)',
            default: 2,
          },
          max_results: {
            type: 'integer',
            description: 'Maximum number of hotels to return (default: 10)',
            default: 10,
          },
        },
        required: ['city', 'check_in_date', 'check_out_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_reddit',
      description:
        'Search Reddit r/travel for travel tips, recommendations, and advice about a destination. Use this when users ask for local tips, hidden gems, travel advice, or want to know what other travelers recommend.',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            description: 'The destination city or country to search for (e.g., "Tokyo", "Italy", "Barcelona")',
          },
          sort: {
            type: 'string',
            enum: ['relevance', 'hot', 'top', 'new'],
            description: 'How to sort results. Use "top" for most upvoted, "relevance" for best matches',
            default: 'relevance',
          },
          time: {
            type: 'string',
            enum: ['week', 'month', 'year', 'all'],
            description: 'Time filter for posts. Use "year" for recent tips, "all" for comprehensive coverage',
            default: 'year',
          },
        },
        required: ['destination'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_videos',
      description:
        'Search for short travel videos about a destination. ALWAYS use this tool when users ask about: attractions, activities, food, parks, museums, restaurants, beaches, nightlife, places to visit, things to do, "interested in", "more about", or any experiential/visual content. Returns YouTube travel shorts with visual content.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for videos (e.g., "street food", "parks and museums", "family activities")',
          },
          location: {
            type: 'string',
            description: 'City or destination name (e.g., "Tokyo", "Paris")',
          },
          country: {
            type: 'string',
            description: 'Country name for more accurate results (e.g., "Japan", "France")',
          },
          travelerType: {
            type: 'string',
            description: 'Type of traveler to tailor video results (e.g., "family", "couple", "solo", "friends")',
          },
          category: {
            type: 'string',
            enum: ['food', 'attractions', 'activities', 'nightlife', 'hidden_gems', 'general'],
            description: 'Category of videos to search for',
            default: 'general',
          },
        },
        required: ['query', 'location'],
      },
    },
  },
];

/**
 * Get tool by name
 */
export function getTool(name: string): ChatCompletionTool | undefined {
  return TOOLS.find((tool) => tool.function.name === name);
}

/**
 * Type guard for tool function parameters
 */
export function isValidToolCall(
  name: string,
  parameters: any
): parameters is Record<string, any> {
  const tool = getTool(name);
  if (!tool) return false;

  // Basic validation - in production, use a proper schema validator like Zod
  const required = (tool.function.parameters as any).required || [];
  return required.every((key: string) => parameters[key] !== undefined);
}
