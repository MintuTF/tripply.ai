import type { Trip, PlaceCard } from '@/types';
import { createClient } from '@/lib/supabase/client';

/**
 * Check if user is authenticated
 */
async function isUserAuthenticated(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
}

/**
 * Create a new research trip in the database
 */
export async function createResearchTrip(destination: string): Promise<Trip | null> {
  // Check auth status first
  const isAuthenticated = await isUserAuthenticated();

  if (!isAuthenticated) {
    // Guest mode: use localStorage directly
    console.log('Guest mode: Creating local research draft');
    return createLocalResearchDraft(destination);
  }

  // Authenticated: try API with localStorage fallback
  try {
    const response = await fetch('/api/research/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: { name: destination },
        status: 'researching',
      }),
    });

    if (response.status === 401 || !response.ok) {
      // Auth expired or error - fall back to localStorage
      console.log('API error - falling back to local storage');
      return createLocalResearchDraft(destination);
    }

    const { trip } = await response.json();
    return trip;
  } catch (error) {
    console.error('Error creating research trip:', error);
    // Network error - fall back to localStorage
    return createLocalResearchDraft(destination);
  }
}

/**
 * Check for existing research trip for destination
 */
export async function checkExistingResearchTrip(
  destination: string
): Promise<Trip | null> {
  const isAuthenticated = await isUserAuthenticated();

  if (!isAuthenticated) {
    // Guest mode: check localStorage only
    return loadLocalResearchDraft(destination);
  }

  // Authenticated: try API first, then localStorage
  try {
    const response = await fetch(
      `/api/research/trips?destination=${encodeURIComponent(destination)}&status=researching`
    );

    if (response.ok) {
      const { trips } = await response.json();
      if (trips && trips.length > 0) {
        return trips[0];
      }
    }

    // API returned nothing - check localStorage as fallback
    return loadLocalResearchDraft(destination);
  } catch (error) {
    console.error('Error checking existing research trip:', error);
    // On error, fall back to localStorage
    return loadLocalResearchDraft(destination);
  }
}

/**
 * Transition trip from researching to planning status
 */
export async function transitionTripToPlanning(tripId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/research/trips/${tripId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'planning' }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error transitioning trip to planning:', error);
    return false;
  }
}

/**
 * Load saved cards for a trip
 */
export async function loadTripCards(tripId: string) {
  try {
    const response = await fetch(`/api/cards?trip_id=${tripId}`);

    if (!response.ok) {
      return [];
    }

    const { cards } = await response.json();
    return cards || [];
  } catch (error) {
    console.error('Error loading trip cards:', error);
    return [];
  }
}

/**
 * Create local research draft for unauthenticated users
 */
export function createLocalResearchDraft(destination: string): Trip {
  const draftId = `research-draft-${destination.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

  const trip: Trip = {
    id: draftId,
    title: `Research: ${destination}`,
    destination: {
      name: destination,
      country: '',
      coordinates: { lat: 0, lng: 0 },
    },
    status: 'researching',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to localStorage
  try {
    const key = `voyagr_research_${destination.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(trip));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }

  return trip;
}

/**
 * Load local research draft
 */
export function loadLocalResearchDraft(destination: string): Trip | null {
  try {
    const key = `voyagr_research_${destination.toLowerCase()}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}

/**
 * Save card to localStorage for local research drafts
 */
export function saveCardToLocalDraft(
  destination: string,
  place: PlaceCard,
  label: string = 'considering',
  day?: number
): boolean {
  try {
    const key = `voyagr_research_cards_${destination.toLowerCase()}`;
    const stored = localStorage.getItem(key);
    const cards: Array<any> = stored ? JSON.parse(stored) : [];

    const newCard = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: place.type || 'spot',
      payload_json: place,
      labels: [label],
      favorite: false,
      day,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    cards.push(newCard);
    localStorage.setItem(key, JSON.stringify(cards));
    return true;
  } catch (error) {
    console.error('Error saving card to localStorage:', error);
    return false;
  }
}

/**
 * Load cards from localStorage for local research drafts
 */
export function loadCardsFromLocalDraft(destination: string): any[] {
  try {
    const key = `voyagr_research_cards_${destination.toLowerCase()}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading cards from localStorage:', error);
    return [];
  }
}

/**
 * Remove card from localStorage
 */
export function removeCardFromLocalDraft(destination: string, cardId: string): boolean {
  try {
    const key = `voyagr_research_cards_${destination.toLowerCase()}`;
    const stored = localStorage.getItem(key);
    if (!stored) return false;

    const cards = JSON.parse(stored);
    const filtered = cards.filter((c: any) => c.id !== cardId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing card from localStorage:', error);
    return false;
  }
}
