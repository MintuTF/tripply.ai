'use client';

import { motion } from 'framer-motion';
import { Map, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export function MapToggle({ isActive, onToggle }: MapToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200',
        isActive
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
          : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
      )}
    >
      {isActive ? (
        <>
          <X className="w-4 h-4" />
          <span>Hide Map</span>
        </>
      ) : (
        <>
          <Map className="w-4 h-4" />
          <span>Show Map</span>
        </>
      )}
    </motion.button>
  );
}
