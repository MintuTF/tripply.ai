import type { ChatVideoResult, VideoAnalysis, SmartVideoResult } from './video';

// Core Data Models
export type UserRole = 'user' | 'admin';

// View Types
export type TripView = 'map' | 'board' | 'chat' | 'marketplace' | 'research';

// Chat Mode - User explicitly selects Ask or Itinerary
export type ChatMode = 'ask' | 'itinerary';

// Chat Board Types
export type ChatBoardItemStatus = 'shortlist' | 'confirmed';

export type ChatBoardItem = {
  id: string;
  trip_id: string;
  card: PlaceCard;
  status: ChatBoardItemStatus;
  created_at: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  prefs_json?: UserPreferences;
  created_at: string;
  updated_at: string;
};

// Admin Types
export type FeedbackCategory = 'bug' | 'feature' | 'general';
export type FeedbackStatus = 'new' | 'reviewed' | 'resolved' | 'dismissed';

export type Feedback = {
  id: string;
  user_id?: string;
  user_email?: string;
  category: FeedbackCategory;
  message: string;
  page_url?: string;
  status: FeedbackStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  description?: string;
  short_description?: string;
  image?: string;
  price: number;
  affiliate_url: string;
  category: string;
  tags: string[];
  rating?: number;
  review_count?: number;
  budget_tier?: 'budget' | 'mid-range' | 'premium';
  weather_conditions?: string[];
  trip_types?: string[];
  activities?: string[];
  destinations?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserPreferences = {
  budget_range?: [number, number];
  cuisine_likes?: string[];
  mobility?: 'high' | 'medium' | 'low';
  vibe?: 'relax' | 'adventure' | 'food' | 'culture' | 'nature';
  walking_tolerance?: 'high' | 'medium' | 'low';
};

export type TripDestination = {
  name: string;
  place_id?: string;
  coordinates?: { lat: number; lng: number };
};

export type TripStatus = 'planning' | 'in_progress' | 'completed' | 'archived';

export type Trip = {
  id: string;
  user_id: string;
  title: string;
  destination?: TripDestination;
  dates: {
    start: string;
    end: string;
  };
  party_json: TripParty;
  status: TripStatus;
  budget_range?: [number, number];
  privacy: 'private' | 'shared';
  created_at: string;
  updated_at: string;
};

export type TripParty = {
  adults: number;
  children?: number;
  infants?: number;
};

export type Message = {
  id: string;
  trip_id: string;
  conversation_id?: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  chat_mode?: ChatMode;
  tool_calls_json?: ToolCall[];
  citations_json?: Citation[];
  cards_json?: PlaceCard[];
  videos_json?: ChatVideoResult[];
  videoAnalysis_json?: VideoAnalysis;
  smartVideoResult_json?: SmartVideoResult;
  itinerary_json?: ItineraryResponse;
  created_at: string;
};

// Rich card type for chat messages
export type PlaceCard = {
  id: string;
  type: 'location' | 'restaurant' | 'hotel' | 'activity';
  name: string;
  address?: string;
  vicinity?: string; // Short address from Google Places API
  location?: { lat: number; lng: number }; // Alternative coordinate format
  coordinates?: { lat: number; lng: number };
  photos: string[];
  rating?: number;
  review_count?: number;
  price_level?: number; // 1-4 for restaurants
  price_range?: [number, number]; // For hotels
  price?: number; // For activities
  description?: string;
  opening_hours?: string;
  cuisine_type?: string; // For restaurants
  amenities?: string[]; // For hotels
  duration?: string; // For activities
  url?: string;
  place_id?: string;
  // Hotel-specific fields
  check_in_date?: string;
  check_out_date?: string;
  price_per_night?: number;
  currency?: string;
  // WHY reasoning fields (for AI recommendations)
  whyTags?: string[];    // Short tags like "Romantic", "Walkable"
  whyBullets?: string[]; // Contextual reasons this fits the user's trip
};

// Chat Conversation - Persistent conversation session
export interface ChatConversation {
  id: string;
  user_id: string;
  trip_id?: string;
  destination: string;
  title: string;
  chat_mode: ChatMode;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  message_count?: number;
  last_message_preview?: string;
}

// Itinerary Response Structure (parsed from AI JSON)
export interface ItineraryDayItem {
  type: 'activity' | 'restaurant' | 'hotel' | 'transport';
  placeId?: string;
  name: string;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  durationMinutes: number;
  why: string[];
  place?: PlaceCard;
}

export interface ItineraryDay {
  day: number;
  theme: string;
  whyThisDayWorks: string[];
  items: ItineraryDayItem[];
}

export interface ItineraryResponse {
  tripSummary: {
    destination: string;
    days: number;
    travelerType?: string;
    pace?: string;
    focus?: string[];
  };
  whyThisPlanWorks: string[];
  days: ItineraryDay[];
}

// Extended Message type for mode-aware chat
export interface ModeAwareMessage extends Message {
  chatMode?: ChatMode;
  itinerary_json?: ItineraryResponse;
}

// Ask Mode - Parsed response types for card-first UI
export interface AskModeInsight {
  text: string;
}

export interface AskModeHighlight {
  emoji: string;
  text: string;
}

export interface AskModePlace {
  name: string;
  highlights: AskModeHighlight[];
  location?: string;
  card?: PlaceCard; // Merged from API
}

export interface AskModeSection {
  emoji: string;
  title: string;
  count?: number;
  places: AskModePlace[];
}

export interface ParsedAskModeResponse {
  insight: AskModeInsight | null;
  sections: AskModeSection[];
  followUps: { suggestions: string[] } | null;
}

export type ToolCall = {
  id: string;
  tool: string;
  parameters: Record<string, any>;
  result?: any;
};

export type Citation = {
  url: string;
  title: string;
  snippet?: string;
  timestamp: string;
  confidence?: number;
};

export type Card = {
  id: string;
  trip_id: string;
  type: CardType;
  payload_json: HotelCard | SpotCard | FoodCard | ActivityCard | NoteCard | ProductCard;
  labels: string[];
  favorite: boolean;
  ranking?: number;
  day?: number; // Which day of trip (1-based: Day 1, Day 2, etc.)
  time_slot?: string; // Time for this stop (e.g., "09:00", "14:30")
  order?: number; // Order within the day (for sequencing stops)
  travel_info?: TravelInfo; // Travel time/distance to next stop in sequence
  created_at: string;
  updated_at: string;
};

export type CardType = 'hotel' | 'spot' | 'food' | 'activity' | 'note' | 'product';

export type TravelInfo = {
  distance: number; // in km
  duration: number; // in minutes
  mode: 'driving' | 'walking' | 'transit' | 'flight';
  next_stop_id: string; // ID of the next card in sequence
};

export type HotelCard = {
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  price_range: [number, number];
  rating?: number;
  amenities: string[];
  photos?: string[];
  url?: string;
  distance_to_center?: number;
  pros?: string[];
  cons?: string[];
  cost?: number; // Actual booked cost
  currency?: string; // Currency code (e.g., USD, EUR)
};

export type SpotCard = {
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  type: string;
  rating?: number;
  photos?: string[];
  opening_hours?: string;
  url?: string;
  description?: string;
  cost?: number; // Admission or ticket cost
  currency?: string; // Currency code (e.g., USD, EUR)
};

export type FoodCard = {
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  cuisine_type: string;
  price_level: number;
  rating?: number;
  photos?: string[];
  opening_hours?: string;
  url?: string;
  dietary_tags?: string[];
  cost?: number; // Estimated meal cost
  currency?: string; // Currency code (e.g., USD, EUR)
};

export type ActivityCard = {
  name: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  type: string;
  duration?: string;
  price?: number;
  rating?: number;
  photos?: string[];
  url?: string;
  description?: string;
  cost?: number; // Actual booked cost (use instead of price if different)
  currency?: string; // Currency code (e.g., USD, EUR)
};

export type NoteCard = {
  title: string;
  content: string;
  created_by: string;
};

export type ProductCard = {
  name: string;
  description: string;
  shortDescription: string;
  image: string;
  price: number;
  affiliateUrl: string;
  category: string; // From marketplace ProductCategory
  rating?: number;
  reviewCount?: number;
  budgetTier?: 'budget' | 'mid-range' | 'premium';
  whyBullets?: string[]; // Contextual reasons for this trip
  smartBadges?: string[]; // Travel-aware badges with emoji
  cost?: number; // If user wants to track different cost
  currency?: string; // Currency code (e.g., USD, EUR)
};

export type Comment = {
  id: string;
  parent_type: 'message' | 'card';
  parent_id: string;
  user_id: string;
  text: string;
  created_at: string;
};

export type Reminder = {
  id: string;
  trip_id: string;
  type: 'price' | 'weather' | 'visa' | 'itinerary';
  config_json: Record<string, any>;
  next_fire_at: string;
  enabled: boolean;
  created_at: string;
};

export type AuditLog = {
  id: string;
  trip_id: string;
  event: string;
  actor_id: string;
  payload_json: Record<string, any>;
  created_at: string;
};

// Layout System Types
export type Intent =
  | 'overview'
  | 'stays'
  | 'itinerary'
  | 'nearby'
  | 'transport'
  | 'briefing'
  | 'general';

export type Layout = {
  id: Intent;
  regions: {
    chat: boolean;
    canvas: boolean;
    map: boolean;
    compare?: boolean;
  };
  components: string[];
};

export type LayoutState = 'landing' | 'active' | 'focus';

export type ToolPlan = string[];

// Tool System Types
export type Tool =
  | 'search'
  | 'weather'
  | 'places'
  | 'events'
  | 'flights'
  | 'itinerary';

export type ToolResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  sources?: Citation[];
  timestamp: string;
};

