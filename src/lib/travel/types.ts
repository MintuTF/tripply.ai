// Types for the Travel Research Page

export interface CityData {
  name: string;
  country: string;
  countryCode: string;
  placeId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  weather?: {
    temp: number;
    condition: string;
  };
  bestSeason?: string;
  priceLevel?: '$' | '$$' | '$$$';
  imageUrl?: string;
}

export interface TravelPlace {
  id: string;
  name: string;
  imageUrl: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  popularityScore: number;
  description: string;
  shortDescription?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  priceLevel?: number;
  openNow?: boolean;
  duration?: string;
  area?: string;
}

export type TravelerProfile = 'solo' | 'couple' | 'family' | 'friends';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  structuredResponse?: AIStructuredResponse;
  videos?: import('@/types/video').ChatVideoResult[];
}

export interface AIStructuredResponse {
  title: string;
  summary: string;
  items: AIRecommendation[];
  followUpSuggestions: string[];
}

export interface AIRecommendation {
  placeId: string;
  placeName?: string;
  placeImage?: string;
  headline: string;
  whyItFits: string[];
  duration?: string;
  bestTime?: string;
  priority: number;
}

export interface AISession {
  sessionId: string;
  messages: AIMessage[];
  travelerProfile?: TravelerProfile;
  durationDays?: number;
  profileCollected: boolean;
}

export interface CategorizedPlaces {
  hotels: TravelPlace[];
  restaurants: TravelPlace[];
  activities: TravelPlace[];
}

export type QuickFilter = 'all' | 'hotels' | 'restaurants' | 'activities';

export type TravelTab = 'explore' | 'trips' | 'saved' | 'chat' | 'board' | 'marketplace';

// Draft Trip Types
export interface DraftTrip {
  name: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  homeCity?: string;
  tripType?: string; // 'leisure' | 'business' | 'adventure' | etc.
  createdAt: number;
}

export interface DraftCard {
  id: string;  // local ID (UUID)
  type: 'hotel' | 'spot' | 'food' | 'activity';
  placeData: TravelPlace;
  labels: string[];  // ['considering', 'shortlist', 'confirmed']
  day?: number;
  time_slot?: string;
  order?: number;
  addedAt: number;
}

export interface TravelState {
  city: CityData | null;
  places: TravelPlace[];
  filteredPlaces: TravelPlace[];
  activeFilter: string;
  categorizedPlaces: CategorizedPlaces;
  quickFilter: QuickFilter;
  showMap: boolean;
  selectedPlace: TravelPlace | null;
  drawerOpen: boolean;
  aiSession: AISession;
  isLoading: boolean;
  placesLoading: boolean;
  savedPlaceIds: string[];
  showNearbyModal: boolean;
  nearbyPlace: TravelPlace | null;
  // Tab navigation
  activeTab: TravelTab;
  // Saved places full data
  savedPlacesData: TravelPlace[];
  savedPlacesLoading: boolean;
  // Trips data
  tripsLoading: boolean;
  // City loading state (for destination param)
  cityLoading: boolean;
  // Draft trip (for creating trips from saved places)
  draftTrip: DraftTrip | null;
  draftCards: DraftCard[];
  // Current trip ID (for auto-save to database)
  currentTripId: string | null;
  // Board refresh trigger - increment to force Board data reload
  boardRefreshTrigger: number;
}

export type TravelAction =
  | { type: 'SET_CITY'; payload: CityData }
  | { type: 'SET_PLACES'; payload: TravelPlace[] }
  | { type: 'SET_FILTER'; payload: string }
  | { type: 'SET_QUICK_FILTER'; payload: QuickFilter }
  | { type: 'TOGGLE_MAP' }
  | { type: 'SET_SHOW_MAP'; payload: boolean }
  | { type: 'SELECT_PLACE'; payload: TravelPlace | null }
  | { type: 'SET_DRAWER_OPEN'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: AIMessage }
  | { type: 'SET_TRAVELER_PROFILE'; payload: TravelerProfile }
  | { type: 'SET_DURATION_DAYS'; payload: number }
  | { type: 'SET_PROFILE_COLLECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PLACES_LOADING'; payload: boolean }
  | { type: 'SAVE_PLACE'; payload: string }
  | { type: 'UNSAVE_PLACE'; payload: string }
  | { type: 'SET_SAVED_PLACE_IDS'; payload: string[] }
  | { type: 'SHOW_NEARBY_MODAL'; payload: TravelPlace }
  | { type: 'HIDE_NEARBY_MODAL' }
  | { type: 'RESET' }
  // Tab navigation
  | { type: 'SET_ACTIVE_TAB'; payload: TravelTab }
  // Saved places data
  | { type: 'SET_SAVED_PLACES_DATA'; payload: TravelPlace[] }
  | { type: 'SET_SAVED_PLACES_LOADING'; payload: boolean }
  // Trips loading
  | { type: 'SET_TRIPS_LOADING'; payload: boolean }
  // City loading
  | { type: 'SET_CITY_LOADING'; payload: boolean }
  // Draft trip actions
  | { type: 'CREATE_DRAFT_TRIP'; payload: DraftTrip }
  | { type: 'ADD_TO_DRAFT_TRIP'; payload: DraftCard }
  | { type: 'UPDATE_DRAFT_CARD'; payload: { id: string; updates: Partial<DraftCard> } }
  | { type: 'REMOVE_FROM_DRAFT_TRIP'; payload: string }
  | { type: 'CLEAR_DRAFT_TRIP' }
  | { type: 'SET_DRAFT_CARDS'; payload: DraftCard[] }
  // Current trip ID
  | { type: 'SET_CURRENT_TRIP_ID'; payload: string | null }
  // Board refresh
  | { type: 'TRIGGER_BOARD_REFRESH' };

export const TRAVEL_FILTERS = [
  { id: 'popular', label: 'Popular', icon: 'flame' },
  { id: 'top-rated', label: 'Top Rated', icon: 'star' },
  { id: 'romantic', label: 'Romantic', icon: 'heart' },
  { id: 'food', label: 'Food', icon: 'utensils' },
  { id: 'nightlife', label: 'Nightlife', icon: 'moon' },
  { id: 'outdoor', label: 'Outdoor', icon: 'tree' },
  { id: 'free', label: 'Free', icon: 'gift' },
] as const;

export type FilterId = typeof TRAVEL_FILTERS[number]['id'];
