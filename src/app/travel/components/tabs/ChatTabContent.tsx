'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, ChevronDown, Loader2, Lock, X, Square } from 'lucide-react';
import { useTravel } from '../../context/TravelContext';
import { useTripContext } from '@/context/TripContext';
import { useAuth } from '@/hooks/useAuth';
import { ChatHistoryProvider, useChatHistory } from '@/context/ChatHistoryContext';
import { TravelChatHeader } from '@/components/chat/TravelChatHeader';
import { FloatingItineraryButton } from '@/components/chat/FloatingItineraryButton';
import { ChatFloatingMenu } from '@/components/chat/ChatFloatingMenu';
import { ChatHistoryDrawer } from '@/components/chat/ChatHistoryDrawer';
import { PlaceCardGroup, PlaceWithWhy } from '@/components/chat/PlaceCardGroup';
import { ChatModeToggle } from '@/components/chat/ChatModeToggle';
import { ItineraryResponseView } from '@/components/chat/ItineraryResponseView';
import { AskModeResponseView } from '@/components/chat/AskModeResponseView';
import { Message, PlaceCard, ChatMode, ItineraryResponse, ModeAwareMessage } from '@/types';
import type { ChatVideoResult, VideoAnalysis, SmartVideoResult } from '@/types/video';
import { cn, generateUUID } from '@/lib/utils';
import { generateFallbackWhy } from '@/lib/ai/whyGenerator';
import { getPlaceholderByMode, getSamplePromptsByMode } from '@/lib/ai/prompts';
import ReactMarkdown from 'react-markdown';
import type { TravelPlace } from '@/lib/travel/types';

/**
 * Chat Tab Content - AI Travel Companion
 *
 * Single-column, chat-focused layout with explicit mode selection:
 * - ASK mode: Exploration, discovery, short responses with place cards
 * - ITINERARY mode: Structured day-by-day plans with collapsible cards
 * - User controls mode via toggle (resets each session)
 * - Sidebar shows chat history (max 5 conversations)
 */
export function ChatTabContent() {
  const { state: travelState } = useTravel();
  const { city } = travelState;
  const { trip } = useTripContext();
  const { user } = useAuth();

  return (
    <ChatHistoryProvider
      userId={user?.id}
      initialDestination={city?.name}
    >
      <ChatTabContentInner />
    </ChatHistoryProvider>
  );
}

/**
 * Inner component that consumes the ChatHistoryContext
 */
