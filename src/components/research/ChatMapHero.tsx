'use client';

import { useState, useRef } from 'react';
import { Sparkles, X, Star, MapPin, ExternalLink, Hotel, Utensils, Compass, Map, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, generateUUID } from '@/lib/utils';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { MapView } from '@/components/board/MapView';
import { useResearch } from './ResearchContext';
import type { Message, PlaceCard, Trip, Card } from '@/types';

interface ChatMapHeroProps {
  tripId: string;
  trip: Trip;
  className?: string;
}

// Sample prompts with icons and colors
const samplePromptConfig = [
  {
    icon: Hotel,
    label: 'Find Hotels',
    prompt: 'Find the best hotels',
    color: 'from-primary/20 to-cyan-500/20',
    iconColor: 'text-primary',
    borderColor: 'border-primary/30 hover:border-primary/50',
  },
  {
    icon: Utensils,
    label: 'Best Restaurants',
    prompt: 'Best restaurants nearby',
    color: 'from-secondary/20 to-orange-500/20',
    iconColor: 'text-secondary',
    borderColor: 'border-secondary/30 hover:border-secondary/50',
  },
  {
    icon: Compass,
    label: 'Things to Do',
    prompt: 'What activities and attractions should I visit?',
    color: 'from-purple-500/20 to-indigo-500/20',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-500/30 hover:border-purple-500/50',
  },
  {
    icon: Map,
    label: 'Hidden Gems',
    prompt: 'Show me local hidden gems and off-the-beaten-path spots',
    color: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-500',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
  },
];

export function ChatMapHero({ tripId, trip, className }: ChatMapHeroProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    addSuggestions,
    getAllPlaces,
    selectedPlaceId,
    setSelectedPlace,
    hoveredPlaceId,
    setHoveredPlace,
    detailPanelCard,
    detailPanelOpen,
    openDetailPanel,
    closeDetailPanel,
    addToShortlist,
  } = useResearch();

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add destination context if available
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

  const allPlaces = getAllPlaces();
  const mapCards: Card[] = allPlaces
    .filter((p) => p.coordinates)
    .map((p) => ({
      id: p.id,
      trip_id: tripId,
      type: p.type === 'location' ? 'spot' : (p.type as 'hotel' | 'food' | 'activity'),
      payload_json: { name: p.name, address: p.address || '', coordinates: p.coordinates, photos: p.photos, rating: p.rating },
      labels: [],
      favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  const handleMapCardClick = (card: Card) => {
    const place = allPlaces.find((p) => p.id === card.id);
    if (place) {
      setSelectedPlace(place.id);
      openDetailPanel(place);
    }
  };

  return (
    <div className={cn('flex h-[600px] border-b border-border/50', className)}>
      {/* Chat Panel */}
      <div className="w-[40%] flex flex-col border-r border-border/50 bg-gradient-to-b from-background to-accent/5">
        <div className="flex-1 overflow-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              {/* Hero Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative mb-6"
              >
                <div className="w-16 h-16 rounded-2xl gradient-primary shadow-glow flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-4 rounded-3xl border border-dashed border-primary/20"
                />
              </motion.div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-2">AI Travel Assistant</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {trip.destination?.name
                  ? `Discover the best of ${trip.destination.name} with personalized recommendations`
                  : 'Ask me about hotels, restaurants, activities, and local tips!'}
              </p>

              {/* Sample Prompts Grid */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {samplePromptConfig.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleSendMessage(item.prompt)}
                      disabled={isLoading}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'group relative flex flex-col items-center gap-2 p-4 rounded-xl border bg-card/50 transition-all duration-300',
                        'hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
                        item.borderColor
                      )}
                    >
                      {/* Background gradient on hover */}
                      <div className={cn(
                        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                        item.color
                      )} />

                      <div className={cn('p-2 rounded-lg bg-background/80 shadow-sm relative z-10', item.iconColor)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium relative z-10">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Typing hint */}
              <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Or type your own question below
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                message.role === 'user' ? (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex-shrink-0 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">You</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{message.text}</h4>
                        <div className="h-px bg-gradient-to-r from-primary/50 to-transparent mt-2" />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <ChatMessage message={message} isLatest={index === messages.length - 1} />
                  </motion.div>
                )
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 py-3 px-4 bg-primary/5 rounded-xl border border-primary/10"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                        className="w-2 h-2 bg-primary rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">AI is researching...</span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder={`Ask about ${trip.destination?.name || 'your destination'}...`}
            size="default"
          />
        </div>
      </div>

      {/* Map Panel */}
      <div className="w-[60%] relative bg-muted/30">
        <MapView
          cards={mapCards}
          selectedCardId={selectedPlaceId || undefined}
          hoveredCardId={hoveredPlaceId || undefined}
          onCardClick={handleMapCardClick}
          onCardHover={(id) => setHoveredPlace(id || null)}
          showSidebar={false}
        />

        {/* Detail Panel */}
        <AnimatePresence>
          {detailPanelOpen && detailPanelCard && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute top-4 right-4 w-80 glassmorphism rounded-2xl shadow-xl border border-border/50 overflow-hidden z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h4 className="font-bold text-base truncate">{detailPanelCard.name}</h4>
                <motion.button
                  onClick={closeDetailPanel}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Image */}
                {detailPanelCard.photos?.[0] && (
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-4 group">
                    <img
                      src={detailPanelCard.photos[0]}
                      alt={detailPanelCard.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}

                {/* Rating */}
                {detailPanelCard.rating && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 rounded-full">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-600">{detailPanelCard.rating.toFixed(1)}</span>
                    </div>
                    {detailPanelCard.review_count && (
                      <span className="text-xs text-muted-foreground">
                        ({detailPanelCard.review_count.toLocaleString()} reviews)
                      </span>
                    )}
                  </div>
                )}

                {/* Address */}
                {detailPanelCard.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{detailPanelCard.address}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => addToShortlist(detailPanelCard)}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-4 py-2.5 gradient-primary text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-glow transition-all"
                  >
                    Add to Trip
                  </motion.button>
                  {detailPanelCard.url && (
                    <a
                      href={detailPanelCard.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
