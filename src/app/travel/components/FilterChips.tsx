'use client';

import { motion } from 'framer-motion';
import { Flame, Star, Heart, UtensilsCrossed, Moon, TreePine, Gift } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import { cn } from '@/lib/utils';

const filters = [
  { id: 'popular', label: 'Popular', icon: Flame },
  { id: 'top-rated', label: 'Top Rated', icon: Star },
  { id: 'romantic', label: 'Romantic', icon: Heart },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'nightlife', label: 'Nightlife', icon: Moon },
  { id: 'outdoor', label: 'Outdoor', icon: TreePine },
  { id: 'free', label: 'Free', icon: Gift },
];

export function FilterChips() {
  const { state, setFilter } = useTravel();
  const { activeFilter } = state;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((filter, index) => {
          const isActive = activeFilter === filter.id;
          const Icon = filter.icon;

          return (
            <motion.button
              key={filter.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.05,
                type: 'spring',
                stiffness: 500,
                damping: 35,
              }}
              onClick={() => setFilter(filter.id)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              className={cn(
                'relative flex items-center gap-2 rounded-full text-sm font-medium whitespace-nowrap',
                'transition-all duration-200',
                'px-4 py-2.5',
                isActive
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200'
                  : 'bg-white text-gray-700 border border-purple-100 hover:border-purple-200 hover:bg-purple-50'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-purple-500')} />
              <span>{filter.label}</span>

              {/* Active indicator glow */}
              {isActive && (
                <motion.div
                  layoutId="activeFilterGlow"
                  className="absolute inset-0 rounded-full -z-10"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    filter: 'blur(12px)',
                    opacity: 0.3,
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
