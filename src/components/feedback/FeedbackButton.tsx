'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedbackModal } from './FeedbackModal';

interface FeedbackButtonProps {
  className?: string;
}

export function FeedbackButton({ className }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center justify-center p-2 rounded-lg',
          'border border-border hover:bg-accent',
          'text-muted-foreground hover:text-foreground',
          'transition-colors',
          className
        )}
        title="Send Feedback"
        aria-label="Send Feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
