'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function SignInModal({
  isOpen,
  onClose,
  title = 'Sign in to Tripply',
  description = 'Save your trips and access them from anywhere.',
}: SignInModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Magic link state
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Mount effect for portal
  useEffect(() => {
    setMounted(true);
  }, []);

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
      setEmail('');
      setEmailSent(false);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Close on outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/travel?resumeTrip=true`,
      },
    });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/travel?resumeTrip=true`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setEmailSent(true);
    }

    setIsLoading(false);
  };

  const handleResendMagicLink = async () => {
    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/travel?resumeTrip=true`,
      },
    });

    if (authError) {
      setError(authError.message);
    }

    setIsLoading(false);
  };

  const handleTryDifferentEmail = () => {
    setEmailSent(false);
    setEmail('');
    setError(null);
  };

  // Don't render on server
  if (!mounted) return null;
  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
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
          {emailSent ? (
            // Success State - Email Sent
            <>
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-2">Check your email</h2>

              {/* Description */}
              <p className="text-muted-foreground text-center mb-2">
                We sent a magic link to:
              </p>
              <p className="text-foreground font-medium text-center mb-6">
                {email}
              </p>
              <p className="text-sm text-muted-foreground text-center mb-8">
                Click the link in the email to sign in. The link expires in 1 hour.
              </p>

              {/* Resend button */}
              <button
                onClick={handleResendMagicLink}
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
                  'border border-border bg-background hover:bg-accent',
                  'text-base font-medium transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Resend Magic Link
                  </>
                )}
              </button>

              {/* Try different email */}
              <button
                onClick={handleTryDifferentEmail}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Try a different email
              </button>

              {/* Error message */}
              {error && (
                <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
              )}
            </>
          ) : (
            // Default State - Sign In Form
            <>
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-2">{title}</h2>

              {/* Description */}
              <p className="text-muted-foreground text-center mb-8">{description}</p>

              {/* Magic Link Form */}
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter your email"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'border border-border bg-background',
                      'text-base placeholder:text-muted-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                      'transition-colors',
                      error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                    )}
                    autoComplete="email"
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
                    'gradient-primary text-white font-medium',
                    'hover:opacity-90 transition-all',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'shadow-lg hover:shadow-xl'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Magic Link
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-3">
                We&apos;ll email you a one-time link to sign in. No password needed.
              </p>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              {/* Google Sign in button */}
              <button
                onClick={handleGoogleSignIn}
                className={cn(
                  'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl',
                  'border border-border bg-background hover:bg-accent',
                  'text-base font-medium transition-colors'
                )}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Continue as guest */}
              <button
                onClick={onClose}
                className="w-full mt-4 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue without saving
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
