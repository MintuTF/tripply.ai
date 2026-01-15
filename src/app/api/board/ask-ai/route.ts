import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/db/supabase-server';
import { openai } from '@/lib/ai/openai';
import { findPlaceByName } from '@/lib/tools/places';
import { createCard } from '@/lib/db/queries';
import {
  TRAVEL_RECOMMENDATIONS_SCHEMA,
  getSystemPrompt,
  detectCategoryFromQuery,
  priceHintToRange,
  priceHintToLevel,
  type AiTravelRecommendations,
  type AiHotelSuggestion,
  type AiRestaurantSuggestion,
  type AiActivitySuggestion,
  type AskAICategory,
} from '@/lib/ai/askAiSchema';
import type { Card, HotelCard, FoodCard, SpotCard, PlaceCard } from '@/types';

/**
 * Enriched place data after Google Places lookup
 */
interface EnrichedPlace {
  name: string;
  city: string;
  country: string;
  notes: string;
  place_id?: string;
  photos: string[];
  rating?: number;
  coordinates?: { lat: number; lng: number };
  address?: string;
}

interface EnrichedHotel extends EnrichedPlace {
  priceHint: string;
}

interface EnrichedRestaurant extends EnrichedPlace {
  foodType: string;
  priceHint: string;
}

interface EnrichedActivity extends EnrichedPlace {
  activityType: string;
  timeOfDay: string;
}

/**
 * Enrich a single place with Google Places data
 */
async function enrichPlace(
  name: string,
  location: string
): Promise<{ place_id?: string; photos: string[]; rating?: number; coordinates?: { lat: number; lng: number }; address?: string }> {
  try {
    const result = await findPlaceByName({ name, location });

    if (result.success && result.data) {
      // Get more details if we have a place_id
      const placeId = result.data.place_id;
      const photos = result.data.photos || [];

      return {
        place_id: placeId,
        photos,
        // Note: findPlaceByName doesn't return rating/coordinates,
        // but we keep the structure for potential future enhancement
      };
    }

    return { photos: [] };
  } catch (error) {
    console.error(`Failed to enrich place "${name}":`, error);
    return { photos: [] };
  }
}

/**
 * Enrich hotels with Google Places data
 */
async function enrichHotels(hotels: AiHotelSuggestion[]): Promise<EnrichedHotel[]> {
  return Promise.all(
    hotels.map(async (hotel) => {
      const location = `${hotel.city}, ${hotel.country}`;
      const enriched = await enrichPlace(hotel.name, location);

      return {
        ...hotel,
        ...enriched,
        address: enriched.address || location,
      };
    })
  );
}

/**
 * Enrich restaurants with Google Places data
 */
async function enrichRestaurants(restaurants: AiRestaurantSuggestion[]): Promise<EnrichedRestaurant[]> {
  return Promise.all(
    restaurants.map(async (restaurant) => {
      const location = `${restaurant.city}, ${restaurant.country}`;
      const enriched = await enrichPlace(restaurant.name, location);

      return {
        ...restaurant,
        ...enriched,
        address: enriched.address || location,
      };
    })
  );
}

/**
 * Enrich activities with Google Places data
 */
async function enrichActivities(activities: AiActivitySuggestion[]): Promise<EnrichedActivity[]> {
  return Promise.all(
    activities.map(async (activity) => {
      const location = `${activity.city}, ${activity.country}`;
      const enriched = await enrichPlace(activity.name, location);

      return {
        ...activity,
        ...enriched,
        address: enriched.address || location,
      };
    })
  );
}

/**
 * Create board cards from enriched recommendations
 */
