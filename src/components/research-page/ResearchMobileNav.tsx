'use client';

import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Bookmark,
  Map,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'discover', label: 'Discover', icon: Search },
  { id: 'places', label: 'Places', icon: MapPin },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'ai', label: 'AI', icon: Sparkles },
];

interface ResearchMobileNavProps {
  activeTab?: string;
  savedCount?: number;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export function ResearchMobileNav({
  activeTab = 'discover',
  savedCount = 0,
  onTabChange,
  className,
}: ResearchMobileNavProps) {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-background/80 backdrop-blur-xl border-t border-border',
        'pb-safe',
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showBadge = item.id === 'saved' && savedCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className="relative flex flex-col items-center justify-center w-16 py-1.5 group"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute -top-2 w-8 h-1 rounded-full bg-primary"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Icon container */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors',
                  isActive
                    ? 'bg-primary/10'
                    : 'group-hover:bg-accent'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />

                {/* Badge */}
                {showBadge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-primary-foreground bg-primary rounded-full"
                  >
                    {savedCount > 99 ? '99+' : savedCount}
                  </motion.span>
                )}
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-medium mt-1 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}

export default ResearchMobileNav;
