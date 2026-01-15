'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface SavedPlacesBadgeProps {
  count: number;
  onClick: () => void;
}

export function SavedPlacesBadge({ count, onClick }: SavedPlacesBadgeProps) {
  if (count === 0) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full
                 bg-purple-100 dark:bg-purple-900/20
                 hover:bg-purple-200 dark:hover:bg-purple-900/30
                 transition-colors cursor-pointer"
    >
      <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          className="text-sm font-medium text-purple-600 dark:text-purple-400"
        >
          {count} saved
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
