'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LayoutDashboard, Share2 } from 'lucide-react';
import { useTravel } from '../../context/TravelContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTripContext } from '@/context/TripContext';
import { TripBoard } from '@/components/board/TripBoard';
import { ExportMenu } from '@/components/trip/ExportMenu';
import { ShareTripModal } from '@/components/trip/ShareTripModal';
import type { Card, Trip } from '@/types';

export function BoardTabContent() {
  const { state, dispatch } = useTravel();
  const { draftTrip, draftCards, city, currentTripId, boardRefreshTrigger } = state;
  const { user } = useAuth();
  // Shop items live in the trip store (not the travel draft), so the board reads them from there too
  const { cards: tripStoreCards, updateCard: updateTripStoreCard, deleteCard: deleteTripStoreCard } = useTripContext();
  const shoppingCards = (tripStoreCards || []).filter((c) => c.type === 'product');
  const shoppingIds = new Set(shoppingCards.map((c) => c.id));
  const router = useRouter();
  const params = useParams();
  const citySlug = params?.citySlug as string;
  const [tripData, setTripData] = useState<{ trip: Trip; cards: Card[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Navigate to explore page
  const navigateToExplore = () => {
    if (citySlug) {
      router.push(`/travel/${citySlug}/explore`);
    } else {
      router.push('/travel');
    }
  };

  // Load trip data from database when currentTripId or boardRefreshTrigger changes
  useEffect(() => {
    if (currentTripId) {
      loadTripData();
    }
  }, [currentTripId, boardRefreshTrigger]);

  const loadTripData = async () => {
    if (!currentTripId) return;

    setLoading(true);
    try {
      const [tripRes, cardsRes] = await Promise.all([
        fetch(`/api/trips/${currentTripId}`),
        fetch(`/api/cards?trip_id=${currentTripId}`)
      ]);

      if (tripRes.ok && cardsRes.ok) {
        const tripJson = await tripRes.json();
        const cardsJson = await cardsRes.json();
        setTripData({ trip: tripJson.trip, cards: cardsJson.cards || [] });
      }
    } catch (error) {
      console.error('Failed to load trip:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while fetching trip data
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading trip...</p>
        </div>
      </div>
    );
  }

  // If no draft trip and no saved trip, show empty state with CTA
  if (!draftTrip && !currentTripId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
            <LayoutDashboard className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>

          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">No trip yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Start building your trip by clicking "Add to Trip" on any place you want to visit
          </p>

          <button
            onClick={navigateToExplore}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg transition-all"
          >
            Explore Places
          </button>
        </div>
      </div>
    );
  }

  // If we don't have tripData and no draftTrip, show empty state
  if (!tripData && !draftTrip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
            <LayoutDashboard className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>

          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">No trip yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Start building your trip by clicking "Add to Trip" on any place you want to visit
          </p>

          <button
            onClick={navigateToExplore}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg transition-all"
          >
            Explore Places
          </button>
        </div>
      </div>
    );
  }

  // Use tripData if we have a saved trip, otherwise use draft data
  const cards: Card[] = tripData
    ? tripData.cards
    : [...draftCards.map(dc => ({
        id: dc.id,
        trip_id: 'draft',
        type: dc.type,
        payload_json: dc.placeData as any, // TravelPlace can be used as payload
        labels: dc.labels,
        day: dc.day,
        time_slot: dc.time_slot,
        order: dc.order,
        favorite: false,
        created_at: new Date(dc.addedAt).toISOString(),
        updated_at: new Date(dc.addedAt).toISOString(),
      })), ...shoppingCards];

  const trip: Trip = tripData
    ? tripData.trip
    : {
        id: 'draft',
        user_id: user?.id || 'guest',
        title: draftTrip!.name,
        destination: city ? {
          name: city.name,
          place_id: city.placeId,
          coordinates: city.coordinates,
        } : undefined,
        dates: draftTrip!.startDate && draftTrip!.endDate ? {
          start: draftTrip!.startDate,
          end: draftTrip!.endDate,
        } : undefined,
        party_json: { adults: 2 },
        privacy: 'private',
        status: 'planning',
        created_at: new Date(draftTrip!.createdAt).toISOString(),
        updated_at: new Date(draftTrip!.createdAt).toISOString(),
      };

  return (
    <div className="relative">
      {/* Trip Board */}
      <div className="h-[calc(100vh-4rem)] min-h-[480px]">
        <TripBoard
          tripId={currentTripId || "draft"}
          trip={trip}
          cards={cards}
          onCardUpdate={async (cardId, updates) => {
            if (currentTripId) {
              // Optimistic update
              setTripData(prev => prev ? {
                ...prev,
                cards: prev.cards.map(c => c.id === cardId ? {...c, ...updates} : c)
              } : null);

              // Save to server
              try {
                await fetch(`/api/cards/${cardId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updates)
                });
              } catch (error) {
                console.error('Failed to update card:', error);
                loadTripData(); // Reload on error
              }
            } else if (shoppingIds.has(cardId)) {
              const existing = shoppingCards.find((c) => c.id === cardId);
              if (existing) updateTripStoreCard({ ...existing, ...updates } as Card);
            } else {
              // Fallback for draft mode
              dispatch({
                type: 'UPDATE_DRAFT_CARD',
                payload: { id: cardId, updates },
              });
            }
          }}
          onCardDelete={async (cardId) => {
            if (currentTripId) {
              // Optimistic delete
              setTripData(prev => prev ? {
                ...prev,
                cards: prev.cards.filter(c => c.id !== cardId)
              } : null);

              // Delete from server
              try {
                await fetch(`/api/cards/${cardId}`, {
                  method: 'DELETE'
                });
              } catch (error) {
                console.error('Failed to delete card:', error);
                loadTripData(); // Reload on error
              }
            } else if (shoppingIds.has(cardId)) {
              deleteTripStoreCard(cardId);
            } else {
              // Fallback for draft mode
              dispatch({
                type: 'REMOVE_FROM_DRAFT_TRIP',
                payload: cardId,
              });
            }
          }}
          onAddCard={() => {
            // Navigate to explore page to add more places
            navigateToExplore();
          }}
          isLoggedOut={true}
          headerActions={
            <>
              {currentTripId && currentTripId !== 'draft' && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:border-purple-300 hover:text-purple-700"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              )}
              <ExportMenu trip={trip} cards={cards} />
            </>
          }
        />
      </div>

      {/* Share Trip Modal */}
      <ShareTripModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tripId={currentTripId || 'draft'}
        tripTitle={trip.title}
      />
    </div>
  );
}
