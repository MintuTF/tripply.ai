'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
import type {
  TravelState,
  TravelAction,
  CityData,
  TravelPlace,
  TravelerProfile,
  AIMessage,
  AISession,
  QuickFilter,
  TravelTab,
  DraftTrip,
  DraftCard
} from '@/lib/travel/types';
import { usePlacesCache } from '@/hooks/usePlacesCache';
import { generateUUID } from '@/lib/utils';

// Category keyword constants
const HOTEL_KEYWORDS = [
  'hotel', 'accommodation', 'lodging', 'resort',
  'hostel', 'inn', 'motel', 'guesthouse', 'stay'
];

const RESTAURANT_KEYWORDS = [
  'restaurant', 'cafe', 'food', 'dining', 'bakery',
  'bar', 'pub', 'bistro', 'eatery', 'kitchen'
];

// Activity keywords - explicit list (not catch-all)
const ACTIVITY_KEYWORDS = [
  // Attractions
  'tourist', 'attraction', 'landmark', 'monument', 'historic',
  // Culture
  'museum', 'art', 'gallery', 'theater', 'theatre', 'culture',
  // Nature & Outdoor
  'park', 'garden', 'beach', 'nature', 'outdoor', 'scenic', 'trail', 'hiking',
  // Entertainment
  'entertainment', 'amusement', 'zoo', 'aquarium', 'stadium', 'casino',
  // Spiritual
  'temple', 'church', 'shrine', 'mosque', 'cathedral', 'worship',
  // Relaxation
  'spa', 'wellness',
  // Shopping (travel-relevant)
  'market', 'bazaar', 'shopping district',
  // Views
  'views', 'observation', 'tower', 'viewpoint',
  // Nightlife
  'nightlife', 'club', 'night club', 'lounge'
];

// Helper function to determine primary category
// Uses catch-all for activities since API filtering handles non-travel places
function getPrimaryCategory(place: TravelPlace): 'hotels' | 'restaurants' | 'activities' {
  const categories = place.categories.map(c => c.toLowerCase());

  // Priority: Hotels > Restaurants > Activities (catch-all)
  if (categories.some(c => HOTEL_KEYWORDS.some(keyword => c.includes(keyword)))) return 'hotels';
  if (categories.some(c => RESTAURANT_KEYWORDS.some(keyword => c.includes(keyword)))) return 'restaurants';

  // Everything else is an activity (API filtering removes non-travel places)
  return 'activities';
}

// Helper function to categorize all places
function categorizePlaces(places: TravelPlace[]) {
  return {
    hotels: places.filter(p => getPrimaryCategory(p) === 'hotels'),
    restaurants: places.filter(p => getPrimaryCategory(p) === 'restaurants'),
    activities: places.filter(p => getPrimaryCategory(p) === 'activities'),
  };
}

const initialAISession: AISession = {
  sessionId: generateUUID(),
  messages: [],
  travelerProfile: undefined,
  durationDays: undefined,
  profileCollected: false,
};

const initialState: TravelState = {
  city: null,
  places: [],
  filteredPlaces: [],
  activeFilter: 'popular',
  categorizedPlaces: {
    hotels: [],
    restaurants: [],
    activities: [],
  },
  quickFilter: 'all',
  showMap: false,
  selectedPlace: null,
  drawerOpen: false,
  aiSession: initialAISession,
  isLoading: false,
  placesLoading: false,
  savedPlaceIds: [],
  showNearbyModal: false,
  nearbyPlace: null,
  // Tab navigation
  activeTab: 'explore',
  // Saved places full data
  savedPlacesData: [],
  savedPlacesLoading: false,
  // Trips loading
  tripsLoading: false,
  // City loading state
  cityLoading: false,
  // Draft trip
  draftTrip: null,
  draftCards: [],
  // Current trip ID
  currentTripId: null,
  // Board refresh trigger - increment to force Board data reload
  boardRefreshTrigger: 0,
};

