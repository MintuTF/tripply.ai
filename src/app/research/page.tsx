'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ResearchProvider } from '@/components/research/ResearchContext';
import {
  ResearchHero,
  QuickTopicsBar,
  AIResearchSection,
  PlacesDiscoverySection,
  SavedPlacesSection,
  LocalInsightsSection,
  ResearchCTA,
  ResearchMobileNav,
  ResearchMapView,
} from '@/components/research-page';
import { BudgetConstraintsSidebar } from '@/components/research-page/BudgetConstraintsSidebar';
import { CompactChatArea } from '@/components/research-page/CompactChatArea';
import { ResultsArea } from '@/components/research-page/ResultsArea';
import { CityHeroBanner } from '@/components/research/CityHeroBanner';
import { FilterChips } from '@/components/research/FilterChips';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/adsense/config';
import { useResearchState } from '@/hooks/useResearchState';
import {
  createResearchTrip,
  checkExistingResearchTrip,
  transitionTripToPlanning,
} from '@/lib/research/tripManager';
import type { Trip, PlaceCard, ToolCall, Citation } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function PremiumResearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [destination, setDestination] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [places, setPlaces] = useState<PlaceCard[]>([]);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Streaming AI state
  const [toolProgress, setToolProgress] = useState<ToolCall[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);

  // Budget constraints
  const [budgetConstraints, setBudgetConstraints] = useState<{
    totalBudget?: number;
    dailyBudget?: number;
    maxHotelPerNight?: number;
    maxMealCost?: number;
    maxActivityCost?: number;
  }>({});

  // NEW: Unified state management via custom hook
  const {
    cards,
    aiPlaces: aiGeneratedCards,
    isLoading: isCardsLoading,
    savePlace,
    removeCard,
    setAiPlaces: setAiGeneratedCards,
    clearAiPlaces,
  } = useResearchState(trip);

  // Derived state for backward compatibility with UI components
  const savedPlaces = cards.map((card) => card.payload_json as PlaceCard);
  const savedPlaceIds = cards.map((card) => card.payload_json.id);

  // Debug: Log AI cards state changes
  useEffect(() => {
    console.log('🎯 AI Generated Cards updated:', aiGeneratedCards.length, aiGeneratedCards);
  }, [aiGeneratedCards]);

  // Initialize research trip on mount
  useEffect(() => {
    const dest = searchParams.get('destination');
    if (!dest) {
      router.push('/discover');
      return;
    }

    setDestination(dest);
    initializeResearchTrip(dest);
  }, [searchParams, router]);

  const initializeResearchTrip = async (dest: string) => {
    setIsInitializing(true);

    try {
      // Check for existing research trip
      const existingTrip = await checkExistingResearchTrip(dest);

      if (existingTrip) {
        // Resume existing research session
        setTrip(existingTrip);
      } else {
        // Create new research trip
        const newTrip = await createResearchTrip(dest);
        if (newTrip) {
          setTrip(newTrip);
        }
      }
    } catch (error) {
      console.error('Error initializing research trip:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Fetch geocode and places data in parallel (optimized)
  useEffect(() => {
    const fetchData = async () => {
      if (!destination) return;

      setIsPlacesLoading(true);

      try {
        // Fetch geocode first (needed for places API)
        const geocodeResponse = await fetch(`/api/places/geocode?address=${encodeURIComponent(destination)}`);

        if (!geocodeResponse.ok) {
          console.error('Failed to fetch geocode - invalid city');
          // Redirect to discover page with error message for invalid cities
          router.push(`/discover?error=invalid-city&attempted=${encodeURIComponent(destination)}`);
          return;
        }

        const geocodeData = await geocodeResponse.json();
        const { lat, lng } = geocodeData.location;
        setDestinationCoords({ lat, lng });

        // Immediately fetch places using the coordinates (no delay)
        const placesResponse = await fetch(`/api/places/search?lat=${lat}&lng=${lng}&radius=5000`);

        if (!placesResponse.ok) {
          throw new Error('Failed to fetch places');
        }

        const placesData = await placesResponse.json();
        setPlaces(placesData.places || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setPlaces([]);
      } finally {
        setIsPlacesLoading(false);
      }
    };

    fetchData();
  }, [destination, router]);

  const handleTopicSelect = useCallback((topic: { prompt: string }) => {
    handleSendMessage(topic.prompt);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsAiLoading(true);

    // Create assistant message placeholder
    const assistantId = `msg-${Date.now()}-ai`;
    setMessages((prev) => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }]);

    // Clear previous AI-generated cards and citations
    console.log('🧹 Clearing previous AI cards');
    setAiGeneratedCards([]);
    setCitations([]);
    setToolProgress([]);

    try {
      // Call streaming API
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip_id: trip?.id,
          message: content,
          messages: [...messages, userMessage]
            .filter((m) => m.content && m.content.trim() !== '') // Filter out empty/null messages
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          budget_constraints: budgetConstraints, // Pass budget constraints to AI
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let cardsReceived: PlaceCard[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'toolCalls') {
              // Show tool execution badges
              setToolProgress(data.toolCalls || []);
            }
            else if (data.type === 'cards') {
              // Render place cards IMMEDIATELY
              cardsReceived = data.cards || [];
              console.log('📍 Received cards from AI:', cardsReceived.length, cardsReceived);
              setAiGeneratedCards((prev) => [...prev, ...cardsReceived]);
            }
            else if (data.type === 'content') {
              // Stream AI text token by token
              setMessages((prev) => prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + data.content }
                  : m
              ));
            }
            else if (data.type === 'done') {
              // Final: citations & cleanup
              setCitations(data.citations || []);
              setIsAiLoading(false);
              setToolProgress([]);
            }
          }
        }
      }
    } catch (error) {
      console.error('AI chat error:', error);

      // Fallback error message
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId
          ? {
              ...m,
              content: `I'm having trouble connecting right now. However, I can tell you that ${destination} is a wonderful destination! Try asking me again in a moment, or explore the places section below for recommendations.`,
            }
          : m
      ));
      setIsAiLoading(false);
      setToolProgress([]);
    }
  }, [destination, messages, trip, budgetConstraints]);

  const handleSavePlace = useCallback((place: PlaceCard) => {
    setSavedPlaceIds((prev) => {
      if (prev.includes(place.id)) {
        setSavedPlaces((places) => places.filter((p) => p.id !== place.id));
        return prev.filter((id) => id !== place.id);
      } else {
        setSavedPlaces((places) => [...places, place]);
        return [...prev, place.id];
      }
    });
  }, []);

  const handleUnsavePlace = useCallback((placeId: string) => {
    setSavedPlaceIds((prev) => prev.filter((id) => id !== placeId));
    setSavedPlaces((places) => places.filter((p) => p.id !== placeId));
  }, []);

  const handleSelectPlace = useCallback((place: PlaceCard) => {
    // Handle place selection - could open a modal or navigate to details
    console.log('Selected place:', place);
  }, []);

  // Save card to trip using unified state hook
  const handleSaveCard = useCallback(
    async (place: PlaceCard, day?: number) => {
      const label = day ? 'confirmed' : 'considering';
      await savePlace(place, label, day);
    },
    [savePlace]
  );

  const handleBuildItinerary = useCallback(async () => {
    if (!trip?.id) return;

    // Transition trip from 'researching' to 'planning' status
    const success = await transitionTripToPlanning(trip.id);

    if (success) {
      // Navigate to plan page with trip ID
      router.push(`/plan?trip_id=${trip.id}`);
    } else {
      console.error('Failed to transition trip to planning');
    }
  }, [trip, router]);

  const handleViewMap = useCallback(() => {
    // Navigate to map view
    setActiveTab('map');
  }, []);

  const handleOpenMap = useCallback(() => {
    setActiveTab('map');
  }, []);

  const handleViewSaved = useCallback(() => {
    setActiveTab('saved');
  }, []);

  const handleAddPlaces = useCallback(() => {
    setActiveTab('discover');
  }, []);

  if (!trip || !destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="text-muted-foreground font-medium">Preparing your research workspace...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <ResearchProvider>
      <div className="min-h-screen bg-[#FCFCFC] pb-20 md:pb-0">
        {/* City Hero Banner - Updated Design */}
        <CityHeroBanner
          cityName={destination}
          startDate={trip?.dates?.start ? new Date(trip.dates.start) : undefined}
          endDate={trip?.dates?.end ? new Date(trip.dates.end) : undefined}
          travelers={trip?.party_json?.adults || 2}
        />

        {/* Filter Chips Bar - Updated Design */}
        <FilterChips />

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Compact Chat Area - Updated Design (80px collapsed) */}
              <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                <CompactChatArea
                  destination={destination}
                  destinationCoords={destinationCoords}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isAiLoading}
                  toolProgress={toolProgress}
                  budgetConstraints={budgetConstraints}
                  onBudgetUpdate={setBudgetConstraints}
                  onMapToggle={() => setActiveTab('map')}
                />
              </div>

              {/* Results Grid Section - Updated Design (3-column grid) */}
              {aiGeneratedCards.length > 0 && (
                <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                  <ResultsArea
                    places={aiGeneratedCards}
                    destinationCoords={destinationCoords}
                    onSaveCard={handleSaveCard}
                    onRemoveCard={removeCard}
                  />
                </div>
              )}

              {/* Places Discovery Section */}
              <PlacesDiscoverySection
                destination={destination}
                places={places}
                savedPlaces={savedPlaceIds}
                onSavePlace={handleSavePlace}
                onSelectPlace={handleSelectPlace}
                onOpenMap={handleOpenMap}
                isLoading={isPlacesLoading}
              />

              {/* Sidebar Grid - Saved Places & Weather on larger screens */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Saved Places Section */}
                  <div className="lg:col-span-1">
                    {/* Sticky Ad Section - Visible on large screens */}
                    <div className="hidden xl:block sticky top-24 mb-6">
                      <AdSlot
                        slot={AD_SLOTS.RESEARCH_SIDEBAR_HALFPAGE}
                        format="vertical"
                        layout="display"
                        priority="high"
                        className="mb-6"
                      />
                    </div>

                    <SavedPlacesSection
                      savedPlaces={savedPlaces}
                      onViewAll={handleViewSaved}
                      onBuildItinerary={handleBuildItinerary}
                      onAddPlaces={handleAddPlaces}
                    />
                  </div>

                  {/* Quick Stats / Tips */}
                  <div className="lg:col-span-2">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                      className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-secondary/5 p-6"
                    >
                      <h3 className="font-semibold text-foreground mb-4">Quick Research Stats</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-4 rounded-xl bg-background/50">
                          <p className="text-3xl font-bold text-primary">{savedPlaces.length}</p>
                          <p className="text-sm text-muted-foreground">Places Saved</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-background/50">
                          <p className="text-3xl font-bold text-primary">{messages.filter(m => m.role === 'user').length}</p>
                          <p className="text-sm text-muted-foreground">AI Questions</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-background/50">
                          <p className="text-3xl font-bold text-primary">0</p>
                          <p className="text-sm text-muted-foreground">Days Planned</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-background/50">
                          <p className="text-3xl font-bold text-primary">~</p>
                          <p className="text-sm text-muted-foreground">Est. Budget</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Local Insights Section */}
              <LocalInsightsSection destination={destination} />

              {/* Final CTA Section */}
              <ResearchCTA
                destination={destination}
                savedCount={savedPlaces.length}
                onBuildItinerary={handleBuildItinerary}
                onViewMap={handleViewMap}
              />
            </motion.div>
          )}

          {activeTab === 'places' && (
            <motion.div
              key="places"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-8"
            >
              <PlacesDiscoverySection
                destination={destination}
                places={places}
                savedPlaces={savedPlaceIds}
                onSavePlace={handleSavePlace}
                onSelectPlace={handleSelectPlace}
                onOpenMap={handleOpenMap}
                isLoading={isPlacesLoading}
              />
            </motion.div>
          )}

          {activeTab === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto px-4 py-8"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Your Saved Places</h2>
              {savedPlaces.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedPlaces.map((place) => (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border border-border bg-card hover:shadow-lg transition-all"
                    >
                      <div className="flex gap-4">
                        {place.photos?.[0] && (
                          <img
                            src={place.photos[0]}
                            alt={place.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">{place.name}</h3>
                          <p className="text-sm text-muted-foreground">{place.address}</p>
                          {place.rating && (
                            <p className="text-sm text-primary mt-1">★ {place.rating}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No places saved yet. Start exploring!</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[calc(100vh-200px)]"
            >
              {destinationCoords ? (
                <ResearchMapView
                  places={places}
                  savedPlaces={savedPlaces}
                  destinationCoords={destinationCoords}
                  destination={destination}
                  onSavePlace={handleSavePlace}
                  onUnsavePlace={handleUnsavePlace}
                  selectedPlaceId={selectedPlaceId}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-accent/30">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* NEW: Compact Chat Area */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <CompactChatArea
                  destination={destination}
                  destinationCoords={destinationCoords}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isAiLoading}
                  toolProgress={toolProgress}
                  budgetConstraints={budgetConstraints}
                  onBudgetUpdate={setBudgetConstraints}
                  onMapToggle={() => setActiveTab('map')}
                />
              </div>

              {/* NEW: Results Area */}
              {aiGeneratedCards.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <ResultsArea
                    places={aiGeneratedCards}
                    destinationCoords={destinationCoords}
                    onSaveCard={handleSaveCard}
                    onRemoveCard={removeCard}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation */}
        <ResearchMobileNav
          activeTab={activeTab}
          savedCount={savedPlaces.length}
          onTabChange={setActiveTab}
        />
      </div>
    </ResearchProvider>
  );
}

export default function ResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Loading research experience...</p>
          </motion.div>
        </div>
      }
    >
      <PremiumResearchContent />
    </Suspense>
  );
}