async function createCardsFromRecommendations(
  tripId: string,
  hotels: EnrichedHotel[],
  restaurants: EnrichedRestaurant[],
  activities: EnrichedActivity[]
): Promise<Card[]> {
  const cards: Card[] = [];

  // Create hotel cards
  for (const hotel of hotels) {
    const payload: HotelCard = {
      name: hotel.name,
      address: hotel.address || `${hotel.city}, ${hotel.country}`,
      coordinates: hotel.coordinates || { lat: 0, lng: 0 },
      price_range: priceHintToRange(hotel.priceHint),
      rating: hotel.rating,
      amenities: [],
      photos: hotel.photos,
      url: hotel.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${hotel.place_id}`
        : undefined,
    };

    const card = await createCard({
      trip_id: tripId,
      type: 'hotel',
      payload_json: payload,
      labels: ['considering'],
      favorite: false,
    });

    if (card) {
      cards.push(card);
    }
  }

  // Create restaurant cards
  for (const restaurant of restaurants) {
    const payload: FoodCard = {
      name: restaurant.name,
      address: restaurant.address || `${restaurant.city}, ${restaurant.country}`,
      coordinates: restaurant.coordinates || { lat: 0, lng: 0 },
      cuisine_type: restaurant.foodType,
      price_level: priceHintToLevel(restaurant.priceHint),
      rating: restaurant.rating,
      photos: restaurant.photos,
      url: restaurant.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`
        : undefined,
    };

    const card = await createCard({
      trip_id: tripId,
      type: 'food',
      payload_json: payload,
      labels: ['considering'],
      favorite: false,
    });

    if (card) {
      cards.push(card);
    }
  }

  // Create activity cards (mapped to 'spot' type)
  for (const activity of activities) {
    const payload: SpotCard = {
      name: activity.name,
      address: activity.address || `${activity.city}, ${activity.country}`,
      coordinates: activity.coordinates || { lat: 0, lng: 0 },
      type: activity.activityType,
      rating: activity.rating,
      photos: activity.photos,
      description: `${activity.notes} (Best time: ${activity.timeOfDay})`,
      url: activity.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${activity.place_id}`
        : undefined,
    };

    const card = await createCard({
      trip_id: tripId,
      type: 'spot',
      payload_json: payload,
      labels: ['considering'],
      favorite: false,
    });

    if (card) {
      cards.push(card);
    }
  }

  return cards;
}

/**
 * Convert enriched recommendations to PlaceCard format (for unauthenticated users)
 * Creates temporary IDs since cards aren't saved to database
 */
function enrichedRecommendationsToPlaceCards(
  hotels: EnrichedHotel[],
  restaurants: EnrichedRestaurant[],
  activities: EnrichedActivity[]
): PlaceCard[] {
  const placeCards: PlaceCard[] = [];

  // Convert hotels
  hotels.forEach((hotel, index) => {
    placeCards.push({
      id: `temp-hotel-${index}`,
      type: 'hotel',
      name: hotel.name,
      address: hotel.address || `${hotel.city}, ${hotel.country}`,
      coordinates: hotel.coordinates,
      photos: hotel.photos,
      rating: hotel.rating,
      price_range: priceHintToRange(hotel.priceHint),
      description: hotel.notes,
      url: hotel.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${hotel.place_id}`
        : undefined,
    });
  });

  // Convert restaurants
  restaurants.forEach((restaurant, index) => {
    placeCards.push({
      id: `temp-restaurant-${index}`,
      type: 'restaurant',
      name: restaurant.name,
      address: restaurant.address || `${restaurant.city}, ${restaurant.country}`,
      coordinates: restaurant.coordinates,
      photos: restaurant.photos,
      rating: restaurant.rating,
      price_level: priceHintToLevel(restaurant.priceHint),
      cuisine_type: restaurant.foodType,
      description: restaurant.notes,
      url: restaurant.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`
        : undefined,
    });
  });

  // Convert activities
  activities.forEach((activity, index) => {
    placeCards.push({
      id: `temp-activity-${index}`,
      type: 'activity',
      name: activity.name,
      address: activity.address || `${activity.city}, ${activity.country}`,
      coordinates: activity.coordinates,
      photos: activity.photos,
      rating: activity.rating,
      description: `${activity.notes} (Best time: ${activity.timeOfDay})`,
      url: activity.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${activity.place_id}`
        : undefined,
    });
  });

  return placeCards;
}

