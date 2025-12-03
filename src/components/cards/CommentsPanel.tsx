'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

interface CommentsPanelProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Mock comments data (in production, fetch from API)
const MOCK_COMMENTS: Record<string, Comment[]> = {
  '1': [
    {
      id: 'c1',
      user_name: 'Sarah Johnson',
      content: 'This hotel looks amazing! I stayed here last year and loved it.',
      created_at: '2025-01-20T10:30:00Z',
    },
    {
      id: 'c2',
      user_name: 'Mike Chen',
      content: 'A bit pricey but the location is perfect. Close to everything!',
      created_at: '2025-01-20T14:15:00Z',
    },
  ],
  '2': [
    {
      id: 'c3',
      user_name: 'Emma Davis',
      content: 'Book tickets in advance! Lines can be 2+ hours without skip-the-line tickets.',
      created_at: '2025-01-19T09:00:00Z',
    },
  ],
};

export function CommentsPanel({ cardId, isOpen, onClose }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS[cardId] || []);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Simulate API call
    const comment: Comment = {
      id: `c${Date.now()}`,
      user_name: 'You',
      content: newComment.trim(),
      created_at: new Date().toISOString(),
    };

    setComments([...comments, comment]);
    setNewComment('');
    setIsSubmitting(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
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
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md flex flex-col bg-card border-l-2 border-border shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Comments</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                  {comments.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                  <p className="text-sm font-semibold text-foreground">No comments yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Be the first to share your thoughts!
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {comment.user_avatar ? (
                          <img
                            src={comment.user_avatar}
                            alt={comment.user_name}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">
                            {comment.user_name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-border p-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className={cn(
                      'w-full rounded-xl border-2 border-border bg-background px-4 py-3',
                      'text-sm text-foreground placeholder:text-muted-foreground',
                      'resize-none transition-all duration-300',
                      'focus:outline-none focus:border-primary focus:shadow-glow'
                    )}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className={cn(
                    'rounded-xl p-3 transition-all duration-300',
                    newComment.trim() && !isSubmitting
                      ? 'gradient-primary text-white shadow-lg hover:shadow-xl hover:scale-105'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
