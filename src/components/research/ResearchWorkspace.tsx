'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useResearch } from './ResearchContext';
import { DestinationThemeProvider, useDestinationTheme } from './DestinationThemeProvider';
import { DestinationHero } from './DestinationHero';
import { FloatingToolbar } from './FloatingToolbar';
import { EditorialFlow } from './EditorialFlow';
import { ThinkingInput } from './ThinkingInput';
import { MapOverlay } from './MapOverlay';
import { SavedItemsDrawer } from './SavedItemsDrawer';
import { BottomNav } from './BottomNav';
import { EnhancedPlaceCard } from './EnhancedPlaceCard';
import { WeatherWidget } from './WeatherWidget';
import {
  Sparkles,
  ChevronRight,
  MapPin,
  Clock,
  DollarSign,
  Languages,
  Wifi,
  Star,
  TrendingUp,
  Compass
} from 'lucide-react';
import { cn, generateUUID } from '@/lib/utils';
import type { Trip, Message, PlaceCard } from '@/types';

interface ResearchWorkspaceProps {
  tripId: string;
  trip: Trip;
}

// Destination quick info database with coordinates
const DESTINATION_INFO: Record<string, {
  timezone: string;
  currency: string;
  language: string;
  plugType: string;
  coordinates: { lat: number; lng: number };
}> = {
  'las vegas': { timezone: 'PST (UTC-8)', currency: 'USD ($)', language: 'English', plugType: 'Type A/B', coordinates: { lat: 36.1699, lng: -115.1398 } },
  'tokyo': { timezone: 'JST (UTC+9)', currency: 'JPY (¥)', language: 'Japanese', plugType: 'Type A/B', coordinates: { lat: 35.6762, lng: 139.6503 } },
  'paris': { timezone: 'CET (UTC+1)', currency: 'EUR (€)', language: 'French', plugType: 'Type C/E', coordinates: { lat: 48.8566, lng: 2.3522 } },
  'london': { timezone: 'GMT (UTC+0)', currency: 'GBP (£)', language: 'English', plugType: 'Type G', coordinates: { lat: 51.5074, lng: -0.1278 } },
  'new york': { timezone: 'EST (UTC-5)', currency: 'USD ($)', language: 'English', plugType: 'Type A/B', coordinates: { lat: 40.7128, lng: -74.0060 } },
  'bali': { timezone: 'WITA (UTC+8)', currency: 'IDR (Rp)', language: 'Indonesian', plugType: 'Type C/F', coordinates: { lat: -8.3405, lng: 115.0920 } },
  'dubai': { timezone: 'GST (UTC+4)', currency: 'AED (د.إ)', language: 'Arabic/English', plugType: 'Type G', coordinates: { lat: 25.2048, lng: 55.2708 } },
  'barcelona': { timezone: 'CET (UTC+1)', currency: 'EUR (€)', language: 'Spanish/Catalan', plugType: 'Type C/F', coordinates: { lat: 41.3851, lng: 2.1734 } },
  'san francisco': { timezone: 'PST (UTC-8)', currency: 'USD ($)', language: 'English', plugType: 'Type A/B', coordinates: { lat: 37.7749, lng: -122.4194 } },
  'rome': { timezone: 'CET (UTC+1)', currency: 'EUR (€)', language: 'Italian', plugType: 'Type C/F/L', coordinates: { lat: 41.9028, lng: 12.4964 } },
  'default': { timezone: 'Local time', currency: 'Local currency', language: 'Local language', plugType: 'Check before travel', coordinates: { lat: 40.7128, lng: -74.0060 } },
};

function getDestinationInfo(destination: string) {
  const normalized = destination.toLowerCase().trim();
  for (const [key, info] of Object.entries(DESTINATION_INFO)) {
    if (key === 'default') continue;
    if (normalized.includes(key) || key.includes(normalized)) {
      return info;
    }
  }
  return DESTINATION_INFO['default'];
}

