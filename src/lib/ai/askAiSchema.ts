/**
 * JSON Schema for OpenAI structured output
 * Used with response_format: { type: 'json_schema', json_schema: ... }
 */

// Category type for filtering AI results
export type AskAICategory = 'hotels' | 'restaurants' | 'activities' | 'all';

// TypeScript types for the AI response
export interface AiHotelSuggestion {
  name: string;
  city: string;
  country: string;
  notes: string;
  priceHint: '$' | '$$' | '$$$' | '$$$$';
}

export interface AiRestaurantSuggestion {
  name: string;
  city: string;
  country: string;
  foodType: string;
  notes: string;
  priceHint: '$' | '$$' | '$$$' | '$$$$';
}

export interface AiActivitySuggestion {
  name: string;
  city: string;
  country: string;
  activityType: string;
  notes: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'flexible';
}

export interface AiTravelRecommendations {
  destination: string;
  summary: string;
  hotels: AiHotelSuggestion[];
  restaurants: AiRestaurantSuggestion[];
  activities: AiActivitySuggestion[];
}

// JSON Schema for OpenAI
export const TRAVEL_RECOMMENDATIONS_SCHEMA = {
  name: 'travel_recommendations',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      destination: {
        type: 'string',
        description: 'The destination city and country (e.g., "Lisbon, Portugal")',
      },
      summary: {
        type: 'string',
        description: 'A friendly 1-2 paragraph explanation of the recommendations',
      },
      hotels: {
        type: 'array',
        description: 'List of hotel recommendations',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Hotel name',
            },
            city: {
              type: 'string',
              description: 'City where the hotel is located',
            },
            country: {
              type: 'string',
              description: 'Country where the hotel is located',
            },
            notes: {
              type: 'string',
              description: 'Brief notes about why this hotel is recommended',
            },
            priceHint: {
              type: 'string',
              enum: ['$', '$$', '$$$', '$$$$'],
              description: 'Price level indicator',
            },
          },
          required: ['name', 'city', 'country', 'notes', 'priceHint'],
          additionalProperties: false,
        },
      },
      restaurants: {
        type: 'array',
        description: 'List of restaurant recommendations',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Restaurant name',
            },
            city: {
              type: 'string',
              description: 'City where the restaurant is located',
            },
            country: {
              type: 'string',
              description: 'Country where the restaurant is located',
            },
            foodType: {
              type: 'string',
              description: 'Type of cuisine or food (e.g., "Italian", "Café", "Seafood")',
            },
            notes: {
              type: 'string',
              description: 'Brief notes about why this restaurant is recommended',
            },
            priceHint: {
              type: 'string',
              enum: ['$', '$$', '$$$', '$$$$'],
              description: 'Price level indicator',
            },
          },
          required: ['name', 'city', 'country', 'foodType', 'notes', 'priceHint'],
          additionalProperties: false,
        },
      },
      activities: {
        type: 'array',
        description: 'List of activity and attraction recommendations',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Activity or attraction name',
            },
            city: {
              type: 'string',
              description: 'City where the activity is located',
            },
            country: {
              type: 'string',
              description: 'Country where the activity is located',
            },
            activityType: {
              type: 'string',
              description: 'Type of activity (e.g., "Museum", "Viewpoint", "Beach", "Tour")',
            },
            notes: {
              type: 'string',
              description: 'Brief notes about the activity',
            },
            timeOfDay: {
              type: 'string',
              enum: ['morning', 'afternoon', 'evening', 'flexible'],
              description: 'Best time of day for this activity',
            },
          },
          required: ['name', 'city', 'country', 'activityType', 'notes', 'timeOfDay'],
          additionalProperties: false,
        },
      },
    },
    required: ['destination', 'summary', 'hotels', 'restaurants', 'activities'],
    additionalProperties: false,
  },
};

// System prompt for Ask AI feature
export const ASK_AI_SYSTEM_PROMPT = `You are a travel planning assistant. Your task is to recommend hotels, restaurants, and activities based on the user's travel plans.

**Guidelines:**
- Recommend 2-4 hotels that match the user's budget and preferences
- Recommend 3-5 restaurants covering different meal times and cuisines
- Recommend 4-6 activities and attractions
- Use REAL place names that actually exist (not fictional ones)
- Consider the user's budget, travel style, and any specific preferences
- Write a friendly, helpful summary paragraph

**Price Hints:**
- $ = Budget-friendly (under $100/night for hotels, under $15/meal)
- $$ = Mid-range ($100-200/night for hotels, $15-30/meal)
- $$$ = Upscale ($200-400/night for hotels, $30-60/meal)
- $$$$ = Luxury ($400+/night for hotels, $60+/meal)

Return your response as valid JSON matching the provided schema.`;

