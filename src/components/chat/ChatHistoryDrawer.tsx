'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  MapPin,
  Trash2,
  X,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatConversation, ChatMode } from '@/types';

// Guest conversation type (matches ChatHistoryContext)
interface GuestConversation {
  id: string;
  destination: string;
  chat_mode: ChatMode;
  title: string;
  created_at: string;
  updated_at: string;
  messageCount: number;
}

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  conversations: ChatConversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  // Guest mode props
  isGuest?: boolean;
  guestConversations?: GuestConversation[];
  onDeleteGuestConversation?: (id: string) => void;
}

export function ChatHistoryDrawer({
  isOpen,
  conversations,
  currentConversationId,
  isLoading,
  onClose,
  onSelectConversation,
  onDeleteConversation,
  isGuest = false,
  guestConversations = [],
  onDeleteGuestConversation,
}: ChatHistoryDrawerProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Use guest conversations if in guest mode
  const displayConversations = isGuest ? guestConversations : conversations;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);

    setTimeout(() => {
      if (isGuest && onDeleteGuestConversation) {
        onDeleteGuestConversation(id);
      } else {
        onDeleteConversation(id);
      }
      setDeletingId(null);
    }, 200);
  };

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed top-0 left-0 h-full z-50',
              'w-[320px] max-w-[85vw]',
              'bg-white dark:bg-gray-950',
              'border-r border-gray-200 dark:border-gray-800',
              'flex flex-col',
              'shadow-2xl'
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
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : displayConversations.length === 0 ? (
                <EmptyState isGuest={isGuest} />
              ) : (
                <div className="space-y-2">
                  {displayConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === currentConversationId}
                      isDeleting={conversation.id === deletingId}
                      onSelect={() => handleSelect(conversation.id)}
                      onDelete={(e) => handleDelete(e, conversation.id)}
                      isGuest={isGuest}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Guest Warning */}
            {isGuest && displayConversations.length > 0 && (
              <div className="mx-3 mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">
                      Temporary history
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Sign in to save your chats permanently
                    </p>
                  </div>
                </div>
                <a
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 w-full mt-2 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </a>
              </div>
            )}

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {isGuest
                  ? `${displayConversations.length} temporary chat${displayConversations.length !== 1 ? 's' : ''}`
                  : `${conversations.length}/5 conversations saved`
                }
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ==================== SUB-COMPONENTS ====================

function ConversationItem({
  conversation,
  isActive,
  isDeleting,
  onSelect,
  onDelete,
  isGuest = false,
}: {
  conversation: ChatConversation | GuestConversation;
  isActive: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isGuest?: boolean;
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

function EmptyState({ isGuest = false }: { isGuest?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
        No conversations yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {isGuest
          ? 'Start chatting to try out the AI assistant'
          : 'Start chatting to save your travel conversations'
        }
      </p>
      {isGuest && (
        <a
          href="/auth/login"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign in for unlimited chats
        </a>
      )}
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
