'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'info' | 'warning' | 'error';
  action?: ToastAction;
  thumbnail?: string;
}

export function Toast({
  message,
  isVisible,
  onClose,
  duration = 3000,
  type = 'success',
  action,
  thumbnail
}: ToastProps) {
  useEffect(() => {
    if (isVisible && !action) {  // Don't auto-dismiss if there's an action
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose, action]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl border-2 border-green-500/30 bg-green-500/10 backdrop-blur-sm px-4 py-3 shadow-lg max-w-md"
        >
          {thumbnail && (
            <img
              src={thumbnail}
              alt=""
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <span className="text-sm font-medium text-foreground flex-1">{message}</span>
          {action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                onClose();
              }}
              className="ml-3 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30
                         text-sm font-medium transition-colors whitespace-nowrap"
            >
              {action.label}
            </button>
          )}
          <button onClick={onClose} className="ml-2 hover:opacity-70 flex-shrink-0">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
