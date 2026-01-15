'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { cn } from '@/lib/utils';
import type { Trip, Message } from '@/types';

interface EditorialFlowProps {
  trip: Trip;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
}

function SkeletonPulse() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-4 bg-black/[0.03] rounded w-3/4" />
      <div className="h-4 bg-black/[0.03] rounded w-1/2" />
    </div>
  );
}

function QuickPrompt({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="px-4 py-2.5 rounded-xl bg-black/[0.02] hover:bg-black/[0.04]
                 text-sm text-muted-foreground hover:text-foreground
                 transition-all duration-200"
    >
      {text}
    </motion.button>
  );
}

export function EditorialFlow({ trip, messages, isLoading, onSendMessage }: EditorialFlowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const destination = trip.destination?.name || 'your destination';

  const quickPrompts = [
    `Best restaurants in ${destination}`,
    `Hidden gems in ${destination}`,
    `What should I avoid?`,
    `Local tips`,
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="max-w-lg"
        >
          <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary/70" />
          </div>
          <h2 className="text-xl font-medium text-foreground mb-2">
            Planning your trip to {destination}
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Ask me anything about places, restaurants, or local experiences.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {quickPrompts.map((prompt, idx) => (
              <QuickPrompt
                key={idx}
                text={prompt}
                onClick={() => onSendMessage(prompt)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Messages flow
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const isStreaming = message.role === 'assistant' && message.text === '';

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
              className="max-w-none"
            >
              {isUser ? (
                // User message - slightly bolder, that's all
                <p className="font-medium text-foreground leading-relaxed">
                  {message.text}
                </p>
              ) : isStreaming ? (
                // Loading state - subtle skeleton
                <SkeletonPulse />
              ) : (
                // AI message - rendered with markdown
                <div className="prose prose-sm max-w-none text-foreground/90">
                  <MarkdownRenderer content={message.text} />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
}