// Helper to convert price hint to price range
export function priceHintToRange(hint: string): [number, number] {
  switch (hint) {
    case '$':
      return [0, 100];
    case '$$':
      return [100, 200];
    case '$$$':
      return [200, 400];
    case '$$$$':
      return [400, 1000];
    default:
      return [0, 200];
  }
}

// Helper to convert price hint to price level (1-4)
export function priceHintToLevel(hint: string): number {
  switch (hint) {
    case '$':
      return 1;
    case '$$':
      return 2;
    case '$$$':
      return 3;
    case '$$$$':
      return 4;
    default:
      return 2;
  }
}

/**
 * Generate category-specific system prompt
 * When category is specified, instructs AI to only return that type
 */
export function getSystemPrompt(category: AskAICategory = 'all'): string {
  const basePrompt = `You are a travel planning assistant. Your task is to recommend places based on the user's travel plans.

**Price Hints:**
- $ = Budget-friendly (under $100/night for hotels, under $15/meal)
- $$ = Mid-range ($100-200/night for hotels, $15-30/meal)
- $$$ = Upscale ($200-400/night for hotels, $30-60/meal)
- $$$$ = Luxury ($400+/night for hotels, $60+/meal)

Return your response as valid JSON matching the provided schema.`;

  switch (category) {
    case 'restaurants':
      return `${basePrompt}

**IMPORTANT: The user is specifically looking for RESTAURANTS only.**
- Recommend 3-10 restaurants based on their request
- DO NOT include any hotels or activities
- The hotels array MUST be empty: []
- The activities array MUST be empty: []
- Use REAL restaurant names that actually exist
- Cover different cuisines and price ranges when appropriate
- Write a helpful summary about the restaurant recommendations`;

    case 'hotels':
      return `${basePrompt}

**IMPORTANT: The user is specifically looking for HOTELS only.**
- Recommend 2-8 hotels based on their request
- DO NOT include any restaurants or activities
- The restaurants array MUST be empty: []
- The activities array MUST be empty: []
- Use REAL hotel names that actually exist
- Consider budget, amenities, and location
- Write a helpful summary about the hotel recommendations`;

    case 'activities':
      return `${basePrompt}

**IMPORTANT: The user is specifically looking for ACTIVITIES only.**
- Recommend 3-10 activities and attractions based on their request
- DO NOT include any hotels or restaurants
- The hotels array MUST be empty: []
- The restaurants array MUST be empty: []
- Use REAL attraction/activity names that actually exist
- Include varied activity types (museums, tours, nature, etc.)
- Write a helpful summary about the activity recommendations`;

    case 'all':
    default:
      return ASK_AI_SYSTEM_PROMPT;
  }
}

/**
 * Detect category from user's question
 * Returns the detected category or 'all' if unclear
 */
export function detectCategoryFromQuery(query: string): AskAICategory {
  const lowerQuery = query.toLowerCase();

  // Restaurant keywords
  const restaurantKeywords = [
    'restaurant', 'restaurants', 'food', 'eat', 'eating', 'dining',
    'dinner', 'lunch', 'breakfast', 'brunch', 'cuisine', 'meal',
    'cafe', 'cafes', 'coffee shop', 'bar', 'bars', 'pub', 'pubs'
  ];

  // Hotel keywords
  const hotelKeywords = [
    'hotel', 'hotels', 'stay', 'staying', 'accommodation', 'accommodations',
    'lodging', 'hostel', 'hostels', 'resort', 'resorts', 'airbnb',
    'motel', 'motels', 'inn', 'inns', 'sleep', 'room', 'rooms'
  ];

  // Activity keywords
  const activityKeywords = [
    'activity', 'activities', 'things to do', 'attraction', 'attractions',
    'visit', 'visiting', 'see', 'seeing', 'tour', 'tours', 'museum',
    'museums', 'park', 'parks', 'beach', 'beaches', 'landmark', 'landmarks',
    'sightseeing', 'explore', 'exploring', 'hike', 'hiking'
  ];

  // Count keyword matches for each category
  const restaurantMatches = restaurantKeywords.filter(kw => lowerQuery.includes(kw)).length;
  const hotelMatches = hotelKeywords.filter(kw => lowerQuery.includes(kw)).length;
  const activityMatches = activityKeywords.filter(kw => lowerQuery.includes(kw)).length;

  // Return category with most matches, or 'all' if tied or no matches
  const maxMatches = Math.max(restaurantMatches, hotelMatches, activityMatches);

  if (maxMatches === 0) {
    return 'all';
  }

  // Check for clear winner
  if (restaurantMatches > hotelMatches && restaurantMatches > activityMatches) {
    return 'restaurants';
  }
  if (hotelMatches > restaurantMatches && hotelMatches > activityMatches) {
    return 'hotels';
  }
  if (activityMatches > restaurantMatches && activityMatches > hotelMatches) {
    return 'activities';
  }

  // If tied, return 'all'
  return 'all';
}
