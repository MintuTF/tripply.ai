'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Message } from '@/types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  tripId?: string;
  onSendMessage?: (message: string) => Promise<void>;
}

export function ChatInterface({ tripId, onSendMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      id: crypto.randomUUID(),
      trip_id: tripId || 'temp',
      role: 'user',
      text,
      created_at: new Date().toISOString(),
    };

    // Create empty assistant message for streaming
    const assistantMessageId = crypto.randomUUID();
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
                } else if (data.type === 'content') {
                  // Append content chunk to message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, text: msg.text + data.content }
                        : msg
                    )
                  );
                } else if (data.type === 'done') {
                  // Add citations, cards, and final metadata
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            citations_json: data.citations,
                            cards_json: data.cards,
                          }
                        : msg
                    )
                  );
                } else if (data.type === 'error') {
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
          <div className="flex items-center gap-3 mb-6">
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
      <main className="flex-1 container max-w-4xl mx-auto px-4">
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
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="text-primary font-medium">OpenAI</span> • Live weather, places, and event data
          </p>
        </div>
      </footer>
    </div>
  );
}
