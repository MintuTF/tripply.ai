'use client';

import { cn } from '@/lib/utils';
import { LogIn } from 'lucide-react';
import { useTripContext } from '@/context/TripContext';

interface SignInButtonProps {
  className?: string;
}

export function SignInButton({ className }: SignInButtonProps) {
  const { setShowSignInModal } = useTripContext();

  return (
    <button
      onClick={() => setShowSignInModal(true)}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
        'gradient-primary text-white',
        'text-sm font-medium transition-all',
        'hover:opacity-90 hover:shadow-lg',
        className
      )}
    >
      <LogIn className="w-4 h-4" />
      Sign In
    </button>
  );
}
