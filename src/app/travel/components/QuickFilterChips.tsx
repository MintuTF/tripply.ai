'use client';

import { motion } from 'framer-motion';
import { Flame, Hotel, UtensilsCrossed, MapPin } from 'lucide-react';
import type { QuickFilter } from '@/lib/travel/types';

const filters = [
  { id: 'all' as QuickFilter, label: 'All', icon: Flame },
  { id: 'hotels' as QuickFilter, label: 'Hotels', icon: Hotel },
  { id: 'activities' as QuickFilter, label: 'Activities', icon: MapPin },
  { id: 'restaurants' as QuickFilter, label: 'Restaurants', icon: UtensilsCrossed },
];

interface QuickFilterChipsProps {
  activeFilter: QuickFilter;
  onFilterChange: (filter: QuickFilter) => void;
}

export function QuickFilterChips({ activeFilter, onFilterChange }: QuickFilterChipsProps) {
  return (
    <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-sm border-b border-purple-100">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map(filter => {
            const isActive = activeFilter === filter.id;
            const Icon = filter.icon;
            return (
              <motion.button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-purple-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4" />
                <span>{filter.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
