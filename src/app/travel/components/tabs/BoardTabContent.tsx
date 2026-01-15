'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LayoutDashboard, Share2 } from 'lucide-react';
import { useTravel } from '../../context/TravelContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { TripBoard } from '@/components/board/TripBoard';
import { ExportMenu } from '@/components/trip/ExportMenu';
import { ShareTripModal } from '@/components/trip/ShareTripModal';
import type { Card, Trip } from '@/types';

export function BoardTabContent() {
  const { state, dispatch } = useTravel();
  const { draftTrip, draftCards, city, currentTripId, boardRefreshTrigger } = state;
  const { user } = useAuth();
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
    : draftCards.map(dc => ({
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
      }));

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

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (!end) return start.toLocaleDateString();

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };


  return (
    <div className="relative">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-purple-100 dark:border-purple-900 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{trip.title}</h2>
              {state.currentTripId && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  Saved
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {cards.length} {cards.length === 1 ? 'place' : 'places'} added
              {trip.dates && ` • ${formatDateRange(trip.dates.start, trip.dates.end)}`}
            </p>
          </div>

          {/* Export & Share Actions */}
          <div className="flex items-center gap-2">
            {/* Share Button - Only for saved trips */}
            {currentTripId && currentTripId !== 'draft' && (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            )}
            <ExportMenu trip={trip} cards={cards} />
          </div>
        </div>
      </div>

      {/* Trip Board */}
      <div className="h-[calc(100vh-180px)]">
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
