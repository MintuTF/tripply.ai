import { useRef, useCallback, useEffect, useState } from 'react';
import type { Card, SaveStatus, SavePriority, ConflictInfo } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface PendingChange {
  cardId: string;
  updates: Partial<Card>;
  priority: SavePriority;
  timestamp: number;
}

interface UseAutoSaveOptions {
  tripId: string;
  onStatusChange?: (status: SaveStatus) => void;
  onError?: (error: string) => void;
  onConflict?: (conflicts: ConflictInfo[]) => void;
  onSuccess?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEBOUNCE_TIMES = {
  critical: 500,   // Structural changes (day, order, labels)
  medium: 2000,    // Scheduling changes (time_slot, travel_mode)
  low: 5000,       // Metadata (notes, favorite)
};

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // Exponential backoff base (1s, 2s, 4s)
const OFFLINE_QUEUE_KEY = 'autosave_offline_queue';

// ============================================================================
// useAutoSave Hook
// ============================================================================

export function useAutoSave({ tripId, onStatusChange, onError, onConflict, onSuccess }: UseAutoSaveOptions) {
  // State
  const [status, setStatus] = useState<SaveStatus>({ state: 'saved' });
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Call onStatusChange whenever status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  // Refs for persistent state across renders
  const pendingChanges = useRef<Map<string, PendingChange>>(new Map());
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const serverVersions = useRef<Record<string, string>>({});
  const retryAttempts = useRef<Map<string, number>>(new Map());
  const isSaving = useRef(false);

  // ============================================================================
  // Online/Offline Detection
  // ============================================================================

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Flush offline queue when back online
      const offlineQueue = loadOfflineQueue();
      if (offlineQueue.length > 0) {
        offlineQueue.forEach(change => {
          pendingChanges.current.set(change.cardId, change);
        });
        flushAllPendingChanges();
        clearOfflineQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================================================
  // Offline Queue Persistence
  // ============================================================================

  const saveToOfflineQueue = useCallback((changes: PendingChange[]) => {
    try {
      const existing = loadOfflineQueue();
      const merged = [...existing, ...changes];
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(merged));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }, []);

  const loadOfflineQueue = useCallback((): PendingChange[] => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      return [];
    }
  }, []);

  const clearOfflineQueue = useCallback(() => {
    try {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
    }
  }, []);

  // ============================================================================
  // Batch Save to Server
  // ============================================================================

