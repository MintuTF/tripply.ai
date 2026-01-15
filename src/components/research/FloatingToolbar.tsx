'use client';

import { Map, Sparkles, History, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingToolbarProps {
  mapOpen: boolean;
  onMapToggle: () => void;
  onNewChat: () => void;
  onHistoryToggle: () => void;
  onSavedToggle: () => void;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}

function ToolButton({ icon, onClick, active, label }: ToolButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.03]'
      )}
      title={label}
    >
      {icon}
    </motion.button>
  );
}

export function FloatingToolbar({
  mapOpen,
  onMapToggle,
  onNewChat,
  onHistoryToggle,
  onSavedToggle,
}: FloatingToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-24 left-6 z-40 hidden lg:block"
    >
      <div className="flex flex-col gap-1 p-2 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm">
        <ToolButton
          icon={<Map className="h-5 w-5" />}
          onClick={onMapToggle}
          active={mapOpen}
          label="Map"
        />
        <ToolButton
          icon={<Sparkles className="h-5 w-5" />}
          onClick={onNewChat}
          label="New Chat"
        />
        <ToolButton
          icon={<History className="h-5 w-5" />}
          onClick={onHistoryToggle}
          label="History"
        />
        <ToolButton
          icon={<Bookmark className="h-5 w-5" />}
          onClick={onSavedToggle}
          label="Saved"
        />
      </div>
    </motion.div>
  );
}
