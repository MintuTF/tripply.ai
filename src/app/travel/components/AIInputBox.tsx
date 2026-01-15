'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInputBoxProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function AIInputBox({
  onSend,
  isLoading = false,
  placeholder = "Ask about your trip...",
  disabled = false
}: AIInputBoxProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="relative">
      <div className="flex items-end gap-3 p-2 bg-white rounded-2xl border-2 border-purple-100 shadow-lg shadow-purple-100/50 focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-100 transition-all">
        {/* Sparkles icon */}
        <div className="flex-shrink-0 pb-2 pl-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-gray-900 placeholder:text-gray-400',
            'focus:outline-none py-2',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />

        {/* Send button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading || disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all',
            message.trim() && !isLoading && !disabled
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200 hover:shadow-purple-300'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {/* Hint text */}
      <p className="text-xs text-gray-400 mt-2 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