  const batchSave = useCallback(async (changes: PendingChange[]) => {
    if (changes.length === 0) return;

    isSaving.current = true;
    setStatus({ state: 'saving', progress: 0 });

    try {
      // Prepare batch request
      const batchRequest = {
        changes: changes.map(change => ({
          id: change.cardId,
          updates: change.updates,
        })),
        trip_id: tripId,
        client_version: serverVersions.current,
      };

      const response = await fetch('/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchRequest),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      // Update server versions for successfully saved cards
      result.saved.forEach((cardId: string) => {
        serverVersions.current[cardId] = result.server_versions[cardId];
        pendingChanges.current.delete(cardId);
        retryAttempts.current.delete(cardId);
      });

      // Handle conflicts
      if (result.conflicts && result.conflicts.length > 0) {
        const conflictInfos: ConflictInfo[] = result.conflicts.map((conflict: any) => ({
          cardId: conflict.id,
          field: 'unknown', // TODO: Determine which field conflicted
          yourValue: changes.find(c => c.cardId === conflict.id)?.updates,
          theirValue: conflict.server_data,
          theirTimestamp: conflict.server_version,
        }));

        setStatus({ state: 'conflict', conflicts: conflictInfos });

        if (onConflict) {
          onConflict(conflictInfos);
        }

        // Remove conflicted cards from pending
        result.conflicts.forEach((conflict: any) => {
          pendingChanges.current.delete(conflict.id);
        });
      }

      // Handle failed saves
      if (result.failed && result.failed.length > 0) {
        const errorMessages = result.failed.map((f: any) => `${f.id}: ${f.error}`).join(', ');

        // Retry failed changes with exponential backoff
        result.failed.forEach((failed: any) => {
          const attempts = retryAttempts.current.get(failed.id) || 0;

          if (attempts < MAX_RETRY_ATTEMPTS) {
            retryAttempts.current.set(failed.id, attempts + 1);
            const delay = RETRY_DELAY_BASE * Math.pow(2, attempts);

            setTimeout(() => {
              const change = pendingChanges.current.get(failed.id);
              if (change) {
                queueChange(change.cardId, change.updates, change.priority);
              }
            }, delay);
          } else {
            // Max retries exceeded
            pendingChanges.current.delete(failed.id);
            retryAttempts.current.delete(failed.id);
          }
        });

        if (result.failed.some((f: any) => (retryAttempts.current.get(f.id) || 0) >= MAX_RETRY_ATTEMPTS)) {
          setStatus({ state: 'error', message: `Failed to save: ${errorMessages}` });

          if (onError) {
            onError(errorMessages);
          }
        }
      }

      // Update status based on remaining pending changes
      if (pendingChanges.current.size === 0) {
        setStatus({ state: 'saved' });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        setStatus({ state: 'pending', count: pendingChanges.current.size });
      }

    } catch (error: any) {
      console.error('Batch save error:', error);

      // If offline, save to localStorage
      if (!isOnline) {
        saveToOfflineQueue(changes);
        setStatus({ state: 'offline', queuedCount: changes.length });
      } else {
        setStatus({ state: 'error', message: error.message || 'Failed to save changes' });

        if (onError) {
          onError(error.message || 'Failed to save changes');
        }
      }
    } finally {
      isSaving.current = false;
    }
  }, [tripId, isOnline, saveToOfflineQueue, onError, onConflict, onSuccess]);

  // ============================================================================
  // Flush Pending Changes
  // ============================================================================

  const flushChanges = useCallback((cardIds: string[]) => {
    const changes = cardIds
      .map(id => pendingChanges.current.get(id))
      .filter((change): change is PendingChange => change !== undefined);

    if (changes.length > 0) {
      batchSave(changes);
    }
  }, [batchSave]);

  const flushAllPendingChanges = useCallback(() => {
    const allCardIds = Array.from(pendingChanges.current.keys());
    flushChanges(allCardIds);
  }, [flushChanges]);

  // ============================================================================
  // Queue Change with Debouncing
  // ============================================================================

  const queueChange = useCallback((
    cardId: string,
    updates: Partial<Card>,
    priority: SavePriority = 'medium'
  ) => {
    // Update or add to pending changes
    const existing = pendingChanges.current.get(cardId);
    const mergedUpdates = existing ? { ...existing.updates, ...updates } : updates;

    const change: PendingChange = {
      cardId,
      updates: mergedUpdates,
      priority,
      timestamp: Date.now(),
    };

    pendingChanges.current.set(cardId, change);

    // Cancel existing timer for this card
    if (timers.current.has(cardId)) {
      clearTimeout(timers.current.get(cardId)!);
    }

    // Update status
    setStatus({ state: 'pending', count: pendingChanges.current.size });

    // If offline, save immediately to localStorage
    if (!isOnline) {
      saveToOfflineQueue([change]);
      setStatus({ state: 'offline', queuedCount: pendingChanges.current.size });
      return;
    }

    // Set new timer based on priority
    const debounceTime = DEBOUNCE_TIMES[priority];
    const timer = setTimeout(() => {
      flushChanges([cardId]);
      timers.current.delete(cardId);
    }, debounceTime);

    timers.current.set(cardId, timer);
  }, [isOnline, saveToOfflineQueue, flushChanges]);

  // ============================================================================
  // Force Flush (Manual Save)
  // ============================================================================

  const forceSave = useCallback(() => {
    // Clear all timers
    timers.current.forEach(timer => clearTimeout(timer));
    timers.current.clear();

    // Flush all pending changes immediately
    flushAllPendingChanges();
  }, [flushAllPendingChanges]);

  // ============================================================================
  // Cleanup on Unmount
  // ============================================================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChanges.current.size > 0) {
        // Attempt synchronous save
        forceSave();

        // Warn user
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Cleanup timers
      timers.current.forEach(timer => clearTimeout(timer));
      timers.current.clear();
    };
  }, [forceSave]);

  // ============================================================================
  // Queue Delete
  // ============================================================================

  const queueDelete = useCallback((cardId: string) => {
    // Queue a deletion by marking it as deleted
    queueChange(cardId, { id: cardId } as Partial<Card>, 'critical');

    // Also add a DELETE flag to track this is a deletion
    const change = pendingChanges.current.get(cardId);
    if (change) {
      (change as any).isDelete = true;
    }
  }, [queueChange]);

  // ============================================================================
  // Retry Failed Saves
  // ============================================================================

  const retryFailed = useCallback(() => {
    // Force save all pending changes (which includes any that failed and are still pending)
    forceSave();
  }, [forceSave]);

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    queueChange,
    queueDelete,
    retryFailed,
    forceSave,
    status,
    isOnline,
    hasPendingChanges: pendingChanges.current.size > 0,
  };
}
