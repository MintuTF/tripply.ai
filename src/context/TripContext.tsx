'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { Card, Trip } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDraftTrip, DraftTripData } from '@/hooks/useLocalStorage';
import { recalculateTripTravelInfo } from '@/lib/utils/itinerary';

interface CreateTripData {
  title: string;
  destination?: {
    name: string;
    place_id?: string;
    coordinates?: { lat: number; lng: number };
  };
  dates: {
    start: string;
    end: string;
  };
  party_json?: {
    adults: number;
    children?: number;
    infants?: number;
  };
}

interface TripContextType {
  // State
  cards: Card[];
  trip: Partial<Trip> | null;
  activeView: 'map' | 'board' | 'chat';
  isModified: boolean;
  isSaving: boolean;
  isHydrated: boolean;

  // Card actions
  addCard: (card: Card) => void;
  updateCard: (card: Card) => void;
  deleteCard: (cardId: string) => void;

  // Trip actions
  updateTrip: (updates: Partial<Trip>) => void;
  setActiveView: (view: 'map' | 'board' | 'chat') => void;

  // Save actions
  saveToDatabase: (tripData?: CreateTripData) => Promise<{ success: boolean; tripId?: string; error?: string }>;
  clearDraft: () => void;

  // Auth-gated action state
  showSignInModal: boolean;
  setShowSignInModal: (show: boolean) => void;
  showCreateTripModal: boolean;
  setShowCreateTripModal: (show: boolean) => void;
  pendingAction: 'save' | 'share' | null;
  setPendingAction: (action: 'save' | 'share' | null) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function useTripContext() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTripContext must be used within a TripProvider');
  }
  return context;
}

interface TripProviderProps {
  children: ReactNode;
}

export function TripProvider({ children }: TripProviderProps) {
  const { user } = useAuth();
  const { draft, updateDraft, clearDraft: clearLocalDraft, isHydrated } = useDraftTrip();

  // Local state that syncs with localStorage
  const [cards, setCards] = useState<Card[]>([]);
  const [trip, setTrip] = useState<Partial<Trip> | null>(null);
  const [activeView, setActiveView] = useState<'map' | 'board' | 'chat'>('map');
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Auth modal state
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);

  // Initialize pendingAction from localStorage to survive auth redirects
  const [pendingActionState, setPendingActionState] = useState<'save' | 'share' | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('voyagr_pending_action');
      if (stored === 'save' || stored === 'share') {
        return stored;
      }
    }
    return null;
  });

  // Wrapper to sync pendingAction to localStorage
  const setPendingAction = useCallback((action: 'save' | 'share' | null) => {
    setPendingActionState(action);
    if (typeof window !== 'undefined') {
      if (action) {
        localStorage.setItem('voyagr_pending_action', action);
      } else {
        localStorage.removeItem('voyagr_pending_action');
      }
    }
  }, []);

  // Hydrate state from localStorage on mount (only once)
  useEffect(() => {
    if (isHydrated && !hasInitialized) {
      setCards(draft?.cards || []);
      setTrip({
        id: draft?.trip?.id || 'draft',
        title: draft?.trip?.title || 'My Trip',
        dates: draft?.trip?.dates || undefined,
      } as Partial<Trip>);
      setHasInitialized(true);
    }
  }, [isHydrated, hasInitialized, draft]);

  // Sync cards to localStorage whenever they change (after initialization)
  useEffect(() => {
    if (hasInitialized) {
      updateDraft({ cards });
      setIsModified(true);
    }
  }, [cards, hasInitialized, updateDraft]);

  // Card actions
  const addCard = useCallback((newCard: Card) => {
    setCards((prev) => {
      // Check for duplicates
      const exists = prev.some((c) => c.id === newCard.id);
      if (exists) {
        return prev.map((c) => (c.id === newCard.id ? newCard : c));
      }
      return [...prev, newCard];
    });
  }, []);

  const updateCard = useCallback((updatedCard: Card) => {
    setCards((prev) => {
      const newCards = prev.map((c) =>
        c.id === updatedCard.id ? updatedCard : c
      );
      // Recalculate travel info if card has a day assigned
      if (updatedCard.day) {
        return recalculateTripTravelInfo(newCards);
      }
      return newCards;
    });
  }, []);

  const deleteCard = useCallback((cardId: string) => {
    setCards((prev) => {
      const remaining = prev.filter((c) => c.id !== cardId);
      return recalculateTripTravelInfo(remaining);
    });
  }, []);

  // Trip actions
  const updateTrip = useCallback(
    (updates: Partial<Trip>) => {
      setTrip((prev) => ({ ...prev, ...updates }));
      updateDraft({
        trip: {
          id: trip?.id || 'draft',
          title: updates.title || trip?.title || 'My Trip',
          dates: updates.dates || trip?.dates || null,
          destination: null,
        },
      });
    },
    [trip, updateDraft]
  );

  // Save to database
  const saveToDatabase = useCallback(async (tripData?: CreateTripData) => {
    if (!user) {
      setShowSignInModal(true);
      setPendingAction('save');
      return { success: false, error: 'Not authenticated' };
    }

    // If no trip data provided, show create trip modal
    if (!tripData) {
      setShowCreateTripModal(true);
      return { success: false, error: 'Trip details required' };
    }

    setIsSaving(true);

    try {
      // Create trip with provided data
      const tripResponse = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tripData.title,
          destination: tripData.destination,
          dates: tripData.dates,
          party_json: tripData.party_json || { adults: 2 },
        }),
      });

      if (!tripResponse.ok) {
        const error = await tripResponse.json();
        throw new Error(error.error || 'Failed to create trip');
      }

      const { trip: savedTrip } = await tripResponse.json();

      // Save all cards to the trip
      if (cards.length > 0) {
        const cardPromises = cards.map((card) =>
          fetch('/api/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trip_id: savedTrip.id,
              type: card.type,
              payload_json: card.payload_json,
              labels: card.labels || ['considering'],
              favorite: card.favorite || false,
              day: card.day,
              time_slot: card.time_slot,
              order: card.order,
            }),
          })
        );

        await Promise.all(cardPromises);
      }

      // Clear local draft
      clearLocalDraft();
      setIsModified(false);
      setShowCreateTripModal(false);

      return { success: true, tripId: savedTrip.id };
    } catch (error) {
      console.error('Error saving trip:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save',
      };
    } finally {
      setIsSaving(false);
    }
  }, [user, cards, clearLocalDraft]);

  // Clear draft
  const clearDraft = useCallback(() => {
    clearLocalDraft();
    setCards([]);
    setTrip({
      id: 'draft',
      title: 'My Trip',
    } as Partial<Trip>);
    setIsModified(false);
  }, [clearLocalDraft]);

  // Handle pending action after sign-in
  useEffect(() => {
    if (user && pendingActionState === 'save') {
      // After sign-in, show the create trip modal instead of auto-saving
      setShowCreateTripModal(true);
      setPendingAction(null); // This also clears localStorage
    }
  }, [user, pendingActionState, setPendingAction]);

  const value: TripContextType = {
    cards,
    trip,
    activeView,
    isModified,
    isSaving,
    isHydrated: hasInitialized,
    addCard,
    updateCard,
    deleteCard,
    updateTrip,
    setActiveView,
    saveToDatabase,
    clearDraft,
    showSignInModal,
    setShowSignInModal,
    showCreateTripModal,
    setShowCreateTripModal,
    pendingAction: pendingActionState,
    setPendingAction,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