// Right sidebar component with suggestions
function RightSidebar({
  destination,
  suggestions,
  shortlistCards,
  onSelectCard,
  onSaveCard,
}: {
  destination: string;
  suggestions: PlaceCard[];
  shortlistCards: PlaceCard[];
  onSelectCard: (card: PlaceCard) => void;
  onSaveCard: (card: PlaceCard) => void;
}) {
  const { theme } = useDestinationTheme();
  const destInfo = getDestinationInfo(destination);
  const isCardSaved = (cardId: string) => shortlistCards.some((item) => item.id === cardId);

  return (
    <div className="w-[380px] h-full flex flex-col bg-card/50 border-l border-border/30">
      {/* Destination Quick Info Header */}
      <div
        className="flex-shrink-0 p-4 border-b border-border/30"
        style={{ backgroundColor: `${theme.primary}05` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
          <h3 className="text-sm font-semibold text-foreground">{destination}</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Clock, label: 'Time', value: destInfo.timezone.split(' ')[0] },
            { icon: DollarSign, label: 'Currency', value: destInfo.currency.split(' ')[0] },
            { icon: Languages, label: 'Language', value: destInfo.language.split('/')[0] },
            { icon: Wifi, label: 'Plug', value: destInfo.plugType.split('/')[0] },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
              <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-foreground truncate">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weather Widget */}
      <div className="flex-shrink-0 p-4 border-b border-border/30">
        <WeatherWidget
          latitude={destInfo.coordinates.lat}
          longitude={destInfo.coordinates.lng}
          destination={destination}
        />
      </div>

      {/* Suggestions Section */}
      <div className="flex-1 overflow-y-auto p-4">
        {suggestions.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4" style={{ color: theme.primary }} />
              <h4 className="text-sm font-semibold text-foreground">Suggestions for you</h4>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                {suggestions.length}
              </span>
            </div>
            <div className="space-y-4">
              {suggestions.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <EnhancedPlaceCard
                    card={card}
                    onSelect={() => onSelectCard(card)}
                    onSave={() => onSaveCard(card)}
                    isSaved={isCardSaved(card.id)}
                    variant="default"
                    showReason
                  />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: `${theme.primary}10` }}
            >
              <Compass className="h-8 w-8" style={{ color: theme.primary }} />
            </motion.div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Discover {destination}
            </h4>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Ask about restaurants, activities, or hidden gems and I'll suggest the best spots.
            </p>
          </div>
        )}
      </div>

      {/* Saved Items Preview */}
      {shortlistCards.length > 0 && (
        <div className="flex-shrink-0 p-4 border-t border-border/30 bg-background/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-foreground">
                Saved ({shortlistCards.length})
              </span>
            </div>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {shortlistCards.slice(0, 3).map((card) => (
              <div
                key={card.id}
                className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted"
              >
                {card.photos?.[0] ? (
                  <img src={card.photos[0]} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {shortlistCards.length > 3 && (
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">
                  +{shortlistCards.length - 3}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkspaceContent({ tripId, trip }: ResearchWorkspaceProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeBottomSheet, setActiveBottomSheet] = useState<'map' | 'insights' | 'saved' | null>(null);

  const {
    suggestions,
    shortlistCards,
    setSelectedPlace,
    addToShortlist,
    openDetailPanel,
    addSuggestions,
  } = useResearch();

  const { theme } = useDestinationTheme();
  const destinationName = trip.destination?.name || trip.title;

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const messageWithContext = trip.destination?.name
      ? text.includes(trip.destination.name)
        ? text
        : `${text} in ${trip.destination.name}`
      : text;

    const userMessage: Message = {
      id: generateUUID(),
      trip_id: tripId,
      role: 'user',
      text: messageWithContext,
      created_at: new Date().toISOString(),
    };

    const assistantMessageId = generateUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      trip_id: tripId,
      role: 'assistant',
      text: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_id: tripId, message: messageWithContext, messages }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'cards' && data.cards?.length > 0) {
                addSuggestions(data.cards);
              } else if (data.type === 'content') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, text: msg.text + data.content } : msg
                  )
                );
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, text: 'Sorry, I encountered an error. Please try again.' } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleSelectCard = (card: PlaceCard) => {
    setSelectedPlace(card.id);
    openDetailPanel(card);
  };

  const handleSaveCard = (card: PlaceCard) => {
    addToShortlist(card);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full flex-col">
        {/* Floating Toolbar */}
        <FloatingToolbar
          mapOpen={mapOpen}
          onMapToggle={() => setMapOpen(!mapOpen)}
          onNewChat={handleNewChat}
          onHistoryToggle={() => setHistoryOpen(!historyOpen)}
          onSavedToggle={() => setSavedDrawerOpen(!savedDrawerOpen)}
        />

        {/* Hero Section */}
        <div className="flex-shrink-0 px-6 pt-4">
          <DestinationHero
            destination={destinationName}
            dates={{
              start: trip.dates?.start || null,
              end: trip.dates?.end || null,
            }}
            travelers={trip.party_json?.adults || 0}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Chat/Editorial */}
          <main className="flex-1 flex flex-col min-h-0 px-6">
            <div className="flex-1 overflow-y-auto py-4">
              <div className="max-w-2xl mx-auto">
                <EditorialFlow
                  trip={trip}
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>

            {/* Thinking Input */}
            <div className="flex-shrink-0 pb-6 pt-2">
              <div className="max-w-2xl mx-auto">
                <ThinkingInput
                  onSubmit={handleSendMessage}
                  isLoading={isLoading}
                  placeholder={`Ask about ${destinationName}...`}
                />
              </div>
            </div>
          </main>

          {/* Right: Suggestions Sidebar */}
          <RightSidebar
            destination={destinationName}
            suggestions={suggestions}
            shortlistCards={shortlistCards}
            onSelectCard={handleSelectCard}
            onSaveCard={handleSaveCard}
          />
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {mapOpen && (
            <MapOverlay
              tripId={tripId}
              onClose={() => setMapOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {savedDrawerOpen && (
            <SavedItemsDrawer
              onClose={() => setSavedDrawerOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:flex lg:hidden flex-col h-full">
        <div className="flex-shrink-0 px-4 pt-4">
          <DestinationHero
            destination={destinationName}
            dates={{
              start: trip.dates?.start || null,
              end: trip.dates?.end || null,
            }}
            travelers={trip.party_json?.adults || 0}
            className="h-[180px]"
          />
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-36">
          <EditorialFlow
            trip={trip}
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />

          {/* Inline suggestions for tablet */}
          {suggestions.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4" style={{ color: theme.primary }} />
                <h4 className="text-sm font-semibold">Suggestions</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {suggestions.slice(0, 4).map((card) => (
                  <EnhancedPlaceCard
                    key={card.id}
                    card={card}
                    onSelect={() => handleSelectCard(card)}
                    onSave={() => handleSaveCard(card)}
                    isSaved={shortlistCards.some((item) => item.id === card.id)}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          )}
        </main>

        <ThinkingInput
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          placeholder={`Ask about ${destinationName}...`}
        />

        <BottomNav
          onMapOpen={() => setActiveBottomSheet('map')}
          onInsightsOpen={() => setActiveBottomSheet('insights')}
          onSavedOpen={() => setActiveBottomSheet('saved')}
          onNewChat={handleNewChat}
          savedCount={shortlistCards.length}
          activeTab={activeBottomSheet}
        />

        <AnimatePresence>
          {activeBottomSheet === 'map' && (
            <MapOverlay
              tripId={tripId}
              onClose={() => setActiveBottomSheet(null)}
              fullScreen
            />
          )}
          {activeBottomSheet === 'saved' && (
            <SavedItemsDrawer
              onClose={() => setActiveBottomSheet(null)}
              asBottomSheet
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col h-full">
        <div className="flex-shrink-0 px-3 pt-3">
          <DestinationHero
            destination={destinationName}
            dates={{
              start: trip.dates?.start || null,
              end: trip.dates?.end || null,
            }}
            travelers={trip.party_json?.adults || 0}
            className="h-[140px]"
          />
        </div>

        <main className="flex-1 overflow-y-auto px-3 py-3 pb-40">
          <EditorialFlow
            trip={trip}
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />

          {/* Inline suggestions for mobile */}
          {suggestions.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                <h4 className="text-xs font-semibold">Suggestions</h4>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {suggestions.map((card) => (
                  <div key={card.id} className="flex-shrink-0">
                    <EnhancedPlaceCard
                      card={card}
                      onSelect={() => handleSelectCard(card)}
                      onSave={() => handleSaveCard(card)}
                      isSaved={shortlistCards.some((item) => item.id === card.id)}
                      variant="compact"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <div className="fixed bottom-20 left-0 right-0 px-3 z-30">
          <div className="relative">
            <div className="flex items-center gap-2 rounded-2xl bg-card/95 backdrop-blur-md border border-border/50 p-3 shadow-lg">
              <input
                type="text"
                placeholder="What are you curious about?"
                className="flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleSendMessage(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <BottomNav
          onMapOpen={() => setActiveBottomSheet('map')}
          onInsightsOpen={() => setActiveBottomSheet('insights')}
          onSavedOpen={() => setActiveBottomSheet('saved')}
          onNewChat={handleNewChat}
          savedCount={shortlistCards.length}
          activeTab={activeBottomSheet}
        />

        <AnimatePresence>
          {activeBottomSheet === 'map' && (
            <MapOverlay
              tripId={tripId}
              onClose={() => setActiveBottomSheet(null)}
              fullScreen
            />
          )}
          {activeBottomSheet === 'saved' && (
            <SavedItemsDrawer
              onClose={() => setActiveBottomSheet(null)}
              asBottomSheet
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ResearchWorkspace({ tripId, trip }: ResearchWorkspaceProps) {
  const destinationName = trip.destination?.name || trip.title;

  return (
    <DestinationThemeProvider destinationName={destinationName}>
      <WorkspaceContent tripId={tripId} trip={trip} />
    </DestinationThemeProvider>
  );
}
