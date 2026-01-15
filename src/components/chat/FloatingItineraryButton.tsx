'use client';

import { Map, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface FloatingItineraryButtonProps {
  placesCount: number;
  onClick: () => void;
  isExpanded?: boolean;
  className?: string;
}

export function FloatingItineraryButton({
  placesCount,
  onClick,
  isExpanded = false,
  className,
}: FloatingItineraryButtonProps) {
  // Don't show if no places saved
  if (placesCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'flex items-center gap-2 px-4 py-3 rounded-full',
          'bg-gradient-to-r from-purple-600 to-pink-600',
          'text-white font-medium shadow-lg shadow-purple-300/50',
          'hover:shadow-xl hover:shadow-purple-400/50',
          'transition-shadow duration-300',
          className
        )}
      >
        <Map className="h-5 w-5" />
        <span>View My Trip</span>
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-sm font-bold">
          {placesCount}
        </span>
        {isExpanded && (
          <ChevronUp className="h-4 w-4 ml-1" />
        )}
      </motion.button>
    </AnimatePresence>
  );
}

/**
 * Minimal floating button variant
 */
export function FloatingItineraryButtonMinimal({
  placesCount,
  onClick,
}: Pick<FloatingItineraryButtonProps, 'placesCount' | 'onClick'>) {
  if (placesCount === 0) {
    return null;
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex items-center justify-center w-14 h-14 rounded-full',
        'bg-gradient-to-r from-purple-600 to-pink-600',
        'text-white shadow-lg shadow-purple-300/50',
        'hover:shadow-xl hover:shadow-purple-400/50',
        'transition-shadow duration-300'
      )}
    >
      <div className="relative">
        <Map className="h-6 w-6" />
        <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-white text-purple-600 text-xs font-bold">
          {placesCount}
        </span>
      </div>
    </motion.button>
  );
}

/**
 * Expandable floating panel that shows saved places preview
 */
export function FloatingItineraryPanel({
  placesCount,
  isOpen,
  onToggle,
  children,
}: {
  placesCount: number;
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  if (placesCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'absolute bottom-16 right-0 w-80 max-h-96',
              'bg-white dark:bg-gray-900 rounded-2xl',
              'border border-gray-200 dark:border-gray-700',
              'shadow-2xl overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  My Trip
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {placesCount} place{placesCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-72 p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-full',
          'bg-gradient-to-r from-purple-600 to-pink-600',
          'text-white font-medium shadow-lg shadow-purple-300/50',
          'hover:shadow-xl hover:shadow-purple-400/50',
          'transition-shadow duration-300'
        )}
      >
        <Map className="h-5 w-5" />
        <span>View My Trip</span>
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-sm font-bold">
          {placesCount}
        </span>
        <ChevronUp
          className={cn(
            'h-4 w-4 ml-1 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </motion.button>
    </div>
  );
}
