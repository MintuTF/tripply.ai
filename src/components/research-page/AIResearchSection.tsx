'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Mic,
  Paperclip,
  Loader2,
  Bot,
  User,
  ChevronRight,
  Heart,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaceCard, ToolCall, Citation } from '@/types';
import { ChatMapSidebar } from './ChatMapSidebar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SuggestedPrompt {
  text: string;
  category: string;
}

interface AIResearchSectionProps {
  destination: string;
  destinationCoords?: { lat: number; lng: number } | null;
  onSendMessage?: (message: string) => void;
  messages?: Message[];
  isLoading?: boolean;
  aiGeneratedCards?: PlaceCard[];
  toolProgress?: ToolCall[];
  citations?: Citation[];
  onSaveCard?: (place: PlaceCard, day?: number) => void;
  className?: string;
}

const SUGGESTED_PROMPTS: Record<string, SuggestedPrompt[]> = {
  default: [
    { text: 'Best restaurants for local cuisine', category: 'Food' },
    { text: 'Hidden gems and secret spots', category: 'Explore' },
    { text: 'How to get around like a local', category: 'Transport' },
    { text: 'Best neighborhoods to explore', category: 'Areas' },
    { text: 'Budget tips and money saving', category: 'Budget' },
    { text: 'Cultural etiquette and customs', category: 'Culture' },
  ],
  Tokyo: [
    { text: 'Best ramen shops in Shibuya', category: 'Food' },
    { text: 'Hidden temples off the tourist path', category: 'Culture' },
    { text: 'JR Pass vs individual tickets', category: 'Transport' },
    { text: 'Best areas for nightlife', category: 'Nightlife' },
    { text: 'Where to see cherry blossoms', category: 'Nature' },
    { text: 'Best shopping districts', category: 'Shopping' },
  ],
  Paris: [
    { text: 'Best croissants in Le Marais', category: 'Food' },
    { text: 'Secret courtyards and passages', category: 'Explore' },
    { text: 'How to use the Metro', category: 'Transport' },
    { text: 'Best wine bars for locals', category: 'Drinks' },
    { text: 'Day trips from Paris', category: 'Trips' },
    { text: 'Avoiding tourist traps', category: 'Tips' },
  ],
  Bali: [
    { text: 'Best beach clubs in Seminyak', category: 'Beach' },
    { text: 'Sacred temples to visit', category: 'Culture' },
    { text: 'Scooter rental tips', category: 'Transport' },
    { text: 'Best rice terrace viewpoints', category: 'Nature' },
    { text: 'Where to learn surfing', category: 'Activities' },
    { text: 'Balinese cooking classes', category: 'Food' },
  ],
};

// Helper function to get user-friendly tool labels
function getToolLabel(toolName: string): string {
  const labels: Record<string, string> = {
    'search_places': '🔍 Searching places...',
    'search_hotel_offers': '🏨 Finding hotels...',
    'get_weather': '🌤️ Checking weather...',
    'search_events': '🎉 Looking for events...',
    'search_web': '🌐 Searching web...',
    'search_reddit': '💬 Checking Reddit...',
    'calculate_travel_time': '🚗 Calculating route...',
    'get_place_details': '📍 Getting details...',
  };
  return labels[toolName] || '🤔 Thinking...';
}

export function AIResearchSection({
  destination,
  destinationCoords,
  onSendMessage,
  messages = [],
  isLoading = false,
  aiGeneratedCards = [],
  toolProgress = [],
  citations = [],
  onSaveCard,
  className,
}: AIResearchSectionProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const prompts = SUGGESTED_PROMPTS[destination] || SUGGESTED_PROMPTS.default;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSendMessage?.(inputValue.trim());
    setInputValue('');
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn('py-12 bg-gradient-to-b from-background to-accent/20', className)}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.4 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4"
          >
            <Sparkles className="h-7 w-7 text-primary" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            AI Research Assistant
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Ask me anything about {destination}. I'll help you discover the best places,
            plan activities, and get insider tips.
          </p>
        </div>

        {/* Messages Area (if there are messages) */}
        {messages.length > 0 && (
          <div className="mb-6 max-h-[400px] overflow-y-auto rounded-2xl border border-border bg-card/50 p-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    'flex gap-3 mb-4 last:mb-0',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-foreground'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-accent text-foreground rounded-tl-sm'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Tool Progress Indicators */}
            {toolProgress.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 mb-4"
              >
                {toolProgress.map((tool) => (
                  <div
                    key={tool.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
                  >
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{getToolLabel(tool.tool)}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* AI-Generated Place Cards */}
            {aiGeneratedCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aiGeneratedCards.map((card) => (
                    <motion.div
                      key={card.id}
                      id={`ai-card-${card.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border border-border bg-card hover:shadow-lg transition-all"
                    >
                      {card.photos?.[0] && (
                        <img
                          src={card.photos[0]}
                          alt={card.name}
                          className="w-full h-32 rounded-lg object-cover mb-3"
                        />
                      )}
                      <h3 className="font-semibold text-foreground mb-1">{card.name}</h3>
                      {card.address && (
                        <p className="text-xs text-muted-foreground mb-2">{card.address}</p>
                      )}
                      {card.rating && (
                        <div className="flex items-center gap-1 text-sm mb-3">
                          <span className="text-amber-500">★</span>
                          <span className="font-medium">{card.rating.toFixed(1)}</span>
                          {card.review_count && (
                            <span className="text-muted-foreground">({card.review_count})</span>
                          )}
                        </div>
                      )}

                      {/* Save Button with Day Assignment */}
                      {onSaveCard && (
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => {
                              const day = parseInt(e.target.value);
                              if (day > 0) {
                                onSaveCard(card, day);
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border-2 border-border bg-background text-foreground text-sm font-medium hover:border-primary/50 focus:outline-none focus:border-primary transition-colors"
                            defaultValue="0"
                          >
                            <option value="0">Select day...</option>
                            {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => (
                              <option key={day} value={day}>
                                Day {day}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => onSaveCard(card)}
                            className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium flex items-center gap-2"
                            title="Save without day assignment"
                          >
                            <Heart className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Map Sidebar */}
                {destinationCoords && (
                  <ChatMapSidebar
                    places={aiGeneratedCards}
                    center={destinationCoords}
                    onPlaceClick={(place) => {
                      // Scroll to the card
                      const cardElement = document.getElementById(`ai-card-${place.id}`);
                      cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="mt-4"
                  />
                )}
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-accent rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-foreground/40"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 rounded-full bg-foreground/40"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 rounded-full bg-foreground/40"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              'relative rounded-2xl border bg-card shadow-lg transition-all duration-200',
              isFocused
                ? 'border-primary ring-4 ring-primary/10'
                : 'border-border hover:border-primary/30'
            )}
          >
            {/* Sparkles decoration */}
            <div className="absolute -top-3 left-6 bg-card px-2">
              <div className="flex items-center gap-1.5 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-medium">AI-Powered</span>
              </div>
            </div>

            <div className="p-4">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={`Ask me anything about ${destination}...`}
                className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base min-h-[56px]"
                rows={1}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                    title="Voice input"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                    title="Attach file"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
                    inputValue.trim() && !isLoading
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Suggested Prompts */}
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <span>Suggested questions</span>
            <ChevronRight className="h-4 w-4" />
          </p>
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt, index) => (
              <motion.button
                key={prompt.text}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                onClick={() => handlePromptClick(prompt.text)}
                className="group flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-sm"
              >
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {prompt.category}
                </span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {prompt.text}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default AIResearchSection;
