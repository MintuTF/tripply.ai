'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Plus, Clock } from 'lucide-react';

interface ChatFloatingMenuProps {
  onNewChat: () => void;
  onOpenHistory: () => void;
  conversationCount?: number;
}

export function ChatFloatingMenu({
  onNewChat,
  onOpenHistory,
  conversationCount = 0,
}: ChatFloatingMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed right-2 md:right-6 top-[45%] -translate-y-1/2 z-[45]"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-3 flex flex-col items-center gap-2">
        {/* Chat Brand Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />

        {/* New Chat Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewChat}
          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full"
        >
          <div className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Plus className="w-5 h-5 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <span className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400">
            New chat
          </span>
        </motion.button>

        {/* History Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenHistory}
          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full relative"
        >
          <div className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
            <Clock className="w-5 h-5 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
            {conversationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {conversationCount > 9 ? '9+' : conversationCount}
              </span>
            )}
          </div>
          <span className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400">
            History
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
