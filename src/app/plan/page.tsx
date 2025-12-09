'use client';

import { useState } from 'react';
import { TripBoard } from '@/components/board/TripBoard';
import { CompareDrawer } from '@/components/board/CompareDrawer';
import { ChatBoard } from '@/components/chat-board/ChatBoard';
import { Card, Trip } from '@/types';
import { MarketplaceView } from '@/components/marketplace/MarketplaceView';
import { MapView } from '@/components/board/MapView';
import { PlacesSearchSidebar } from '@/components/map/PlacesSearchSidebar';
import { FloatingCardDetail } from '@/components/map/FloatingCardDetail';
import { Toast } from '@/components/ui/Toast';
import { SignInModal } from '@/components/auth/SignInModal';
import { CreateTripModal, CreateTripData } from '@/components/trip/CreateTripModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { SignInButton } from '@/components/auth/SignInButton';
import { SignUpPromptBanner } from '@/components/auth/SignUpPromptBanner';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTripContext } from '@/context/TripContext';
import {
  Sparkles,
  LayoutDashboard,
  ShoppingBag,
  Map as MapIcon,
  MessageSquare,
  Save,
  Share2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function PlanPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    cards,
    trip,
    activeView,
    setActiveView,
    addCard,
    updateCard,
    deleteCard,
    isModified,
    isSaving,
    isHydrated,
    saveToDatabase,
    showSignInModal,
    setShowSignInModal,
    showCreateTripModal,
    setShowCreateTripModal,
    setPendingAction,
  } = useTripContext();

  const [compareCards, setCompareCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(undefined);
  const [hoveredCardId, setHoveredCardId] = useState<string | undefined>(undefined);
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [searchResults, setSearchResults] = useState<Card[] | null>(null);
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAddCard = (newCard: Card) => {
    addCard(newCard);
    const payload = newCard.payload_json as any;
    setToastMessage(`"${payload.name}" added to Considering`);
  };

  const handleCardDuplicate = (card: Card) => {
    // Create a duplicate card with a new temporary ID
    const duplicateCard: Card = {
      ...card,
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      favorite: false,
      order: card.order !== undefined ? card.order + 0.5 : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addCard(duplicateCard);
    const payload = card.payload_json as any;
    setToastMessage(`"${payload.name || payload.title || 'Card'}" duplicated`);
  };

  const handleCompare = (selectedCards: Card[]) => {
    setCompareCards(selectedCards);
  };

  const handleSave = async () => {
    if (!user) {
      setShowSignInModal(true);
      setPendingAction('save');
      return;
    }

    // Show create trip modal to collect destination and dates
    setShowCreateTripModal(true);
  };

  const handleCreateTrip = async (tripData: CreateTripData) => {
    const result = await saveToDatabase(tripData);
    if (result.success && result.tripId) {
      setToastMessage('Trip created successfully!');
      // Redirect to the new trip page
      window.location.href = `/trips/${result.tripId}`;
    } else {
      setToastMessage(result.error || 'Failed to create trip');
    }
  };

  const handleShare = () => {
    if (!user) {
      setShowSignInModal(true);
      setPendingAction('share');
      return;
    }
    // Check if trip is saved (not a draft)
    if (!trip?.id || trip.id === 'draft') {
      setToastMessage('Please save your trip first before sharing');
      return;
    }
    // TODO: Implement share functionality
    setToastMessage('Share feature coming soon!');
  };

  const handleSaveRequired = () => {
    if (!user) {
      setShowSignInModal(true);
      setPendingAction('save');
    } else {
      setShowCreateTripModal(true);
    }
    setToastMessage('Please save your trip before confirming places');
  };

  // Default trip for display
  const displayTrip: Trip = {
    id: trip?.id || 'draft',
    user_id: user?.id || 'guest',
    title: trip?.title || 'My Trip',
    dates: trip?.dates || {
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    party_json: { adults: 1 },
    privacy: 'private',
    status: trip?.status || 'planning',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border/50 glassmorphism shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
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
                  {trip?.title || 'Plan your trip'}
                </p>
              </div>
            </Link>
          </div>

          {/* View Switcher */}
          <div className="flex rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <button
              onClick={() => setActiveView('map')}
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
              onClick={() => setActiveView('board')}
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
              onClick={() => setActiveView('chat')}
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
              onClick={() => setActiveView('marketplace')}
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
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving || (user && cards.length === 0)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                'border border-border hover:bg-accent',
                isSaving && 'opacity-50 cursor-not-allowed',
                !user && 'border-primary/50 hover:border-primary',
                isModified && cards.length > 0 && 'border-primary text-primary'
              )}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : isModified && cards.length > 0 ? 'Save Trip •' : 'Save Trip'}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              disabled={user && cards.length === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                'border border-border hover:bg-accent',
                !user && 'border-primary/50 hover:border-primary',
                user && cards.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>

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
      <main className="flex-1 overflow-hidden">
        {activeView === 'board' ? (
          <TripBoard
            tripId="draft"
            trip={displayTrip}
            cards={cards}
            onCardUpdate={updateCard}
            onCardDelete={deleteCard}
            onCardDuplicate={handleCardDuplicate}
            isLoggedOut={!user}
            onAddCard={handleAddCard}
            onSaveRequired={handleSaveRequired}
          />
        ) : activeView === 'chat' ? (
          <ChatBoard tripId="draft" />
        ) : activeView === 'map' ? (
          <div className="flex h-full">
            <PlacesSearchSidebar
              cards={cards}
              tripId="draft"
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
                  trip_id: 'draft',
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
        ) : (
          <MarketplaceView
            tripContext={
              trip?.destination?.name
                ? {
                    destination: trip.destination.name,
                    duration: trip?.dates
                      ? Math.ceil(
                          (new Date(trip.dates.end).getTime() -
                            new Date(trip.dates.start).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : undefined,
                  }
                : undefined
            }
          />
        )}
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
            trip_id: 'draft',
            labels: ['considering'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          handleAddCard(newCard);
          setDetailCard(null);
        }}
      />

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => {
          setShowSignInModal(false);
          setPendingAction(null);
        }}
      />

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={showCreateTripModal}
        onClose={() => setShowCreateTripModal(false)}
        onCreateTrip={handleCreateTrip}
        mode="create"
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage || ''}
        isVisible={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Sign Up Prompt Banner */}
      <SignUpPromptBanner
        cardCount={cards.length}
        isAuthenticated={!!user}
        onSignUp={() => setShowSignInModal(true)}
      />
    </div>
  );
}
