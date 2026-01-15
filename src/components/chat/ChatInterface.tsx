'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { cn, generateUUID } from '@/lib/utils';
import { Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserMenu } from '@/components/auth/UserMenu';

interface ChatInterfaceProps {
  tripId?: string;
  onSendMessage?: (message: string) => Promise<void>;
}

export function ChatInterface({ tripId, onSendMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading } = useAuth();

  // Content buffer for slower streaming display
  const contentBufferRef = useRef<string>('');
  const displayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  // Controlled content release - displays buffered content gradually
  const startContentDisplay = useCallback((messageId: string) => {
    currentMessageIdRef.current = messageId;

    if (displayIntervalRef.current) {
      clearInterval(displayIntervalRef.current);
    }

    displayIntervalRef.current = setInterval(() => {
      if (contentBufferRef.current.length > 0) {
        // Release 3-5 characters at a time for smoother appearance
        const charsToRelease = Math.min(4, contentBufferRef.current.length);
        const chunk = contentBufferRef.current.slice(0, charsToRelease);
        contentBufferRef.current = contentBufferRef.current.slice(charsToRelease);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, text: msg.text + chunk }
              : msg
          )
        );
      }
    }, 20); // ~50 chars per second for readable pace
  }, []);

  const stopContentDisplay = useCallback(() => {
    if (displayIntervalRef.current) {
      clearInterval(displayIntervalRef.current);
      displayIntervalRef.current = null;
    }
    // Flush any remaining content immediately
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

  // Manual scroll to bottom function (user-triggered only)
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  }, []);

  // Check if user is at bottom of scroll container
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom && messages.length > 0);
  }, [messages.length]);

  // Track scroll position - only on actual user scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Cleanup display interval on unmount
  useEffect(() => {
    return () => {
      if (displayIntervalRef.current) {
        clearInterval(displayIntervalRef.current);
      }
    };
  }, []);

  // Sample prompts for empty state
  const samplePrompts = [
    'Plan a 4-day food-focused trip to Lisbon',
    'Find hotels under $180/night in Paris',
    'What\'s the weather like in Tokyo in March?',
    'Show me the best neighborhoods in Barcelona',
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message immediately
    const userMessage: Message = {
      id: generateUUID(),
      trip_id: tripId || 'temp',
      role: 'user',
      text,
      created_at: new Date().toISOString(),
    };

    // Create empty assistant message for streaming
    const assistantMessageId = generateUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      trip_id: tripId || 'temp',
      role: 'assistant',
      text: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    try {
      if (onSendMessage) {
        await onSendMessage(text);
      } else {
        // Call streaming API endpoint
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trip_id: tripId,
            message: text,
            messages: messages, // Send conversation history for context
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        // Read the stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setIsLoading(false);
            break;
          }

          // Decode the chunk
          buffer += decoder.decode(value, { stream: true });

          // Process complete messages (separated by \n\n)
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'toolCalls') {
                  // Update message with tool calls
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, tool_calls_json: data.toolCalls }
                        : msg
                    )
                  );
                } else if (data.type === 'cards') {
                  // Add cards IMMEDIATELY after tools complete (BEFORE AI response text)
                  // This provides instant visual feedback to the user
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, cards_json: data.cards }
                        : msg
                    )
                  );
                } else if (data.type === 'content') {
                  // Add to buffer for controlled release (slower display)
                  contentBufferRef.current += data.content;
                  if (!displayIntervalRef.current) {
                    startContentDisplay(assistantMessageId);
                  }
                } else if (data.type === 'done') {
                  // Stop content buffer and flush remaining content
                  stopContentDisplay();
                  // Add citations and final metadata (cards already added above)
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            citations_json: data.citations,
                          }
                        : msg
                    )
                  );
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
      }
    } catch (error) {
      console.error('Error sending message:', error);
      stopContentDisplay();
      // Update the assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, text: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* HERO SECTION - Fixed at top */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Logo and Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary shadow-glow">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-secondary bg-clip-text text-transparent">
                  Tripply
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  AI Travel Research Assistant
                </p>
              </div>
            </div>
            {/* Auth UI */}
            <div className="flex items-center gap-2">
              {!authLoading && (
                user ? <UserMenu /> : <SignInButton />
              )}
            </div>
          </div>

          {/* Search Input - Large and prominent */}
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder="Ask anything about your trip... hotels, weather, activities, and more"
            size="large"
          />

          {/* Sample prompts - only show when no messages */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6"
            >
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className={cn(
                    'text-left px-4 py-3 rounded-xl border border-border bg-card/50',
                    'hover:border-primary/50 hover:bg-card',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'text-sm text-foreground/80 hover:text-foreground'
                  )}
                >
                  {prompt}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </header>

      {/* RESULTS SECTION - Scrollable */}
      <main
        ref={scrollContainerRef}
        className="flex-1 container max-w-4xl mx-auto px-4 overflow-auto relative"
      >
        {messages.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Start Planning Your Trip
              </h2>
              <p className="text-muted-foreground">
                Search for destinations, compare hotels, check weather, and get personalized travel recommendations.
              </p>
            </div>
          </div>
        ) : (
          // Messages
          <div className="py-8">
            {messages.map((message, index) => {
              const isLast = index === messages.length - 1;

              if (message.role === 'user') {
                // User query - simple header
                return (
                  <div key={message.id} className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground">
                      {message.text}
                    </h3>
                    <div className="h-px bg-gradient-to-r from-primary/50 to-transparent mt-3" />
                  </div>
                );
              } else {
                // Assistant response
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLatest={isLast}
                  />
                );
              }
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 py-4">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary/70" />
                </div>
                <span className="text-sm text-muted-foreground">Researching...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className={cn(
                'fixed bottom-6 right-6 z-50',
                'flex items-center justify-center',
                'w-12 h-12 rounded-full',
                'bg-primary text-white shadow-lg',
                'hover:bg-primary/90 hover:shadow-xl',
                'transition-all duration-200',
                'border border-primary/20'
              )}
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="h-6 w-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
