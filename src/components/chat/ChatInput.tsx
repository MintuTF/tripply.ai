'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  size?: 'default' | 'large';
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask about your trip...',
  className,
  size = 'default',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (but not Shift+Enter or during IME composition)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative group', className)}>
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full resize-none rounded-2xl border-2 border-input bg-card pr-14',
            'placeholder:text-muted-foreground/60',
            'focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-glow',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'overflow-y-auto',
            'transition-all duration-300',
            'backdrop-blur-sm',
            'shadow-sm hover:shadow-md',
            size === 'large' ? [
              'px-6 py-5',
              'text-base',
              'min-h-[72px] max-h-[200px]',
            ] : [
              'px-5 py-4',
              'text-sm',
              'min-h-[56px] max-h-[200px]',
            ]
          )}
          style={{
            height: 'auto',
            minHeight: size === 'large' ? '72px' : '56px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
          }}
        />

        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={cn(
            'absolute rounded-xl',
            'transition-all duration-300',
            'disabled:cursor-not-allowed disabled:opacity-40',
            message.trim() && !disabled
              ? 'gradient-primary text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-muted/50 text-muted-foreground',
            size === 'large' ? 'right-3 top-3 p-3' : 'right-2 top-2 p-2.5'
          )}
          aria-label="Send message"
        >
          {disabled ? (
            <Loader2 className={cn(size === 'large' ? 'h-6 w-6' : 'h-5 w-5', 'animate-spin')} />
          ) : (
            <Send className={cn(size === 'large' ? 'h-6 w-6' : 'h-5 w-5')} />
          )}
        </button>
      </div>
    </form>
  );
}
