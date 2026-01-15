'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  X,
  Check,
  Clock,
  User,
  Calendar,
  MapPin,
  FileText,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConflictInfo } from '@/types';
import { formatTime12Hour } from '@/lib/utils/validation';

interface ConflictModalProps {
  conflicts: ConflictInfo[];
  isOpen: boolean;
  onClose: () => void;
  onResolve: (resolutions: Record<string, 'mine' | 'theirs'>) => void;
}

export function ConflictModal({
  conflicts,
  isOpen,
  onClose,
  onResolve,
}: ConflictModalProps) {
  const [resolutions, setResolutions] = useState<Record<string, 'mine' | 'theirs'>>({});

  if (!isOpen || conflicts.length === 0) return null;

  const allResolved = conflicts.every(c => resolutions[c.cardId]);

  const handleResolve = () => {
    onResolve(resolutions);
    setResolutions({});
    onClose();
  };

  const handleKeepAll = () => {
    const allMine: Record<string, 'mine' | 'theirs'> = {};
    conflicts.forEach(c => {
      allMine[c.cardId] = 'mine';
    });
    setResolutions(allMine);
  };

  const handleUseAll = () => {
    const allTheirs: Record<string, 'mine' | 'theirs'> = {};
    conflicts.forEach(c => {
      allTheirs[c.cardId] = 'theirs';
    });
    setResolutions(allTheirs);
  };

  const formatValue = (value: any, field: string): string => {
    if (value === null || value === undefined) return 'Not set';

    switch (field) {
      case 'time_slot':
        return formatTime12Hour(value as string);
      case 'day':
        return `Day ${value}`;
      case 'order':
        return `Position ${value + 1}`;
      case 'favorite':
        return value ? 'Favorited' : 'Not favorited';
      default:
        if (typeof value === 'object') {
          return JSON.stringify(value, null, 2);
        }
        return String(value);
    }
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'time_slot':
        return Clock;
      case 'day':
        return Calendar;
      case 'order':
        return ArrowRight;
      case 'notes':
        return FileText;
      default:
        return MapPin;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-orange-50 dark:bg-orange-900/10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Conflicts Detected</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {conflicts.length} activity{conflicts.length > 1 ? ' activities were' : ' was'} modified by another user
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Conflicts List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {conflicts.map((conflict, index) => {
              const FieldIcon = getFieldIcon(conflict.field);
              const resolution = resolutions[conflict.cardId];

              return (
                <motion.div
                  key={conflict.cardId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'rounded-xl border-2 transition-all',
                    resolution === 'mine' && 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
                    resolution === 'theirs' && 'border-purple-500 bg-purple-50 dark:bg-purple-900/10',
                    !resolution && 'border-border bg-background'
                  )}
                >
                  {/* Conflict Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <FieldIcon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-foreground">
                        Field: <span className="text-primary capitalize">{conflict.field.replace('_', ' ')}</span>
                      </h3>
                    </div>
                    {conflict.theirTimestamp && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Modified {formatTimestamp(conflict.theirTimestamp)}</span>
                        {conflict.theirUser && (
                          <>
                            <span>•</span>
                            <User className="h-3 w-3" />
                            <span>by {conflict.theirUser}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comparison Grid */}
                  <div className="grid grid-cols-2 divide-x divide-border">
                    {/* Your Version */}
                    <button
                      onClick={() => setResolutions(prev => ({ ...prev, [conflict.cardId]: 'mine' }))}
                      className={cn(
                        'p-5 text-left transition-all hover:bg-blue-50 dark:hover:bg-blue-900/10',
                        resolution === 'mine' && 'bg-blue-50 dark:bg-blue-900/10'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Your Changes
                        </h4>
                        {resolution === 'mine' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600"
                          >
                            <Check className="h-4 w-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                      <div className="bg-background rounded-lg p-3 border border-border">
                        <p className="text-sm font-mono text-foreground">
                          {formatValue(conflict.yourValue, conflict.field)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Your local version
                      </p>
                    </button>

                    {/* Their Version */}
                    <button
                      onClick={() => setResolutions(prev => ({ ...prev, [conflict.cardId]: 'theirs' }))}
                      className={cn(
                        'p-5 text-left transition-all hover:bg-purple-50 dark:hover:bg-purple-900/10',
                        resolution === 'theirs' && 'bg-purple-50 dark:bg-purple-900/10'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {conflict.theirUser ? `${conflict.theirUser}'s Changes` : 'Server Version'}
                        </h4>
                        {resolution === 'theirs' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600"
                          >
                            <Check className="h-4 w-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                      <div className="bg-background rounded-lg p-3 border border-border">
                        <p className="text-sm font-mono text-foreground">
                          {formatValue(conflict.theirValue, conflict.field)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Saved {formatTimestamp(conflict.theirTimestamp)}
                      </p>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border bg-accent/30 space-y-3">
            {/* Quick Actions */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {Object.keys(resolutions).length}/{conflicts.length} conflicts resolved
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleKeepAll}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-500 transition-colors font-medium"
                >
                  Keep All Mine
                </button>
                <button
                  onClick={handleUseAll}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:border-purple-500 transition-colors font-medium"
                >
                  Use All Theirs
                </button>
              </div>
            </div>

            {/* Main Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={!allResolved}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2',
                  allResolved
                    ? 'bg-primary text-white hover:bg-primary/90 hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                )}
              >
                <Check className="h-4 w-4" />
                Resolve {conflicts.length > 1 ? 'All' : ''} Conflict{conflicts.length > 1 ? 's' : ''}
              </button>
            </div>

            {!allResolved && (
              <p className="text-xs text-center text-muted-foreground">
                Please choose a version for each conflict before resolving
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