function ChatTabContentInner() {
  const { state: travelState, selectPlace } = useTravel();
  const { city, savedPlaceIds } = travelState;
  const { trip, addCard } = useTripContext();
  const { user } = useAuth();

  // Chat history context
  const {
    conversations,
    currentConversationId,
    currentMessages,
    isLoading: isHistoryLoading,
    currentConversation,
    selectConversation,
    createNewConversation,
    deleteConversation,
    addMessage,
    updateConversationMode,
    updateConversationTitle,
    // Guest mode
    isGuest,
    guestMessageLimitReached,
    addGuestMessage,
    allConversations,
    guestConversations,
    deleteGuestConversation,
  } = useChatHistory();

  // History drawer state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Chat mode state - sync with current conversation
  const [chatMode, setChatMode] = useState<ChatMode>('ask');
  const [messages, setMessages] = useState<ModeAwareMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Track previous destination for change detection
  const prevDestinationRef = useRef<string | undefined>(undefined);
  const hasInitializedRef = useRef<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync messages when current conversation changes
  useEffect(() => {
    // Convert stored messages to ModeAwareMessage format
    const modeAwareMessages: ModeAwareMessage[] = currentMessages.map((msg) => ({
      ...msg,
      chatMode: (msg.chat_mode as ChatMode) || 'ask',
    }));
    setMessages(modeAwareMessages);
  }, [currentMessages]);

  // Clear messages when conversation changes (before new messages load)
  const prevConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentConversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = currentConversationId;
      // Don't clear if we're just loading the same conversation
      if (!currentConversationId) {
        setMessages([]);
      }
    }
  }, [currentConversationId]);

  // Sync chat mode with current conversation
  useEffect(() => {
    if (currentConversation) {
      setChatMode(currentConversation.chat_mode);
    }
  }, [currentConversation]);

  // Handle destination change - create new conversation or find existing
  useEffect(() => {
    const currentDestination = city?.name;
    const prevDestination = prevDestinationRef.current;

    // Only run after initial load
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevDestinationRef.current = currentDestination;
      return;
    }

    // Destination changed
    if (currentDestination && currentDestination !== prevDestination) {
      prevDestinationRef.current = currentDestination;

      // Check if there's an existing conversation for this destination
      const existingConv = conversations.find(
        (c) => c.destination.toLowerCase() === currentDestination.toLowerCase()
      );

      if (existingConv) {
        // Resume existing conversation
        selectConversation(existingConv.id);
      } else if (user?.id) {
        // Create new conversation for new destination (async)
        (async () => {
          const newId = await createNewConversation(currentDestination, chatMode);
          if (newId) {
            setMessages([]); // Clear messages for new conversation
          }
        })();
      }
    }
  }, [city?.name, conversations, user?.id, chatMode, selectConversation, createNewConversation]);

  // Handle mode change - update current conversation
  const handleModeChange = useCallback(async (newMode: ChatMode) => {
    setChatMode(newMode);
    if (currentConversationId) {
      await updateConversationMode(newMode);
    }
  }, [currentConversationId, updateConversationMode]);

  // Handle new chat button
  const handleNewChat = useCallback(async () => {
    if (!city?.name || !user?.id) return;

    // Create a new conversation
    const newId = await createNewConversation(city.name, chatMode);
    if (newId) {
      setMessages([]);
      setIsHistoryOpen(false);
    }
  }, [city?.name, user?.id, chatMode, createNewConversation]);

  // Handle conversation selection from history drawer
  const handleSelectConversation = useCallback(async (id: string) => {
    await selectConversation(id);
    setIsHistoryOpen(false);
  }, [selectConversation]);

  // Content buffer for controlled streaming
  const contentBufferRef = useRef<string>('');
  const displayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  // Trip ID for API calls - exclude 'draft' placeholder as it's not a valid UUID
  const tripId = (trip?.id && trip.id !== 'draft') ? trip.id : null;

  // Sample prompts based on mode and destination
  const baseSamplePrompts = getSamplePromptsByMode(chatMode);
  const samplePrompts = city
    ? baseSamplePrompts.map((prompt) =>
        prompt.includes('trip') || prompt.includes('itinerary')
          ? prompt.replace(/trip|itinerary/i, `trip to ${city.name}`)
          : `${prompt} in ${city.name}`
      )
    : baseSamplePrompts;

  // Placeholder text based on mode
  const placeholderText = getPlaceholderByMode(chatMode);

  // Controlled content release for streaming
  const startContentDisplay = useCallback((messageId: string) => {
    currentMessageIdRef.current = messageId;

    if (displayIntervalRef.current) {
      clearInterval(displayIntervalRef.current);
    }

    displayIntervalRef.current = setInterval(() => {
      if (contentBufferRef.current.length > 0) {
        const charsToRelease = Math.min(4, contentBufferRef.current.length);
        const chunk = contentBufferRef.current.slice(0, charsToRelease);
        contentBufferRef.current = contentBufferRef.current.slice(charsToRelease);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, text: msg.text + chunk } : msg
          )
        );
      }
    }, 20);
  }, []);

  const stopContentDisplay = useCallback(() => {
    if (displayIntervalRef.current) {
      clearInterval(displayIntervalRef.current);
      displayIntervalRef.current = null;
    }
    if (contentBufferRef.current.length > 0 && currentMessageIdRef.current) {
      const remaining = contentBufferRef.current;
      contentBufferRef.current = '';
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? { ...msg, text: msg.text + remaining }
            : msg
        )
      );
    }
    currentMessageIdRef.current = null;
  }, []);

  // Stop/cancel generation
  const handleStop = useCallback(() => {
    // Abort the fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Stop content display
    stopContentDisplay();

    // Set loading to false
    setIsLoading(false);

    // Mark last message as stopped if it has no content
    setMessages((prev) => {
      const updated = [...prev];
      const lastMsg = updated[updated.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.text) {
        lastMsg.text = 'Response stopped.';
      }
      return updated;
    });
  }, [stopContentDisplay]);

  // Scroll handling
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom && messages.length > 0);
  }, [messages.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    return () => {
      if (displayIntervalRef.current) {
        clearInterval(displayIntervalRef.current);
      }
    };
  }, []);

  // Send message handler
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check if guest has reached message limit
    if (isGuest && guestMessageLimitReached) {
      setShowLoginPrompt(true);
      return;
    }

    // Ensure we have a conversation (create one if needed)
    let conversationId = currentConversationId;
    if (!conversationId && city?.name && user?.id) {
      conversationId = await createNewConversation(city.name, chatMode);
    }

    const userMessage: ModeAwareMessage = {
      id: generateUUID(),
      trip_id: tripId,
      role: 'user',
      text,
      chatMode, // Track mode at time of message
      created_at: new Date().toISOString(),
    };

    const assistantMessageId = generateUUID();
    const assistantMessage: ModeAwareMessage = {
      id: assistantMessageId,
      trip_id: tripId,
      role: 'assistant',
      text: '',
      chatMode, // Track mode for rendering
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setIsLoading(true);

    // Save message - guest mode uses localStorage, auth uses database
    if (isGuest) {
      addGuestMessage({ role: 'user', text, chat_mode: chatMode });
    } else if (conversationId && user?.id) {
      addMessage({
        trip_id: tripId,
        role: 'user',
        text,
        chat_mode: chatMode,
      });
    }

    // Auto-scroll to bottom for new message
    setTimeout(() => scrollToBottom(), 100);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          conversation_id: conversationId,
          message: text,
          messages: messages,
          chatMode, // Send explicit mode to API
          context: {
            destination: city?.name,
            country: city?.country,
            savedPlacesCount: savedPlaceIds.length,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          stopContentDisplay();
          setIsLoading(false);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'toolCalls') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, tool_calls_json: data.toolCalls }
                      : msg
                  )
                );
              } else if (data.type === 'cards') {
                // Add WHY to cards using hybrid approach
                const cardsWithWhy = data.cards.map((card: PlaceCard) => {
                  const fallbackWhy = generateFallbackWhy(card, {
                    interests: [],
                    travelerType: 'solo',
                  });
                  return {
                    ...card,
                    whyTags: card.whyTags || fallbackWhy.tags,
                    whyBullets: card.whyBullets || fallbackWhy.bullets,
                  };
                });

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, cards_json: cardsWithWhy }
                      : msg
                  )
                );
              } else if (data.type === 'videos') {
                // Handle video results from search_videos tool
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, videos_json: data.videos as ChatVideoResult[] }
                      : msg
                  )
                );
              } else if (data.type === 'videoAnalysis') {
                // Handle video analysis (summary, highlights, places)
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, videoAnalysis_json: data.videoAnalysis as VideoAnalysis }
                      : msg
                  )
                );
              } else if (data.type === 'smartVideoResult') {
                // Handle smart video result (text + video grid with deep analysis)
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, smartVideoResult_json: data.smartVideoResult as SmartVideoResult }
                      : msg
                  )
                );
              } else if (data.type === 'content') {
                contentBufferRef.current += data.content;
                if (!displayIntervalRef.current) {
                  startContentDisplay(assistantMessageId);
                }
              } else if (data.type === 'itinerary') {
                // Handle itinerary JSON from itinerary mode
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, itinerary_json: data.itinerary as ItineraryResponse }
                      : msg
                  )
                );
              } else if (data.type === 'done') {
                stopContentDisplay();
                setMessages((prev) => {
                  const updatedMessages = prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, citations_json: data.citations }
                      : msg
                  );

                  // Save assistant message
                  const finalAssistantMsg = updatedMessages.find((m) => m.id === assistantMessageId);

                  if (finalAssistantMsg) {
                    // Guest mode: save to localStorage and show login prompt
                    if (isGuest) {
                      addGuestMessage({
                        role: 'assistant',
                        text: finalAssistantMsg.text,
                        chat_mode: chatMode,
                      });
                      // Show login prompt after first exchange
                      setTimeout(() => setShowLoginPrompt(true), 500);
                    } else if (conversationId && user?.id) {
                      // Authenticated: save to database
                      addMessage({
                        trip_id: tripId,
                        role: 'assistant',
                        text: finalAssistantMsg.text,
                        chat_mode: chatMode,
                        cards_json: finalAssistantMsg.cards_json,
                        videos_json: finalAssistantMsg.videos_json,
                        itinerary_json: finalAssistantMsg.itinerary_json,
                      });

                      // Generate AI title after first exchange (2 messages: user + assistant)
                      if (updatedMessages.length <= 2) {
                        const titleMessages = [
                          { role: 'user' as const, text },
                          { role: 'assistant' as const, text: finalAssistantMsg.text },
                        ];

                        fetch(`/api/chat/conversations/${conversationId}/generate-title`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ messages: titleMessages }),
                        })
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.title) {
                              updateConversationTitle(data.title);
                            }
                          })
                          .catch((err) => console.error('Failed to generate title:', err));
                      }
                    }
                  }

                  return updatedMessages;
                });
              } else if (data.type === 'error') {
                stopContentDisplay();
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      // Handle abort gracefully - user clicked stop
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted by user');
        return;
      }

      console.error('Error sending message:', error);
      stopContentDisplay();
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, text: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Handle place save
  const handleSavePlace = (place: PlaceCard) => {
    addCard?.({
      type: place.type === 'restaurant' ? 'food' : place.type === 'hotel' ? 'hotel' : 'spot',
      payload_json: place,
      labels: [],
      favorite: true,
    });
  };

  // Handle input submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="relative h-[calc(100vh-120px)]">
      {/* Main Chat Area - Full Width */}
      <div className="flex flex-col h-full">
        {/* Header with Mode Toggle */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <TravelChatHeader
            destination={city?.name}
            country={city?.country}
            countryCode={city?.countryCode}
            tripName={trip?.title}
            className="border-0"
          />
          <div className="px-4 py-2">
            <ChatModeToggle
              mode={chatMode}
              onModeChange={handleModeChange}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Chat Messages */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 bg-white dark:bg-gray-950"
        >
          <div className="space-y-6">
            {/* Empty State */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {chatMode === 'itinerary'
                    ? city ? `Plan Your ${city.name} Trip` : 'Plan Your Trip'
                    : city ? `Explore ${city.name}` : 'Your AI Travel Companion'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  {chatMode === 'itinerary'
                    ? 'Create structured day-by-day itineraries with activities, restaurants, and timing.'
                    : city
                      ? `Discover places, restaurants, and activities in ${city.name}.`
                      : 'Ask about destinations, find hidden gems, or get travel advice.'}
                </p>

                {/* Sample Prompts */}
                <div className="flex flex-wrap justify-center gap-2">
                  {samplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                cityName={city?.name}
                onSavePlace={handleSavePlace}
                savedPlaceIds={savedPlaceIds}
                isStreaming={isLoading && message.role === 'assistant' && message === messages[messages.length - 1]}
                onAskFollowUp={handleSendMessage}
                onViewDetails={(place) => {
                  // Convert PlaceCard to TravelPlace format for the drawer
                  const travelPlace: TravelPlace = {
                    id: place.id,
                    name: place.name,
                    imageUrl: place.photos?.[0] || '',
                    categories: [place.type],
                    rating: place.rating || 0,
                    reviewCount: place.review_count || 0,
                    popularityScore: place.rating || 0,
                    description: place.description || '',
                    coordinates: place.location || place.coordinates || { lat: 0, lng: 0 },
                    address: place.vicinity || place.address,
                    priceLevel: place.price_level,
                  };
                  selectPlace(travelPlace);
                }}
                onVideoPlaceClick={(place) => selectPlace(place)}
              />
            ))}

            {/* Immediate loading indicator - shows when waiting for assistant response */}
            {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 px-4 py-6"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200/50">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Searching for recommendations...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
            >
              <ChevronDown className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input Area - ChatGPT Style */}
        <div className="bg-gradient-to-t from-white via-white to-transparent dark:from-gray-950 dark:via-gray-950 pt-6 pb-4">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto px-4"
          >
            <div className="relative flex items-end bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholderText}
                disabled={isLoading || (isGuest && guestMessageLimitReached)}
                rows={1}
                className={cn(
                  'flex-1 bg-transparent border-0 resize-none',
                  'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
                  'focus:outline-none focus:ring-0',
                  'pl-4 pr-14 py-4',
                  'text-base leading-relaxed',
                  'disabled:opacity-50'
                )}
                style={{ minHeight: '56px', maxHeight: '200px' }}
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="absolute right-3 bottom-3 p-2 rounded-lg transition-all duration-200 bg-red-500 hover:bg-red-600 text-white"
                >
                  <Square className="h-5 w-5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className={cn(
                    'absolute right-3 bottom-3 p-2 rounded-lg transition-all duration-200',
                    inputValue.trim()
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  )}
                >
                  <Send className="h-5 w-5" />
                </button>
              )}
            </div>
            {/* Stop generating indicator text */}
            {isLoading ? (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                Click the stop button to cancel
              </p>
            ) : (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                Voyagr can make mistakes. Consider verifying important info.
              </p>
            )}
          </form>
        </div>

        {/* Floating Itinerary Button */}
        <FloatingItineraryButton
          placesCount={savedPlaceIds.length}
          onClick={() => {
            // TODO: Open itinerary panel
            console.log('Open itinerary');
          }}
        />
      </div>

      {/* Floating Chat Menu - Bottom Left */}
      <ChatFloatingMenu
        onNewChat={handleNewChat}
        onOpenHistory={() => setIsHistoryOpen(true)}
        conversationCount={isGuest ? guestConversations.length : conversations.length}
      />

      {/* Chat History Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        conversations={conversations}
        currentConversationId={currentConversationId}
        isLoading={isHistoryLoading}
        onClose={() => setIsHistoryOpen(false)}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={deleteConversation}
        isGuest={isGuest}
        guestConversations={guestConversations}
        onDeleteGuestConversation={deleteGuestConversation}
      />

      {/* Login Prompt Modal - Shows after guest sends first message */}
      <AnimatePresence>
        {showLoginPrompt && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowLoginPrompt(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Close button */}
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-8 text-center">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-200">
                    <Lock className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Sign in to continue chatting
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Create a free account to unlock unlimited conversations
                  </p>

                  {/* Benefits */}
                  <div className="text-left bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 dark:text-green-400 text-xs">&#10003;</span>
                        </span>
                        Continue this conversation
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 dark:text-green-400 text-xs">&#10003;</span>
                        </span>
                        Save your chat history
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 dark:text-green-400 text-xs">&#10003;</span>
                        </span>
                        Plan unlimited trips
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 dark:text-green-400 text-xs">&#10003;</span>
                        </span>
                        Access your trips anywhere
                      </li>
                    </ul>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-3">
                    <a
                      href="/auth/login"
                      className="flex items-center justify-center w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg hover:shadow-purple-200 transition-all"
                    >
                      Sign In
                    </a>
                    <a
                      href="/auth/signup"
                      className="flex items-center justify-center w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Create Account
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual chat message component with mode-aware rendering
 *
 * Ask mode: Card-first layout (NO bubble for assistant)
 * Itinerary mode: Structured day cards
 * User messages: Keep purple gradient bubble
 */
function ChatMessageItem({
  message,
  cityName,
  onSavePlace,
  savedPlaceIds,
  isStreaming,
  onAskFollowUp,
  onViewDetails,
  onVideoPlaceClick,
}: {
  message: ModeAwareMessage;
  cityName?: string;
  onSavePlace: (place: PlaceCard) => void;
  savedPlaceIds: string[];
  isStreaming?: boolean;
  onAskFollowUp?: (question: string) => void;
  onViewDetails?: (place: PlaceCard) => void;
  onVideoPlaceClick?: (place: TravelPlace) => void;
}) {
  const isUser = message.role === 'user';
  const cards = message.cards_json as PlaceWithWhy[] | undefined;
  const videos = message.videos_json as ChatVideoResult[] | undefined;
  const videoAnalysis = message.videoAnalysis_json as VideoAnalysis | undefined;
  const smartVideoResult = (message as any).smartVideoResult_json as SmartVideoResult | undefined;
  const itinerary = message.itinerary_json;
  const isItineraryMode = message.chatMode === 'itinerary';
  const isAskMode = !isItineraryMode;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'space-y-4',
          isUser ? 'max-w-[85%] order-1' : 'w-full'
        )}
      >
        {/* USER MESSAGES - Keep purple gradient bubble */}
        {isUser && (
          <div className="rounded-2xl px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* ASSISTANT MESSAGES - Mode-aware rendering */}
        {!isUser && (
          <>
            {/* Streaming indicator */}
            {isStreaming && !message.text && (
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-gray-500">Finding the best places...</span>
                </div>
              </div>
            )}

            {/* ASK MODE: Card-first layout, NO bubble wrapper */}
            {isAskMode && message.text && (
              <AskModeResponseView
                markdown={message.text}
                cards={cards}
                videos={videos}
                videoAnalysis={videoAnalysis}
                smartVideoResult={smartVideoResult}
                cityName={cityName}
                onAskFollowUp={onAskFollowUp}
                savedPlaceIds={new Set(savedPlaceIds)}
                onSavePlace={onSavePlace}
                onViewDetails={onViewDetails}
                onVideoPlaceClick={onVideoPlaceClick}
              />
            )}

            {/* ITINERARY MODE: Keep existing structured view */}
            {isItineraryMode && itinerary && (
              <ItineraryResponseView
                itinerary={itinerary}
                onAdjustPace={() => onAskFollowUp?.('Make the pace more relaxed')}
                onAddDay={() => onAskFollowUp?.('Add another day to the itinerary')}
                onChangeFocus={() => onAskFollowUp?.('Focus more on food experiences')}
              />
            )}

            {/* ITINERARY MODE: Show loading state while generating (hide raw text/JSON) */}
            {isItineraryMode && !itinerary && (
              <div className="rounded-xl bg-white dark:bg-gray-900 border border-purple-100 dark:border-purple-800 px-4 py-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Creating your personalized itinerary...
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
