'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, Loader2, CheckCircle, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackCategory = 'bug' | 'feature' | 'general';

const CATEGORIES: { value: FeedbackCategory; label: string; icon: typeof Bug; color: string }[] = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500' },
  { value: 'general', label: 'General Feedback', icon: HelpCircle, color: 'text-blue-500' },
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { user } = useAuth();

  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCategory('general');
      setMessage('');
      setIsSubmitting(false);
      setIsSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  // Close on outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || message.trim().length < 10) {
      setError('Please enter at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: submitError } = await supabase.from('feedback').insert({
      user_id: user?.id || null,
      category,
      message: message.trim(),
      user_email: user?.email || null,
      page_url: typeof window !== 'undefined' ? window.location.href : null,
    });

    if (submitError) {
      setError('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
      return;
    }

    setIsSuccess(true);
    setIsSubmitting(false);

    // Auto close after 2 seconds
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  // Use portal to render at document body level
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-w-md mx-4 bg-card rounded-2xl shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-accent transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="p-8">
          {isSuccess ? (
            // Success State
            <>
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-2">Thank you!</h2>
              <p className="text-muted-foreground text-center">
                Your feedback has been submitted. We appreciate you helping us improve Tripply.
              </p>
            </>
          ) : (
            // Form State
            <>
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-2">Send Feedback</h2>

              {/* Description */}
              <p className="text-muted-foreground text-center mb-6">
                Help us improve Tripply by sharing your thoughts.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                            category === cat.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          )}
                        >
                          <Icon className={cn('h-5 w-5', cat.color)} />
                          <span className="text-xs font-medium">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="feedback-message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setError(null);
                    }}
                    placeholder={
                      category === 'bug'
                        ? 'Describe the issue you encountered...'
                        : category === 'feature'
                        ? 'Describe the feature you would like...'
                        : 'Share your thoughts with us...'
                    }
                    rows={4}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl resize-none',
                      'border border-border bg-background',
                      'text-base placeholder:text-muted-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                      'transition-colors',
                      error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                    )}
                    autoFocus
                  />
                  {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
                    'gradient-primary text-white font-medium',
                    'hover:opacity-90 transition-all',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'shadow-lg hover:shadow-xl'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Send Feedback'
                  )}
                </button>
              </form>

              {/* Cancel */}
              <button
                onClick={onClose}
                className="w-full mt-4 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
