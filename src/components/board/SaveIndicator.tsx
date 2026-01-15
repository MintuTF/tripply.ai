import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  AlertTriangle,
  WifiOff,
  RotateCcw,
} from 'lucide-react';
import type { SaveStatus } from '@/types';

interface SaveIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
  onResolveConflicts?: () => void;
  className?: string;
}

export default function SaveIndicator({
  status,
  onRetry,
  onResolveConflicts,
  className = '',
}: SaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status.state) {
      case 'saved':
        return {
          icon: CheckCircle,
          text: 'All changes saved',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          show: true,
          autoHide: true,
        };

      case 'pending':
        return {
          icon: Clock,
          text: `${status.count} change${status.count > 1 ? 's' : ''} pending...`,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          show: true,
          autoHide: false,
          animated: true,
        };

      case 'saving':
        return {
          icon: Loader2,
          text: status.progress !== undefined ? `Saving... ${status.progress}%` : 'Saving...',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          show: true,
          autoHide: false,
          spinning: true,
        };

      case 'error':
        return {
          icon: AlertCircle,
          text: status.message,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          show: true,
          autoHide: false,
          action: onRetry ? { label: 'Retry', onClick: onRetry } : undefined,
        };

      case 'conflict':
        return {
          icon: AlertTriangle,
          text: `${status.conflicts.length} conflict${status.conflicts.length > 1 ? 's' : ''} detected`,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          show: true,
          autoHide: false,
          action: onResolveConflicts
            ? { label: 'Resolve', onClick: onResolveConflicts }
            : undefined,
        };

      case 'offline':
        return {
          icon: WifiOff,
          text: `Offline - ${status.queuedCount} change${status.queuedCount > 1 ? 's' : ''} queued`,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          show: true,
          autoHide: false,
        };

      default:
        return {
          icon: CheckCircle,
          text: '',
          color: '',
          bgColor: '',
          show: false,
          autoHide: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Auto-hide "saved" status after 3 seconds
  if (config.autoHide && status.state === 'saved') {
    setTimeout(() => {
      // Status will be updated by parent component
    }, 3000);
  }

  if (!config.show) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgColor} ${className}`}
      >
        <div className={`flex items-center justify-center ${config.color}`}>
          <Icon
            className={`h-4 w-4 ${config.spinning ? 'animate-spin' : ''} ${config.animated ? 'animate-pulse' : ''}`}
          />
        </div>

        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>

        {config.action && (
          <button
            onClick={config.action.onClick}
            className={`ml-2 px-2 py-1 text-xs font-medium rounded ${config.color} hover:opacity-80 transition-opacity underline`}
          >
            {config.action.label}
          </button>
        )}

        {status.state === 'saving' && status.progress !== undefined && (
          <div className="ml-2 w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-600 dark:bg-blue-400"
              initial={{ width: 0 }}
              animate={{ width: `${status.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Compact version for mobile/sidebar
export function SaveIndicatorCompact({
  status,
  onRetry,
  onResolveConflicts,
}: Omit<SaveIndicatorProps, 'className'>) {
  const getIcon = () => {
    switch (status.state) {
      case 'saved':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-600 animate-pulse" />;
      case 'saving':
        return <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      case 'conflict':
        return <AlertTriangle className="h-3 w-3 text-orange-600" />;
      case 'offline':
        return <WifiOff className="h-3 w-3 text-gray-600" />;
      default:
        return null;
    }
  };

  const getText = () => {
    switch (status.state) {
      case 'saved':
        return 'Saved';
      case 'pending':
        return `${status.count} pending`;
      case 'saving':
        return 'Saving...';
      case 'error':
        return 'Error';
      case 'conflict':
        return `${status.conflicts.length} conflicts`;
      case 'offline':
        return 'Offline';
      default:
        return '';
    }
  };

  if (status.state === 'saved') {
    return null; // Don't show in compact mode when saved
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-1"
    >
      {getIcon()}
      <span className="text-xs text-muted-foreground">{getText()}</span>
    </motion.div>
  );
}