function filterPlaces(places: TravelPlace[], filter: string): TravelPlace[] {
  switch (filter) {
    case 'popular':
      return [...places].sort((a, b) => b.popularityScore - a.popularityScore);
    case 'top-rated':
      return [...places].sort((a, b) => b.rating - a.rating);
    case 'romantic':
      return places.filter(p =>
        p.categories.some(c =>
          ['romantic', 'spa', 'fine dining', 'scenic', 'views'].includes(c.toLowerCase())
        )
      );
    case 'food':
      return places.filter(p =>
        p.categories.some(c =>
          ['restaurant', 'food', 'cafe', 'dining', 'bakery', 'bar'].includes(c.toLowerCase())
        )
      );
    case 'nightlife':
      return places.filter(p =>
        p.categories.some(c =>
          ['nightlife', 'bar', 'club', 'lounge', 'pub'].includes(c.toLowerCase())
        )
      );
    case 'outdoor':
      return places.filter(p =>
        p.categories.some(c =>
          ['park', 'outdoor', 'nature', 'garden', 'beach', 'hiking', 'trail'].includes(c.toLowerCase())
        )
      );
    case 'free':
      return places.filter(p => p.priceLevel === 0 || p.priceLevel === undefined);
    default:
      return places;
  }
}

function travelReducer(state: TravelState, action: TravelAction): TravelState {
  switch (action.type) {
    case 'SET_CITY':
      return {
        ...state,
        city: action.payload,
        places: [],
        filteredPlaces: [],
        selectedPlace: null,
        aiSession: {
          ...initialAISession,
          sessionId: generateUUID(),
        },
      };

    case 'SET_PLACES':
      const filtered = filterPlaces(action.payload, state.activeFilter);
      const categorized = categorizePlaces(action.payload);
      return {
        ...state,
        places: action.payload,
        filteredPlaces: filtered,
        categorizedPlaces: categorized,
        placesLoading: false,
      };

    case 'SET_FILTER':
      return {
        ...state,
        activeFilter: action.payload,
        filteredPlaces: filterPlaces(state.places, action.payload),
      };

    case 'SET_QUICK_FILTER':
      return {
        ...state,
        quickFilter: action.payload,
      };

    case 'TOGGLE_MAP':
      return {
        ...state,
        showMap: !state.showMap,
      };

    case 'SET_SHOW_MAP':
      return {
        ...state,
        showMap: action.payload,
      };

    case 'SELECT_PLACE':
      return {
        ...state,
        selectedPlace: action.payload,
        drawerOpen: action.payload !== null,
      };

    case 'SET_DRAWER_OPEN':
      return {
        ...state,
        drawerOpen: action.payload,
        selectedPlace: action.payload ? state.selectedPlace : null,
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        aiSession: {
          ...state.aiSession,
          messages: [...state.aiSession.messages, action.payload],
        },
      };

    case 'SET_TRAVELER_PROFILE':
      return {
        ...state,
        aiSession: {
          ...state.aiSession,
          travelerProfile: action.payload,
        },
      };

    case 'SET_DURATION_DAYS':
      return {
        ...state,
        aiSession: {
          ...state.aiSession,
          durationDays: action.payload,
        },
      };

    case 'SET_PROFILE_COLLECTED':
      return {
        ...state,
        aiSession: {
          ...state.aiSession,
          profileCollected: action.payload,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_PLACES_LOADING':
      return {
        ...state,
        placesLoading: action.payload,
      };

    case 'SAVE_PLACE':
      if (state.savedPlaceIds.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        savedPlaceIds: [...state.savedPlaceIds, action.payload],
      };

    case 'UNSAVE_PLACE':
      return {
        ...state,
        savedPlaceIds: state.savedPlaceIds.filter(id => id !== action.payload),
      };

    case 'SET_SAVED_PLACE_IDS':
      return {
        ...state,
        savedPlaceIds: action.payload,
      };

    case 'SHOW_NEARBY_MODAL':
      return {
        ...state,
        showNearbyModal: true,
        nearbyPlace: action.payload,
      };

    case 'HIDE_NEARBY_MODAL':
      return {
        ...state,
        showNearbyModal: false,
        nearbyPlace: null,
      };

    case 'RESET':
      return initialState;

    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };

    case 'SET_SAVED_PLACES_DATA':
      return {
        ...state,
        savedPlacesData: action.payload,
        savedPlacesLoading: false,
      };

    case 'SET_SAVED_PLACES_LOADING':
      return {
        ...state,
        savedPlacesLoading: action.payload,
      };

    case 'SET_TRIPS_LOADING':
      return {
        ...state,
        tripsLoading: action.payload,
      };

    case 'SET_CITY_LOADING':
      return {
        ...state,
        cityLoading: action.payload,
      };

    case 'CREATE_DRAFT_TRIP':
      return {
        ...state,
        draftTrip: action.payload,
      };

    case 'ADD_TO_DRAFT_TRIP':
      return {
        ...state,
        draftCards: [...state.draftCards, action.payload],
      };

    case 'UPDATE_DRAFT_CARD':
      return {
        ...state,
        draftCards: state.draftCards.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };

    case 'REMOVE_FROM_DRAFT_TRIP':
      return {
        ...state,
        draftCards: state.draftCards.filter(c => c.id !== action.payload),
      };

    case 'CLEAR_DRAFT_TRIP':
      return {
        ...state,
        draftTrip: null,
        draftCards: [],
      };

    case 'SET_DRAFT_CARDS':
      return {
        ...state,
        draftCards: action.payload,
      };

    case 'SET_CURRENT_TRIP_ID':
      return {
        ...state,
        currentTripId: action.payload,
        // Also increment refresh trigger when trip ID changes
        boardRefreshTrigger: state.boardRefreshTrigger + 1,
      };

    case 'TRIGGER_BOARD_REFRESH':
      return {
        ...state,
        boardRefreshTrigger: state.boardRefreshTrigger + 1,
      };

    default:
      return state;
  }
}

interface TravelContextValue {
  state: TravelState;
  dispatch: React.Dispatch<TravelAction>;
  // Convenience actions
  setCity: (city: CityData) => void;
  setFilter: (filter: string) => void;
  toggleMap: () => void;
  selectPlace: (place: TravelPlace | null) => void;
  addMessage: (message: AIMessage) => void;
  setTravelerProfile: (profile: TravelerProfile) => void;
  setDurationDays: (days: number) => void;
  fetchPlaces: (coordinates: { lat: number; lng: number }, cityName?: string, forceRefresh?: boolean) => Promise<void>;
  savePlace: (placeId: string) => void;
  unsavePlace: (placeId: string) => void;
  isPlaceSaved: (placeId: string) => boolean;
  showNearby: (place: TravelPlace) => void;
  hideNearby: () => void;
  // Tab navigation
  setActiveTab: (tab: TravelTab) => void;
  fetchSavedPlacesData: () => Promise<void>;
  // City loading
  setCityLoading: (loading: boolean) => void;
  // Draft trip actions
  createDraftTrip: (tripData: Partial<import('@/lib/travel/types').DraftTrip>) => void;
  addToTrip: (place: TravelPlace, cardType: 'hotel' | 'spot' | 'food' | 'activity') => boolean;
  saveDraftTripToDatabase: () => Promise<any>;
  createAndSaveTripToDatabase: (
    tripData: Partial<import('@/lib/travel/types').DraftTrip>,
    initialPlace?: { place: TravelPlace; cardType: 'hotel' | 'spot' | 'food' | 'activity' }
  ) => Promise<{ success: boolean; trip?: any; error?: string }>;
  resumeTripCreationFromStorage: () => Promise<{ place: TravelPlace; cardType: 'hotel' | 'spot' | 'food' | 'activity' } | null>;
}

const TravelContext = createContext<TravelContextValue | null>(null);

export function TravelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(travelReducer, initialState);

  // Places cache hook - caches API results for 30 minutes
  const { getCachedPlaces, setCachedPlaces, isCacheValid, generateCityKey, isReady: cacheReady } = usePlacesCache(30);

  const setCity = useCallback((city: CityData) => {
    dispatch({ type: 'SET_CITY', payload: city });
  }, []);

  const setFilter = useCallback((filter: string) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const toggleMap = useCallback(() => {
    dispatch({ type: 'TOGGLE_MAP' });
  }, []);

  const selectPlace = useCallback((place: TravelPlace | null) => {
    dispatch({ type: 'SELECT_PLACE', payload: place });
  }, []);

  const addMessage = useCallback((message: AIMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const setTravelerProfile = useCallback((profile: TravelerProfile) => {
    dispatch({ type: 'SET_TRAVELER_PROFILE', payload: profile });
    dispatch({ type: 'SET_PROFILE_COLLECTED', payload: true });
  }, []);

  const setDurationDays = useCallback((days: number) => {
    dispatch({ type: 'SET_DURATION_DAYS', payload: days });
  }, []);

  const fetchPlaces = useCallback(async (
    coordinates: { lat: number; lng: number },
    cityName?: string,
    forceRefresh?: boolean
  ) => {
    // Generate cache key for this city
    const cityKey = cityName ? generateCityKey(cityName, coordinates) : null;

    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && cityKey && cacheReady) {
      const cached = getCachedPlaces(cityKey);
      if (cached && isCacheValid(cached)) {
        // Cache hit - use cached data immediately (no loading spinner)
        console.log(`[PlacesCache] Cache hit for ${cityName} - loading ${cached.places.length} places instantly`);
        dispatch({ type: 'SET_PLACES', payload: cached.places });
        return;
      }
    }

    // Cache miss or force refresh - fetch from API
    dispatch({ type: 'SET_PLACES_LOADING', payload: true });
    try {
      const params = new URLSearchParams({
        lat: coordinates.lat.toString(),
        lng: coordinates.lng.toString(),
        radius: '10000',
      });
      if (cityName) {
        params.set('city', cityName);
      }
      const response = await fetch(`/api/travel/places?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const places = data.places || [];

        // Save to cache for next time
        if (cityName && cityKey) {
          setCachedPlaces(cityName, coordinates, places);
          console.log(`[PlacesCache] Cached ${places.length} places for ${cityName}`);
        }

        dispatch({ type: 'SET_PLACES', payload: places });
      } else {
        dispatch({ type: 'SET_PLACES_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to fetch places:', error);
      dispatch({ type: 'SET_PLACES_LOADING', payload: false });
    }
  }, [generateCityKey, getCachedPlaces, setCachedPlaces, isCacheValid, cacheReady]);

  const savePlace = useCallback(async (placeId: string, placeData?: TravelPlace) => {
    dispatch({ type: 'SAVE_PLACE', payload: placeId });

    // Save to localStorage for persistence (works for guests too)
    try {
      const saved = JSON.parse(localStorage.getItem('voyagr_saved_places') || '[]');
      if (!saved.includes(placeId)) {
        saved.push(placeId);
        localStorage.setItem('voyagr_saved_places', JSON.stringify(saved));
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    // Also sync to server if authenticated
    try {
      const response = await fetch('/api/travel/saved-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, placeData }),
      });
      // Silent fail - localStorage is the backup
      if (!response.ok && response.status !== 401) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.warn(`Failed to sync saved place to server (status ${response.status}):`, errorData);
        console.info('Place saved locally. Server sync will be attempted on next session.');
      }
    } catch (e) {
      // Silent fail - localStorage is the backup
      console.debug('Could not sync saved place to server (network or auth issue). Place saved locally.');
    }
  }, []);

  const unsavePlace = useCallback(async (placeId: string) => {
    dispatch({ type: 'UNSAVE_PLACE', payload: placeId });

    // Remove from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('voyagr_saved_places') || '[]');
      const updated = saved.filter((id: string) => id !== placeId);
      localStorage.setItem('voyagr_saved_places', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update localStorage:', e);
    }

    // Also sync to server if authenticated
    try {
      const response = await fetch(`/api/travel/saved-places?placeId=${placeId}`, {
        method: 'DELETE',
      });
      // Silent fail - localStorage is the backup
      if (!response.ok && response.status !== 401) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.warn(`Failed to sync unsave to server (status ${response.status}):`, errorData);
        console.info('Place removed locally. Server sync will be attempted on next session.');
      }
    } catch (e) {
      // Silent fail - localStorage is the backup
      console.debug('Could not sync unsave to server (network or auth issue). Place removed locally.');
    }
  }, []);

  const isPlaceSaved = useCallback((placeId: string) => {
    return state.savedPlaceIds.includes(placeId);
  }, [state.savedPlaceIds]);

  const showNearby = useCallback((place: TravelPlace) => {
    dispatch({ type: 'SHOW_NEARBY_MODAL', payload: place });
  }, []);

  const hideNearby = useCallback(() => {
    dispatch({ type: 'HIDE_NEARBY_MODAL' });
  }, []);

  const setActiveTab = useCallback((tab: TravelTab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  const setCityLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_CITY_LOADING', payload: loading });
  }, []);

  const fetchSavedPlacesData = useCallback(async () => {
    if (state.savedPlaceIds.length === 0) {
      dispatch({ type: 'SET_SAVED_PLACES_DATA', payload: [] });
      return;
    }

    dispatch({ type: 'SET_SAVED_PLACES_LOADING', payload: true });
    try {
      // Fetch full place data for each saved place ID
      const placePromises = state.savedPlaceIds.map(async (placeId) => {
        try {
          const response = await fetch(`/api/travel/place/details?id=${placeId}`);
          if (response.ok) {
            const data = await response.json();
            return data.place as TravelPlace;
          }
        } catch (e) {
          console.error(`Failed to fetch place ${placeId}:`, e);
        }
        return null;
      });

      const places = await Promise.all(placePromises);
      const validPlaces = places.filter((p): p is TravelPlace => p !== null);
      dispatch({ type: 'SET_SAVED_PLACES_DATA', payload: validPlaces });
    } catch (error) {
      console.error('Failed to fetch saved places data:', error);
      dispatch({ type: 'SET_SAVED_PLACES_LOADING', payload: false });
    }
  }, [state.savedPlaceIds]);

  // Draft trip helper functions
  const createDraftTrip = useCallback((tripData: Partial<DraftTrip>) => {
    const newTrip: DraftTrip = {
      name: tripData.name || `${state.city?.name} Trip`,
      destination: state.city?.name || '',
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      homeCity: tripData.homeCity,
      tripType: tripData.tripType,
      createdAt: Date.now(),
    };

    dispatch({ type: 'CREATE_DRAFT_TRIP', payload: newTrip });
  }, [state.city]);

  const addToTrip = useCallback((place: TravelPlace, cardType: 'hotel' | 'spot' | 'food' | 'activity') => {
    // If no draft trip, return false to trigger modal
    if (!state.draftTrip) {
      return false;
    }

    // Create draft card
    const newCard: DraftCard = {
      id: `draft-${Date.now()}-${Math.random()}`,
      type: cardType,
      placeData: place,
      labels: ['considering'],
      addedAt: Date.now(),
    };

    dispatch({ type: 'ADD_TO_DRAFT_TRIP', payload: newCard });
    return true;
  }, [state.draftTrip]);

  const createAndSaveTripToDatabase = useCallback(async (
    tripData: Partial<DraftTrip>,
    initialPlace?: { place: TravelPlace; cardType: 'hotel' | 'spot' | 'food' | 'activity' }
  ): Promise<{ success: boolean; trip?: any; error?: string }> => {
    try {
      // Create trip in database
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tripData.name,
          destination: {
            name: tripData.destination || state.city?.name,
            place_id: state.city?.placeId || '',
            coordinates: state.city?.coordinates,
          },
          dates: {
            start: tripData.startDate || new Date().toISOString().split('T')[0],
            end: tripData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
          party_json: { adults: 2 },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Failed to create trip' };
      }

      const { trip } = await response.json();

      // Add first place as card if provided
      if (initialPlace) {
        await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trip_id: trip.id,
            type: initialPlace.cardType,
            payload_json: initialPlace.place,
            labels: ['considering'],
          }),
        });
      }

      // Set as current trip
      dispatch({ type: 'SET_CURRENT_TRIP_ID', payload: trip.id });
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'board' });

      return { success: true, trip };
    } catch (error) {
      console.error('Failed to create trip:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [state.city]);

  const resumeTripCreationFromStorage = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    const pendingData = window.sessionStorage.getItem('voyagr_pending_place');
    if (!pendingData) return null;

    try {
      const { place, cardType, timestamp } = JSON.parse(pendingData);

      // Check if data is not stale (< 5 minutes)
      const MAX_AGE = 5 * 60 * 1000;
      if (Date.now() - timestamp >= MAX_AGE) {
        window.sessionStorage.removeItem('voyagr_pending_place');
        return null;
      }

      // Clear storage
      window.sessionStorage.removeItem('voyagr_pending_place');

      return { place, cardType };
    } catch (error) {
      console.error('Failed to parse pending place:', error);
      window.sessionStorage.removeItem('voyagr_pending_place');
      return null;
    }
  }, []);

  const saveDraftTripToDatabase = useCallback(async () => {
    if (!state.draftTrip) return null;

    // Convert draft trip + cards to database format
    const tripData = {
      title: state.draftTrip.name,
      destination: {
        name: state.draftTrip.destination,
        place_id: state.city?.placeId || '',
        coordinates: state.city?.coordinates,
      },
      dates: state.draftTrip.startDate && state.draftTrip.endDate ? {
        start: state.draftTrip.startDate,
        end: state.draftTrip.endDate,
      } : undefined,
    };

    try {
      // Create trip
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData),
      });

      if (!response.ok) {
        throw new Error('Failed to create trip');
      }

      const { trip } = await response.json();

      // Save all cards
      await Promise.all(state.draftCards.map(card =>
        fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trip_id: trip.id,
            type: card.type,
            payload_json: card.placeData,
            labels: card.labels,
            day: card.day,
            time_slot: card.time_slot,
            order: card.order,
          }),
        })
      ));

      // Clear draft
      dispatch({ type: 'CLEAR_DRAFT_TRIP' });

      return trip;
    } catch (error) {
      console.error('Failed to save draft trip to database:', error);
      return null;
    }
  }, [state.draftTrip, state.draftCards, state.city]);

  // Load draft trip from localStorage on mount
  useEffect(() => {
    try {
      const savedDraftTrip = localStorage.getItem('voyagr_draft_trip');
      const savedDraftCards = localStorage.getItem('voyagr_draft_cards');

      if (savedDraftTrip) {
        dispatch({ type: 'CREATE_DRAFT_TRIP', payload: JSON.parse(savedDraftTrip) });
      }
      if (savedDraftCards) {
        dispatch({ type: 'SET_DRAFT_CARDS', payload: JSON.parse(savedDraftCards) });
      }
    } catch (e) {
      console.error('Failed to load draft trip from localStorage:', e);
    }
  }, []);

  // Save draft trip to localStorage on change
  useEffect(() => {
    if (state.draftTrip) {
      localStorage.setItem('voyagr_draft_trip', JSON.stringify(state.draftTrip));
    } else {
      localStorage.removeItem('voyagr_draft_trip');
    }
  }, [state.draftTrip]);

  // Save draft cards to localStorage on change
  useEffect(() => {
    localStorage.setItem('voyagr_draft_cards', JSON.stringify(state.draftCards));
  }, [state.draftCards]);

  // Auto-create draft trip when user navigates to a city
  // This ensures Board tab shows trip context instead of "No trip yet"
  useEffect(() => {
    if (!state.city || state.currentTripId) {
      // No city set, or user has a saved trip - don't auto-create
      return;
    }

    if (state.draftTrip) {
      // Draft exists - check if it matches current city
      if (state.draftTrip.destination !== state.city.name && state.draftCards.length === 0) {
        // Draft is for different city with no cards - update to current city
        const updatedDraft: DraftTrip = {
          ...state.draftTrip,
          name: `${state.city.name} Trip`,
          destination: state.city.name,
        };
        dispatch({ type: 'CREATE_DRAFT_TRIP', payload: updatedDraft });
      }
      // If draft has cards, keep it (user may want to finish planning that trip)
    } else {
      // No draft trip at all - create one for current city
      const newDraftTrip: DraftTrip = {
        name: `${state.city.name} Trip`,
        destination: state.city.name,
        createdAt: Date.now(),
      };
      dispatch({ type: 'CREATE_DRAFT_TRIP', payload: newDraftTrip });
    }
  }, [state.city?.name, state.currentTripId]);

  // Load saved places from localStorage and server on mount
  React.useEffect(() => {
    const loadSavedPlaces = async () => {
      // First load from localStorage (instant)
      let localSaved: string[] = [];
      try {
        localSaved = JSON.parse(localStorage.getItem('voyagr_saved_places') || '[]');
        if (localSaved.length > 0) {
          dispatch({ type: 'SET_SAVED_PLACE_IDS', payload: localSaved });
        }
      } catch (e) {
        console.error('Failed to load saved places from localStorage:', e);
      }

      // Then try to fetch from server (for authenticated users)
      try {
        const response = await fetch('/api/travel/saved-places');
        if (response.ok) {
          const data = await response.json();
          const serverSaved = data.savedPlaceIds || [];

          // Merge local and server saved places
          const merged = [...new Set([...localSaved, ...serverSaved])];

          if (merged.length > 0) {
            dispatch({ type: 'SET_SAVED_PLACE_IDS', payload: merged });
            // Update localStorage with merged data
            localStorage.setItem('voyagr_saved_places', JSON.stringify(merged));
          }
        }
      } catch (e) {
        // Silent fail - localStorage data is still available
      }
    };

    loadSavedPlaces();
  }, []);

  const value: TravelContextValue = {
    state,
    dispatch,
    setCity,
    setFilter,
    toggleMap,
    selectPlace,
    addMessage,
    setTravelerProfile,
    setDurationDays,
    fetchPlaces,
    savePlace,
    unsavePlace,
    isPlaceSaved,
    showNearby,
    hideNearby,
    setActiveTab,
    fetchSavedPlacesData,
    setCityLoading,
    createDraftTrip,
    addToTrip,
    saveDraftTripToDatabase,
    createAndSaveTripToDatabase,
    resumeTripCreationFromStorage,
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
}

export function useTravel() {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravel must be used within a TravelProvider');
  }
  return context;
}
