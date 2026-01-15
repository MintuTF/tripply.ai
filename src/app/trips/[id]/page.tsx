'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TripBoard } from '@/components/board/TripBoard';
import { CompareDrawer } from '@/components/board/CompareDrawer';
import { ChatBoard } from '@/components/chat-board/ChatBoard';
import { ExportMenu } from '@/components/trip/ExportMenu';
import { PrintableItinerary } from '@/components/trip/PrintableItinerary';
import { Card, Trip, TripView, SaveStatus, ConflictInfo } from '@/types';
import { MarketplaceView } from '@/components/marketplace/MarketplaceView';
import { MapView } from '@/components/board/MapView';
import { useAutoSave } from '@/hooks/useAutoSave';
import SaveIndicator from '@/components/board/SaveIndicator';
import { ConflictModal } from '@/components/board/ConflictModal';
import { PlacesSearchSidebar } from '@/components/map/PlacesSearchSidebar';
import { FloatingCardDetail } from '@/components/map/FloatingCardDetail';
import { ResearchView } from '@/components/research/ResearchView';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserMenu } from '@/components/auth/UserMenu';
import { SignInButton } from '@/components/auth/SignInButton';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { CreateTripModal, CreateTripData } from '@/components/trip/CreateTripModal';
import Link from 'next/link';
import {
  Sparkles,
  LayoutDashboard,
  ShoppingBag,
  Map as MapIcon,
  MessageSquare,
  Loader2,
  Save,
  ArrowLeft,
  Pencil,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { recalculateTripTravelInfo } from '@/lib/utils/itinerary';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TripPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial view from URL or default to 'board'
  const viewFromUrl = searchParams.get('view') as TripView | null;
  const initialView: TripView = viewFromUrl && ['board', 'map', 'chat', 'marketplace', 'research'].includes(viewFromUrl) ? viewFromUrl : 'board';

  // Trip and cards state from database
  const [trip, setTrip] = useState<Trip | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // UI state
  const [compareCards, setCompareCards] = useState<Card[]>([]);
  const [activeView, setActiveView] = useState<TripView>(initialView);

  // Update URL when view changes
  const handleViewChange = useCallback((view: TripView) => {
    setActiveView(view);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(undefined);
  const [hoveredCardId, setHoveredCardId] = useState<string | undefined>(undefined);
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [searchResults, setSearchResults] = useState<Card[] | null>(null);
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showEditTripModal, setShowEditTripModal] = useState(false);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: 'saved' });
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Initialize auto-save hook
  const autoSave = useAutoSave({
    tripId: resolvedParams.id,
    onStatusChange: setSaveStatus,
    onError: (error) => {
      console.error('Auto-save error:', error);
      setToastMessage('Failed to save changes');
    },
    onConflict: (detectedConflicts) => {
      setConflicts(detectedConflicts);
      setShowConflictModal(true);
    },
    onSuccess: () => {
      // Optionally show success toast, but auto-save indicator handles this
    },
  });

  // Fetch trip and cards from database
  useEffect(() => {
    const fetchTripData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch trip
        const tripResponse = await fetch(`/api/trips/${resolvedParams.id}`);
        if (!tripResponse.ok) {
          if (tripResponse.status === 404) {
            setError('Trip not found');
          } else {
            throw new Error('Failed to fetch trip');
          }
          return;
        }
        const tripData = await tripResponse.json();
        setTrip(tripData.trip);

        // Fetch cards for this trip
        const cardsResponse = await fetch(`/api/cards?trip_id=${resolvedParams.id}`);
        if (cardsResponse.ok) {
          const cardsData = await cardsResponse.json();
          setCards(cardsData.cards || []);
        }
      } catch (err) {
        console.error('Error fetching trip:', err);
        setError('Failed to load trip');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTripData();
  }, [resolvedParams.id]);

  // Clear trip data and redirect on logout
  useEffect(() => {
    // Skip during initial auth loading
    if (authLoading) return;

    // If user logged out and we have trip data, clear it and redirect
    if (!user && trip) {
      setTrip(null);
      setCards([]);
      router.push('/');
    }
  }, [user, authLoading, trip, router]);

  const handleCardUpdate = (updatedCard: Card) => {
    // Use functional update to properly handle multiple rapid updates
    setCards(prevCards => {
      const newCards = prevCards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
      if (updatedCard.day) {
        return recalculateTripTravelInfo(newCards);
      }
      return newCards;
    });

    // Determine priority based on what changed
    const priority = updatedCard.day !== undefined || updatedCard.labels ? 'critical' :
                     updatedCard.time_slot || updatedCard.travel_mode ? 'medium' : 'low';

    // Queue for auto-save instead of immediate API call
    autoSave.queueChange(updatedCard.id, updatedCard, priority);
  };

  const handleCardDelete = (cardId: string) => {
    // Optimistic update
    const remaining = cards.filter((c) => c.id !== cardId);
    const recalculated = recalculateTripTravelInfo(remaining);
    setCards(recalculated);

    // Queue deletion with critical priority (500ms debounce)
    autoSave.queueDelete(cardId);
  };

  const handleCardDuplicate = async (card: Card) => {
    try {
      // Migrate old 'booked' label to 'confirmed' if present
      const migratedLabels = (card.labels || []).map(l => l === 'booked' ? 'confirmed' : l);

      // Create duplicate card data (copy content, place in same column as original)
      const duplicateCardData = {
        trip_id: resolvedParams.id,
        type: card.type,
        payload_json: card.payload_json,
        labels: migratedLabels, // Keep same column as original card (with migrated labels)
        favorite: false,
        day: card.day, // Keep same day if assigned
        time_slot: card.time_slot,
        order: card.order !== undefined ? card.order + 0.5 : undefined, // Place after original
      };

      // Save to database
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateCardData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Duplicate API error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to duplicate card');
      }

      const data = await response.json();

      if (!data.card) {
        throw new Error('No card returned from API');
      }

      const savedCard = {
        ...data.card,
        labels: data.card.labels || ['considering'], // Ensure labels is always an array
      };

      // Add to local state
      setCards(prev => [...prev, savedCard]);
      const payload = card.payload_json as any;
      setToastMessage(`"${payload.name || payload.title || 'Card'}" duplicated`);
    } catch (err) {
      console.error('Error duplicating card:', err);
      setToastMessage('Failed to duplicate card');
    }
  };

  const handleAddCard = (newCard: Card) => {
    // Check if card already exists
    const exists = cards.some((c) => c.id === newCard.id);
    if (exists) {
      handleCardUpdate(newCard);
      return;
    }

    // Add to local state
    setCards(prev => [...prev, newCard]);
    const payload = newCard.payload_json as any;
    const cardName = payload?.name || 'Item';
    setToastMessage(`"${cardName}" added to Considering`);

    // Only sync to database if card doesn't have a real ID (temp cards from guest mode)
    // Cards with real IDs were already saved by the component that created them
    if (!newCard.id || newCard.id.startsWith('temp-')) {
      // Queue for auto-save with critical priority
      autoSave.queueChange(newCard.id, newCard, 'critical');
    }
  };

  const handleCompare = (selectedCards: Card[]) => {
    setCompareCards(selectedCards);
  };

  const handleResolveConflicts = async (resolutions: Record<string, 'mine' | 'theirs'>) => {
    // Handle conflict resolutions
    for (const [cardId, resolution] of Object.entries(resolutions)) {
      const conflict = conflicts.find(c => c.cardId === cardId);
      if (!conflict) continue;

      if (resolution === 'mine') {
        // Keep local version - queue it with critical priority to overwrite server
        const localCard = cards.find(c => c.id === cardId);
        if (localCard) {
          autoSave.queueChange(cardId, localCard, 'critical');
        }
      } else {
        // Use server version - fetch and apply it
        try {
          const response = await fetch(`/api/cards/${cardId}`);
          if (response.ok) {
            const data = await response.json();
            const serverCard = data.card;
            // Update local state with server version
            setCards(prevCards => {
              const newCards = prevCards.map(c => c.id === cardId ? serverCard : c);
              return recalculateTripTravelInfo(newCards);
            });
          }
        } catch (err) {
          console.error('Error fetching server version:', err);
          setToastMessage('Failed to fetch server version');
        }
      }
    }

    // Clear conflicts
    setConflicts([]);
    setShowConflictModal(false);
    setToastMessage('Conflicts resolved');
  };

  const handleTripUpdate = async (updates: Partial<Trip>) => {
    if (!trip) return;

    // Update local state
    setTrip((prev) => (prev ? { ...prev, ...updates } : prev));

    // Sync to database
    try {
      const response = await fetch(`/api/trips/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update trip');
      }

      setToastMessage('Trip updated');
    } catch (err) {
      console.error('Error updating trip:', err);
      setToastMessage('Failed to update trip');
    }
  };

  const handleArchive = async () => {
    await handleTripUpdate({ status: 'archived' });
    setToastMessage('Trip archived');
    router.push('/my-trips');
  };

  const handleEditTrip = async (tripData: CreateTripData) => {
    if (!trip) return;

    try {
      const response = await fetch(`/api/trips/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tripData.title,
          destination: tripData.destination,
          dates: tripData.dates,
          party_json: tripData.party_json,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update trip');
      }

      // Update local state
      setTrip((prev) =>
        prev
          ? {
              ...prev,
              title: tripData.title,
              destination: tripData.destination,
              dates: tripData.dates,
              party_json: tripData.party_json || prev.party_json,
            }
          : prev
      );

      setShowEditTripModal(false);
      setToastMessage('Trip updated!');
    } catch (err) {
      console.error('Error updating trip:', err);
      setToastMessage('Failed to update trip');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !trip) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{error || 'Trip not found'}</p>
        <Link
          href="/plan"
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border/50 glassmorphism shadow-sm relative z-50">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  Tripply
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  {trip.title}
                </p>
              </div>
            </Link>
          </div>

          {/* View Switcher & Actions */}
          <div className="flex items-center gap-3">
            {/* Edit Trip Button - only show when authenticated */}
            {user && (
              <button
                onClick={() => setShowEditTripModal(true)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  'border border-border hover:bg-accent'
                )}
              >
                <Pencil className="h-4 w-4" />
                Edit Trip
              </button>
            )}

            {/* Export Menu - only show when authenticated */}
            {user && <ExportMenu trip={trip} cards={cards} />}

            <div className="flex rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-x-auto scrollbar-hide">
              <button
                onClick={() => handleViewChange('map')}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  activeView === 'map'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'hover:bg-accent/50'
                )}
              >
                <MapIcon className="h-4 w-4" />
                Map
              </button>
              <button
                onClick={() => handleViewChange('board')}
                className={cn(
                  'flex items-center gap-2 border-l-2 border-border/50 px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  activeView === 'board'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'hover:bg-accent/50'
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Board
              </button>
              <button
                onClick={() => handleViewChange('chat')}
                className={cn(
                  'flex items-center gap-2 border-l-2 border-border/50 px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  activeView === 'chat'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'hover:bg-accent/50'
                )}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
              <button
                onClick={() => handleViewChange('marketplace')}
                className={cn(
                  'flex items-center gap-2 border-l-2 border-border/50 px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  activeView === 'marketplace'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'hover:bg-accent/50'
                )}
              >
                <ShoppingBag className="h-4 w-4" />
                Shop
              </button>
              <button
                onClick={() => handleViewChange('research')}
                className={cn(
                  'flex items-center gap-2 border-l-2 border-border/50 px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                  activeView === 'research'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'hover:bg-accent/50'
                )}
              >
                <Compass className="h-4 w-4" />
                Research
              </button>
            </div>

            {/* Save Indicator */}
            <SaveIndicator
              status={saveStatus}
              onRetry={() => autoSave.retryFailed()}
              onResolveConflicts={() => setShowConflictModal(true)}
            />

            {/* Compare Button */}
            {cards.filter((c) => c.favorite).length > 1 && (
              <button
                onClick={() => handleCompare(cards.filter((c) => c.favorite))}
                className="rounded-xl gradient-secondary px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                Compare ({cards.filter((c) => c.favorite).length})
              </button>
            )}

            {/* Feedback Button */}
            <FeedbackButton />

            {/* User Menu / Sign In */}
            {!authLoading && (user ? <UserMenu /> : <SignInButton />)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeView === 'board' ? (
          <TripBoard
            tripId={resolvedParams.id}
            trip={trip}
            cards={cards}
            onCardUpdate={handleCardUpdate}
            onCardDelete={handleCardDelete}
            onCardDuplicate={handleCardDuplicate}
            onTripUpdate={handleTripUpdate}
            onArchive={handleArchive}
            onAddCard={handleAddCard}
          />
        ) : activeView === 'chat' ? (
          <ChatBoard tripId={resolvedParams.id} />
        ) : activeView === 'map' ? (
          <div className="flex h-full">
            <PlacesSearchSidebar
              cards={cards}
              tripId={resolvedParams.id}
              hoveredCardId={hoveredCardId}
              selectedCardId={selectedCardId}
              onCardHover={setHoveredCardId}
              onCardClick={(card) => {
                setSelectedCardId(card.id);
                setDetailCard(card);
              }}
              onAddToTrip={(card) => {
                const newCard = {
                  ...card,
                  trip_id: resolvedParams.id,
                  labels: ['considering'],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                handleAddCard(newCard);
              }}
              onSearchResultsChange={setSearchResults}
              onLocationChange={setSearchLocation}
            />
            <MapView
              cards={cards}
              selectedCardId={selectedCardId}
              hoveredCardId={hoveredCardId}
              onCardClick={(card) => {
                setSelectedCardId(card.id);
                setDetailCard(card);
              }}
              onCardHover={setHoveredCardId}
              showSidebar={true}
              searchResults={searchResults}
              searchLocation={searchLocation}
            />
          </div>
        ) : activeView === 'marketplace' ? (
          <MarketplaceView
            tripContext={{
              destination: trip.destination?.name,
              duration: trip.dates
                ? Math.ceil(
                    (new Date(trip.dates.end).getTime() - new Date(trip.dates.start).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : undefined,
              partySize: trip.party_json?.adults || 1,
              hasChildren: (trip.party_json?.children || 0) > 0,
            }}
          />
        ) : activeView === 'research' ? (
          <ResearchView
            tripId={resolvedParams.id}
            trip={trip}
            cards={cards}
            onCardUpdate={handleCardUpdate}
            onCardDelete={handleCardDelete}
            onAddCard={handleAddCard}
          />
        ) : null}
      </main>

      {/* Compare Drawer */}
      {compareCards.length > 0 && (
        <CompareDrawer
          cards={compareCards}
          onClose={() => setCompareCards([])}
          onRemoveCard={(cardId) =>
            setCompareCards(compareCards.filter((c) => c.id !== cardId))
          }
        />
      )}

      {/* Floating Card Detail (for Map view) */}
      <FloatingCardDetail
        card={detailCard}
        onClose={() => {
          setDetailCard(null);
          setSelectedCardId(undefined);
        }}
        onAddToTrip={(card) => {
          const newCard = {
            ...card,
            trip_id: resolvedParams.id,
            labels: ['considering'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          handleAddCard(newCard);
          setDetailCard(null);
        }}
      />

      {/* Edit Trip Modal */}
      <CreateTripModal
        isOpen={showEditTripModal}
        onClose={() => setShowEditTripModal(false)}
        onCreateTrip={handleEditTrip}
        mode="edit"
        existingTrip={trip}
      />

      {/* Conflict Resolution Modal */}
      <ConflictModal
        conflicts={conflicts}
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onResolve={handleResolveConflicts}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage || ''}
        isVisible={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Printable Itinerary (hidden, only shown when printing) */}
      <PrintableItinerary trip={trip} cards={cards} />
    </div>
  );
}
