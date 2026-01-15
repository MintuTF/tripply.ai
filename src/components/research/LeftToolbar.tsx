'use client';

import { Map, Sparkles, History, Bookmark, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LeftToolbarProps {
  mapOpen: boolean;
  onMapToggle: () => void;
  onNewChat: () => void;
  onHistoryToggle: () => void;
  onSavedToggle: () => void;
  historyOpen: boolean;
  savedDrawerOpen: boolean;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
}

function ToolbarButton({ icon, label, onClick, active, className }: ToolbarButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
        active
          ? 'bg-primary text-primary-foreground shadow-glow'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        className
      )}
    >
      {icon}

      {/* Tooltip */}
      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover border border-border rounded-lg shadow-lg
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200
                      whitespace-nowrap text-xs font-medium text-popover-foreground z-50">
        {label}
        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-popover border-l border-b border-border rotate-45" />
      </div>
    </motion.button>
  );
}

export function LeftToolbar({
  mapOpen,
  onMapToggle,
  onNewChat,
  onHistoryToggle,
  onSavedToggle,
  historyOpen,
  savedDrawerOpen,
}: LeftToolbarProps) {
  return (
    <aside className="w-[60px] flex-shrink-0 flex flex-col items-center py-4 bg-card border-r border-border/50">
      {/* Top Actions */}
      <div className="flex flex-col items-center gap-2">
        {/* Map Toggle */}
        <ToolbarButton
          icon={<Map className="h-5 w-5" />}
          label={mapOpen ? 'Close Map' : 'Open Map'}
          onClick={onMapToggle}
          active={mapOpen}
        />

        {/* New Chat */}
        <ToolbarButton
          icon={<Sparkles className="h-5 w-5" />}
          label="New Chat"
          onClick={onNewChat}
        />

        {/* Chat History */}
        <ToolbarButton
          icon={<History className="h-5 w-5" />}
          label="Chat History"
          onClick={onHistoryToggle}
          active={historyOpen}
        />

        {/* Saved Items */}
        <ToolbarButton
          icon={<Bookmark className="h-5 w-5" />}
          label="Saved Places"
          onClick={onSavedToggle}
          active={savedDrawerOpen}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-2">
        <ToolbarButton
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          onClick={() => {}}
        />
      </div>
    </aside>
  );
}
