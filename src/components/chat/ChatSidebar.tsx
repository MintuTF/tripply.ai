'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  MapPin,
  Trash2,
  X,
  ChevronLeft,
  Clock,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatConversation, ChatMode } from '@/types';

interface ChatSidebarProps {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  isOpen: boolean;
  isLoading: boolean;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onClose: () => void;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  isOpen,
  isLoading,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onClose,
}: ChatSidebarProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);

    // Small delay for animation
    setTimeout(() => {
      onDeleteConversation(id);
      setDeletingId(null);
    }, 200);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'fixed lg:relative top-0 left-0 h-full z-50 lg:z-auto',
          'w-[280px] bg-white dark:bg-gray-950',
          'border-r border-gray-200 dark:border-gray-800',
          'flex flex-col',
          'lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            Chat History
          </h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl',
              'bg-gradient-to-r from-purple-600 to-pink-600',
              'text-white font-medium',
              'hover:from-purple-700 hover:to-pink-700',
              'shadow-lg shadow-purple-200 dark:shadow-purple-900/30',
              'transition-all duration-200',
              'active:scale-[0.98]'
            )}
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === currentConversationId}
                  isDeleting={conversation.id === deletingId}
                  onSelect={() => onSelectConversation(conversation.id)}
                  onDelete={(e) => handleDelete(e, conversation.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer - Chat limit info */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {conversations.length}/5 conversations saved
          </p>
        </div>
      </motion.aside>
    </>
  );
}

// ==================== SUB-COMPONENTS ====================

function ConversationItem({
  conversation,
  isActive,
  isDeleting,
  onSelect,
  onDelete,
}: {
  conversation: ChatConversation;
  isActive: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const timeAgo = getTimeAgo(conversation.updated_at);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDeleting ? 0 : 1, y: 0, scale: isDeleting ? 0.95 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onSelect}
      className={cn(
        'group relative p-3 rounded-xl cursor-pointer',
        'transition-all duration-200',
        isActive
          ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-900 border border-transparent'
      )}
    >
      {/* Destination */}
      <div className="flex items-center gap-1.5 mb-1">
        <MapPin className="w-3.5 h-3.5 text-purple-500" />
        <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
          {conversation.destination}
        </span>
      </div>

      {/* Title/Preview */}
      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
        {conversation.title || 'New conversation'}
      </p>

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mode badge */}
          <ModeBadge mode={conversation.chat_mode} />

          {/* Time */}
          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        </div>

        {/* Delete button */}
        <button
          onClick={onDelete}
          className={cn(
            'p-1.5 rounded-lg opacity-0 group-hover:opacity-100',
            'hover:bg-red-50 dark:hover:bg-red-900/20',
            'text-gray-400 hover:text-red-500',
            'transition-all duration-200'
          )}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function ModeBadge({ mode }: { mode: ChatMode }) {
  const isAsk = mode === 'ask';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        isAsk
          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      )}
    >
      {isAsk ? (
        <>
          <Sparkles className="w-3 h-3" />
          Ask
        </>
      ) : (
        <>
          <Calendar className="w-3 h-3" />
          Itinerary
        </>
      )}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
        No conversations yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Start chatting to save your travel conversations
      </p>
    </div>
  );
}

// ==================== HELPERS ====================

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ==================== TOGGLE BUTTON ====================

export function ChatSidebarToggle({
  onClick,
  conversationCount = 0,
}: {
  onClick: () => void;
  conversationCount?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-gray-100 dark:bg-gray-800',
        'hover:bg-gray-200 dark:hover:bg-gray-700',
        'text-gray-700 dark:text-gray-300',
        'transition-colors'
      )}
    >
      <ChevronLeft className="w-4 h-4" />
      <span className="text-sm font-medium">History</span>
      {conversationCount > 0 && (
        <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded-full">
          {conversationCount}
        </span>
      )}
    </button>
  );
}
