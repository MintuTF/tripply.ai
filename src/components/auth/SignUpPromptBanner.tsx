'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Cloud, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const BANNER_DISMISSED_KEY = 'tripply-signup-banner-dismissed';

interface SignUpPromptBannerProps {
  cardCount: number;
  isAuthenticated: boolean;
  onSignUp: () => void;
}

export function SignUpPromptBanner({
  cardCount,
  isAuthenticated,
  onSignUp,
}: SignUpPromptBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  // Check if banner should show
  useEffect(() => {
    // Don't show if authenticated
    if (isAuthenticated) {
      setIsVisible(false);
      return;
    }

    // Check if previously dismissed
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed) {
      setIsDismissed(true);
      setIsVisible(false);
      return;
    }

    setIsDismissed(false);

    // Show after 3+ cards
    if (cardCount >= 3) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cardCount, isAuthenticated]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  if (!isVisible || isDismissed || isAuthenticated) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'w-full max-w-lg px-4',
        'animate-in slide-in-from-bottom-4 fade-in duration-500'
      )}
    >
      <div className="relative bg-gradient-to-r from-primary/90 to-accent/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative p-5">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                You're on a roll!
              </h3>
              <p className="text-white/80 text-sm">
                {cardCount} places added to your trip
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Cloud className="h-4 w-4 text-white/70" />
              <span>Save to cloud</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Lock className="h-4 w-4 text-white/70" />
              <span>Never lose progress</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSignUp}
              className="flex-1 bg-white text-primary font-semibold py-2.5 px-4 rounded-xl hover:bg-white/90 transition-colors shadow-lg"
            >
              Sign up free
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
