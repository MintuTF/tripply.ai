'use client';

import { motion } from 'framer-motion';
import { MessageCircle, CalendarDays } from 'lucide-react';
import { ChatMode } from '@/types';
import { cn } from '@/lib/utils';

export interface ChatModeToggleProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

export function ChatModeToggle({ mode, onModeChange, disabled }: ChatModeToggleProps) {
  return (
    <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800 p-1">
      <button
        onClick={() => onModeChange('ask')}
        disabled={disabled}
        className={cn(
          'relative px-4 py-2 rounded-full text-sm font-medium transition-colors',
          'flex items-center gap-2',
          mode === 'ask'
            ? 'text-white'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {mode === 'ask' && (
          <motion.div
            layoutId="mode-toggle-bg"
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}
        <MessageCircle className="w-4 h-4 relative z-10" />
        <span className="relative z-10">Ask</span>
      </button>

      <button
        onClick={() => onModeChange('itinerary')}
        disabled={disabled}
        className={cn(
          'relative px-4 py-2 rounded-full text-sm font-medium transition-colors',
          'flex items-center gap-2',
          mode === 'itinerary'
            ? 'text-white'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {mode === 'itinerary' && (
          <motion.div
            layoutId="mode-toggle-bg"
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}
        <CalendarDays className="w-4 h-4 relative z-10" />
        <span className="relative z-10">Itinerary</span>
      </button>
    </div>
  );
}

/**
 * Compact variant for mobile
 */
export function ChatModeToggleCompact({ mode, onModeChange, disabled }: ChatModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
      <button
        onClick={() => onModeChange('ask')}
        disabled={disabled}
        className={cn(
          'relative p-2 rounded-md transition-colors',
          mode === 'ask'
            ? 'text-white'
            : 'text-gray-500 dark:text-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title="Ask Mode"
      >
        {mode === 'ask' && (
          <motion.div
            layoutId="mode-toggle-compact-bg"
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}
        <MessageCircle className="w-4 h-4 relative z-10" />
      </button>

      <button
        onClick={() => onModeChange('itinerary')}
        disabled={disabled}
        className={cn(
          'relative p-2 rounded-md transition-colors',
          mode === 'itinerary'
            ? 'text-white'
            : 'text-gray-500 dark:text-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title="Itinerary Mode"
      >
        {mode === 'itinerary' && (
          <motion.div
            layoutId="mode-toggle-compact-bg"
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}
        <CalendarDays className="w-4 h-4 relative z-10" />
      </button>
    </div>
  );
}
