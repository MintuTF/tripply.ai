'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDestinationTheme } from './DestinationThemeProvider';
import { cn } from '@/lib/utils';

interface ThinkingInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
  className?: string;
}

export function ThinkingInput({
  onSubmit,
  isLoading,
  placeholder = 'What are you curious about?',
  className
}: ThinkingInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useDestinationTheme();

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('w-full', className)}
    >
      <div
        className={cn(
          'flex items-end gap-3 rounded-2xl',
          'bg-card/95 backdrop-blur-sm',
          'border border-border/50',
          'shadow-lg',
          'transition-all duration-200',
          'p-4',
          isFocused && 'border-primary/30 shadow-xl'
        )}
        style={{
          boxShadow: isFocused
            ? `0 8px 30px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
            : '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Sparkles
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-colors duration-200',
            isFocused ? 'text-primary' : 'text-muted-foreground/50'
          )}
          style={{ color: isFocused ? theme.primary : undefined }}
        />

        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent border-0',
            'text-foreground placeholder:text-muted-foreground/50',
            'focus:outline-none focus:ring-0',
            'text-sm leading-relaxed max-h-32'
          )}
          style={{ minHeight: '24px', height: 'auto' }}
        />

        <AnimatePresence>
          {(value.trim() || isLoading) && (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim() || isLoading}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
                'text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200'
              )}
              style={{ backgroundColor: theme.primary }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