/**
 * Convert cards to PlaceCard format for frontend display
 */
function cardsToPlaceCards(cards: Card[]): PlaceCard[] {
  return cards.map((card) => {
    const payload = card.payload_json as HotelCard | FoodCard | SpotCard;

    let type: PlaceCard['type'];
    let priceLevel: number | undefined;
    let priceRange: [number, number] | undefined;
    let cuisineType: string | undefined;

    switch (card.type) {
      case 'hotel':
        type = 'hotel';
        priceRange = (payload as HotelCard).price_range;
        break;
      case 'food':
        type = 'restaurant';
        priceLevel = (payload as FoodCard).price_level;
        cuisineType = (payload as FoodCard).cuisine_type;
        break;
      case 'spot':
      default:
        type = 'activity';
        break;
    }

    return {
      id: card.id,
      type,
      name: payload.name,
      address: payload.address,
      coordinates: payload.coordinates,
      photos: payload.photos || [],
      rating: payload.rating,
      price_level: priceLevel,
      price_range: priceRange,
      cuisine_type: cuisineType,
      url: payload.url,
      description: 'description' in payload ? payload.description : undefined,
    };
  });
}

/**
 * POST /api/board/ask-ai
 * Get AI travel recommendations with structured JSON output
 * Works for both authenticated and unauthenticated users
 */
export async function POST(request: Request) {
  try {
    // Check if user is authenticated (optional - feature works for guests too)
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthenticated = !!user;

    // Parse request body
    const body = await request.json();
    const { tripId, question, destination, dates, budget, category: requestedCategory } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'question is required' },
        { status: 400 }
      );
    }

    // Determine category: use requested category or auto-detect from question
    const category: AskAICategory = requestedCategory || detectCategoryFromQuery(question);

    // Build context for the AI
    let context = question;
    if (destination) {
      context += `\n\nDestination context: ${destination}`;
    }
    if (dates) {
      context += `\nTravel dates: ${dates.start} to ${dates.end}`;
    }
    if (budget) {
      context += `\nBudget: $${budget} per night for hotels`;
    }

    // Get category-specific system prompt
    const systemPrompt = getSystemPrompt(category);

    // Call OpenAI with structured JSON output
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: {
        type: 'json_schema',
        json_schema: TRAVEL_RECOMMENDATIONS_SCHEMA,
      },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the structured JSON response
    let recommendations: AiTravelRecommendations;
    try {
      recommendations = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, content);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Enrich with Google Places data (in parallel) - only for requested categories
    const [enrichedHotels, enrichedRestaurants, enrichedActivities] = await Promise.all([
      category === 'all' || category === 'hotels'
        ? enrichHotels(recommendations.hotels)
        : Promise.resolve([]),
      category === 'all' || category === 'restaurants'
        ? enrichRestaurants(recommendations.restaurants)
        : Promise.resolve([]),
      category === 'all' || category === 'activities'
        ? enrichActivities(recommendations.activities)
        : Promise.resolve([]),
    ]);

    // Return enriched recommendations without saving to database
    // The frontend will handle saving via /api/cards when user clicks "Add All"
    const placeCards = enrichedRecommendationsToPlaceCards(
      enrichedHotels,
      enrichedRestaurants,
      enrichedActivities
    );

    // Server-side filtering as backup - ensure only requested category is returned
    const filteredCards = category === 'all'
      ? placeCards
      : placeCards.filter(card => {
          switch (category) {
            case 'restaurants':
              return card.type === 'restaurant';
            case 'hotels':
              return card.type === 'hotel';
            case 'activities':
              return card.type === 'activity';
            default:
              return true;
          }
        });

    return NextResponse.json({
      planText: recommendations.summary,
      destination: recommendations.destination,
      cards: filteredCards,
      category, // Include detected/used category for debugging
      // Include auth status so frontend knows if saving is possible
      canSave: isAuthenticated && tripId && tripId !== 'draft',
    });
  } catch (error) {
    console.error('Ask AI error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
