'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useResearch } from './ResearchContext';
import { Footprints, Heart, Wallet, Users, Star, Sparkles, TrendingUp } from 'lucide-react';

const filters = [
  { id: 'walkable', label: 'Walkable', icon: Footprints },
  { id: 'romantic', label: 'Romantic', icon: Heart },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'highly-rated', label: 'Top Rated', icon: Star },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
];

export function FilterChips() {
  const { activeFilters, toggleFilter } = useResearch();

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((filter, index) => {
          const isActive = activeFilters.includes(filter.id);
          const Icon = filter.icon;

          return (
            <motion.button
              key={filter.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                background: isActive
                  ? 'linear-gradient(135deg, #58A6C1, #6366F1)'
                  : '#FFFFFF',
              }}
              transition={{
                delay: index * 0.05,
                type: 'spring',
                stiffness: 500,
                damping: 35,
              }}
              onClick={() => toggleFilter(filter.id)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.05 }}
              className={cn(
                'relative flex items-center gap-1.5 sm:gap-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap overflow-hidden',
                'transition-all duration-200',
                'px-3 py-2 sm:px-4 sm:py-2.5 md:px-4 md:py-3',
                isActive
                  ? 'text-white border-none'
                  : 'text-[#262626] bg-white border border-[#E7E5E4] hover:bg-[#58A6C1]/10'
              )}
              style={{
                borderRadius: '20px',
              }}
            >
              {/* Icon with rotation animation on activation */}
              <motion.div
                animate={{
                  rotate: isActive ? [0, -10, 10, -10, 0] : 0,
                }}
                transition={{
                  duration: 0.5,
                }}
                className="relative z-10"
              >
                <Icon className="w-4 h-4" />
              </motion.div>

              {/* Label */}
              <span className="relative z-10">{filter.label}</span>

              {/* Sparkles icon for active state */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 35,
                    }}
                    className="relative z-10"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-sparkle" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active state glow effect */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full -z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 0.2, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #58A6C1, #6366F1)',
                    filter: 'blur(8px)',
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
