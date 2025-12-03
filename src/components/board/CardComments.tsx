'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { Send, Smile, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  text: string;
  reactions: Record<string, string[]>; // emoji -> user_ids
  created_at: string;
}

interface CardCommentsProps {
  cardId: string;
}

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '😍', '🤔', '👎'];

export function CardComments({ cardId }: CardCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Load comments
  useEffect(() => {
    loadComments();
  }, [cardId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cards/${cardId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        // Use mock comments for demo
        setComments(getMockComments());
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments(getMockComments());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockComments = (): Comment[] => {
    if (!cardId) return [];
    return [
      {
        id: '1',
        user_id: 'user1',
        user_name: 'Alex',
        text: 'This looks amazing! We should definitely book this one.',
        reactions: { '👍': ['user2', 'user3'], '❤️': ['user2'] },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: '2',
        user_id: 'user2',
        user_name: 'Jordan',
        text: 'I heard great things about this place from friends who visited last month.',
        reactions: { '🔥': ['user1'] },
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/cards/${cardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) => [...prev, data.comment]);
      } else {
        // Add mock comment locally for demo
        const mockComment: Comment = {
          id: Date.now().toString(),
          user_id: user.id,
          user_name: user.name || user.email?.split('@')[0] || 'You',
          text: newComment.trim(),
          reactions: {},
          created_at: new Date().toISOString(),
        };
        setComments((prev) => [...prev, mockComment]);
      }
      setNewComment('');
    } catch (error) {
      console.error('Failed to send comment:', error);
      // Add locally anyway for demo
      const mockComment: Comment = {
        id: Date.now().toString(),
        user_id: user?.id || 'guest',
        user_name: user?.name || user?.email?.split('@')[0] || 'You',
        text: newComment.trim(),
        reactions: {},
        created_at: new Date().toISOString(),
      };
      setComments((prev) => [...prev, mockComment]);
      setNewComment('');
    } finally {
      setIsSending(false);
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    if (!user) return;

    // Optimistic update
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) return comment;

        const reactions = { ...comment.reactions };
        const userIds = reactions[emoji] || [];
        const hasReacted = userIds.includes(user.id);

        if (hasReacted) {
          reactions[emoji] = userIds.filter((id) => id !== user.id);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          reactions[emoji] = [...userIds, user.id];
        }

        return { ...comment, reactions };
      })
    );

    setShowEmojiPicker(null);

    // Send to API
    try {
      await fetch(`/api/cards/${cardId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, emoji }),
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
      // Reaction already updated optimistically, ignore error for demo
    }
  };

  const getReactionCount = (reactions: Record<string, string[]>, emoji: string) => {
    return reactions[emoji]?.length || 0;
  };

  const hasUserReacted = (reactions: Record<string, string[]>, emoji: string) => {
    return user && reactions[emoji]?.includes(user.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comments List */}
      <div className="flex-1 space-y-4 mb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : comments.length > 0 ? (
          <AnimatePresence initial={false}>
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {comment.user_avatar ? (
                      <img
                        src={comment.user_avatar}
                        alt={comment.user_name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-primary">
                        {comment.user_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{comment.user_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-sm text-foreground/80 break-words">{comment.text}</p>

                    {/* Reactions */}
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {Object.entries(comment.reactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(comment.id, emoji)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors',
                            hasUserReacted(comment.reactions, emoji)
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted hover:bg-muted/80'
                          )}
                        >
                          <span>{emoji}</span>
                          <span className="font-medium">{userIds.length}</span>
                        </button>
                      ))}

                      {/* Add Reaction Button */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id)
                          }
                          className={cn(
                            'rounded-full p-1 text-muted-foreground transition-all',
                            'opacity-0 group-hover:opacity-100',
                            'hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <Smile className="h-4 w-4" />
                        </button>

                        {/* Emoji Picker */}
                        <AnimatePresence>
                          {showEmojiPicker === comment.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-xl bg-card border border-border shadow-lg p-2 z-10"
                            >
                              {REACTION_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(comment.id, emoji)}
                                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-lg"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t border-border pt-4">
        {user ? (
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                placeholder="Add a comment..."
                className="flex-1 rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleSendComment}
                disabled={!newComment.trim() || isSending}
                className={cn(
                  'rounded-xl px-4 py-2 transition-all',
                  newComment.trim()
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Sign in to add comments
          </p>
        )}
      </div>
    </div>
  );
}
