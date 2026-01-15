'use client';

import { Map, Compass, Bookmark, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDestinationTheme } from './DestinationThemeProvider';

interface BottomNavProps {
  onMapOpen: () => void;
  onInsightsOpen: () => void;
  onSavedOpen: () => void;
  onNewChat: () => void;
  savedCount?: number;
  hasNewInsights?: boolean;
  activeTab?: 'map' | 'insights' | 'chat' | 'saved' | null;
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  badge?: number;
  showDot?: boolean;
  isActive?: boolean;
  accentColor?: string;
}

function NavButton({
  icon,
  label,
  onClick,
  primary,
  badge,
  showDot,
  isActive,
  accentColor,
}: NavButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-200',
        primary
          ? 'text-primary-foreground shadow-lg'
          : isActive
            ? 'text-foreground bg-accent/50'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
      )}
      style={
        primary
          ? {
              backgroundColor: accentColor || 'var(--primary)',
              boxShadow: `0 4px 14px ${accentColor || 'var(--primary)'}40`,
            }
          : undefined
      }
    >
      {/* Primary button glow effect */}
      {primary && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-50"
          style={{ backgroundColor: accentColor || 'var(--primary)' }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Icon with badge */}
      <div className="relative">
        {icon}

        {/* Badge for count */}
        <AnimatePresence>
          {badge !== undefined && badge > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center"
            >
              {badge > 99 ? '99+' : badge}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dot indicator for new content */}
        <AnimatePresence>
          {showDot && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className={cn('text-xs font-medium', primary && 'relative z-10')}>{label}</span>

      {/* Active indicator line */}
      {isActive && !primary && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ backgroundColor: accentColor || 'var(--primary)' }}
        />
      )}
    </motion.button>
  );
}

export function BottomNav({
  onMapOpen,
  onInsightsOpen,
  onSavedOpen,
  onNewChat,
  savedCount = 0,
  hasNewInsights = false,
  activeTab = null,
}: BottomNavProps) {
  // Try to get theme, fallback to default color
  let accentColor: string | undefined;
  try {
    const { theme } = useDestinationTheme();
    accentColor = theme.primary;
  } catch {
    accentColor = undefined;
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex-shrink-0 border-t border-border/30 bg-card/95 backdrop-blur-xl px-2 py-2 safe-area-bottom"
    >
      <div className="flex items-center justify-around gap-1">
        <NavButton
          icon={<Map className="h-5 w-5" />}
          label="Map"
          onClick={onMapOpen}
          isActive={activeTab === 'map'}
          accentColor={accentColor}
        />
        <NavButton
          icon={<Compass className="h-5 w-5" />}
          label="Insights"
          onClick={onInsightsOpen}
          showDot={hasNewInsights}
          isActive={activeTab === 'insights'}
          accentColor={accentColor}
        />
        <NavButton
          icon={<Sparkles className="h-5 w-5" />}
          label="New Chat"
          onClick={onNewChat}
          primary
          isActive={activeTab === 'chat'}
          accentColor={accentColor}
        />
        <NavButton
          icon={<Bookmark className="h-5 w-5" />}
          label="Saved"
          onClick={onSavedOpen}
          badge={savedCount}
          isActive={activeTab === 'saved'}
          accentColor={accentColor}
        />
      </div>
    </motion.nav>
  );
}