// Weather Types
export type WeatherForecast = {
  date: string;
  high: number;
  low: number;
  condition: string;
  rain_chance: number;
  wind_speed?: number;
};

export type WeatherData = {
  current: WeatherForecast;
  forecast: WeatherForecast[];
  historical_avg?: {
    high: number;
    low: number;
  };
  alerts?: string[];
};

// Places Types
export type PlaceReview = {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  photos?: string[]; // Review photos from Google Places API
};

export type PlaceResult = {
  place_id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rating?: number;
  review_count?: number;
  price_level?: number;
  types: string[];
  photos?: string[];
  opening_hours?: string;
  url?: string;
  phone?: string;
  website?: string;
  reviews?: PlaceReview[];
  editorial_summary?: string;
};

// Search Types
export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  timestamp: string;
};

// Event Types
export type Event = {
  id: string;
  name: string;
  date: string;
  venue?: string;
  price?: number;
  url?: string;
  category: string;
};

// Itinerary Types
export type ItineraryDay = {
  date: string;
  items: ItineraryItem[];
};

export type ItineraryItem = {
  id: string;
  time: string;
  duration: string;
  type: 'spot' | 'food' | 'activity' | 'transport';
  card_id?: string;
  details: {
    name: string;
    address?: string;
    notes?: string;
  };
  travel_time_to_next?: string;
  energy_level?: 'low' | 'medium' | 'high';
};

// Compare Types
export type CompareItem = {
  id: string;
  name: string;
  criteria: Record<string, any>;
};

// Share Types
export type ShareLink = {
  id: string;
  trip_id: string;
  token: string;
  role: 'viewer' | 'commenter' | 'editor';
  expires_at?: string;
  created_at: string;
};

// Reddit Types
export type RedditPost = {
  id: string;
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  created_utc: number;
  author: string;
};

// ============================================================================
// Auto-Save Types
// ============================================================================

export type SavePriority = 'critical' | 'medium' | 'low';

export type SaveStatus =
  | { state: 'saved' }
  | { state: 'pending'; count: number }
  | { state: 'saving'; progress?: number }
  | { state: 'error'; message: string }
  | { state: 'conflict'; conflicts: ConflictInfo[] }
  | { state: 'offline'; queuedCount: number };

export interface ConflictInfo {
  cardId: string;
  field: string;
  yourValue: any;
  theirValue: any;
  theirTimestamp: string;
  theirUser?: string;
}
