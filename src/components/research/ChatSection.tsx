'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Trip, Message } from '@/types';

interface ChatSectionProps {
  tripId: string;
  trip: Trip;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  compact?: boolean;
}

function MessageBubble({ message, compact }: { message: Message; compact?: boolean }) {
  const isUser = message.role === 'user';
  const isStreaming = message.role === 'assistant' && message.text === '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 rounded-full flex items-center justify-center',
        compact ? 'w-7 h-7' : 'w-8 h-8',
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
      )}>
        {isUser ? (
          <User className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        ) : (
          <Sparkles className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-2.5',
        compact ? 'text-sm' : 'text-sm',
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-md'
          : 'bg-card border border-border/50 rounded-tl-md shadow-sm'
      )}>
        {isStreaming ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        )}
      </div>
    </motion.div>
  );
}

function QuickPrompt({ text, onClick, compact }: { text: string; onClick: () => void; compact?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'px-4 py-2 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm',
        'text-sm text-muted-foreground hover:text-foreground hover:border-primary/30',
        'hover:bg-accent/50 transition-all duration-200 shadow-sm hover:shadow-md',
        compact ? 'text-xs px-3 py-1.5' : ''
      )}
    >
      {text}
    </motion.button>
  );
}

export function ChatSection({ tripId, trip, messages, isLoading, onSendMessage, compact }: ChatSectionProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const destination = trip.destination?.name || 'your destination';

  const quickPrompts = [
    `Best restaurants in ${destination}`,
    `Hidden gems in ${destination}`,
    `What should I avoid in ${destination}?`,
    `Local tips for ${destination}`,
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <section className={cn(
      'flex flex-col',
      compact ? 'flex-1 min-h-0' : 'flex-1 min-h-0'
    )}>
      {/* Messages Area */}
      <div className={cn(
        'flex-1 overflow-y-auto',
        compact ? 'px-3 py-3' : 'px-4 py-4'
      )}>
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md"
            >
              <div className={cn(
                'mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center',
                compact ? 'w-12 h-12' : 'w-16 h-16'
              )}>
                <Sparkles className={cn(
                  'text-violet-500',
                  compact ? 'h-6 w-6' : 'h-8 w-8'
                )} />
              </div>
              <h3 className={cn(
                'font-semibold text-foreground mb-2',
                compact ? 'text-base' : 'text-lg'
              )}>
                Ready to explore {destination}?
              </h3>
              <p className={cn(
                'text-muted-foreground mb-6',
                compact ? 'text-xs' : 'text-sm'
              )}>
                Ask me anything about places to visit, restaurants, local tips, or hidden gems.
              </p>

              {/* Quick Prompts */}
              <div className="flex flex-wrap justify-center gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <QuickPrompt
                    key={idx}
                    text={prompt}
                    onClick={() => onSendMessage(prompt)}
                    compact={compact}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Messages List */
          <div className={cn(
            'space-y-4',
            compact ? 'space-y-3' : 'space-y-4'
          )}>
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} compact={compact} />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={cn(
        'flex-shrink-0 border-t border-border/50 bg-card/50 backdrop-blur-sm',
        compact ? 'p-2' : 'p-3'
      )}>
        <form onSubmit={handleSubmit} className="relative">
          <div className={cn(
            'flex items-end gap-2 rounded-xl border border-border/50 bg-background/80',
            'focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20',
            'transition-all duration-200',
            compact ? 'p-1.5' : 'p-2'
          )}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${destination}...`}
              rows={1}
              className={cn(
                'flex-1 resize-none bg-transparent border-0 focus:outline-none focus:ring-0',
                'placeholder:text-muted-foreground/60',
                compact ? 'text-sm px-2 py-1 max-h-20' : 'text-sm px-3 py-1.5 max-h-32'
              )}
              style={{
                minHeight: compact ? '32px' : '36px',
                height: 'auto'
              }}
            />
            <motion.button
              type="submit"
              disabled={!input.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'flex-shrink-0 rounded-lg flex items-center justify-center',
                'bg-primary text-primary-foreground',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'hover:shadow-glow transition-all duration-200',
                compact ? 'w-8 h-8' : 'w-9 h-9'
              )}
            >
              {isLoading ? (
                <Loader2 className={cn('animate-spin', compact ? 'h-4 w-4' : 'h-4 w-4')} />
              ) : (
                <Send className={cn(compact ? 'h-4 w-4' : 'h-4 w-4')} />
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </section>
  );
}
