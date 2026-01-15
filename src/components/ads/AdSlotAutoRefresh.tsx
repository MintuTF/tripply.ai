'use client';

import { useEffect, useState, useRef } from 'react';
import { AdSlot } from './AdSlot';
import type { AdSlotProps } from '@/lib/adsense/types';
import { trackAdRefresh, adPerformanceTracker } from '@/lib/adsense/analytics';

interface AdSlotAutoRefreshProps extends AdSlotProps {
  /**
   * Enable auto-refresh for this ad
   * @default false
   */
  enableAutoRefresh?: boolean;

  /**
   * Refresh interval in milliseconds
   * @default 30000 (30 seconds)
   * Minimum: 30000ms (per AdSense policies)
   */
  refreshInterval?: number;

  /**
   * Maximum number of refreshes per session
   * @default 10
   */
  maxRefreshes?: number;
}

/**
 * AdSlotAutoRefresh - AdSlot with automatic refresh capability
 *
 * Use this for high-traffic pages to maximize ad revenue.
 * Auto-refresh will only happen when:
 * - Page is visible (not in background tab)
 * - User is active (recent mouse/keyboard activity)
 * - Ad is viewable (50%+ visible)
 * - Refresh limit not exceeded
 *
 * Best for:
 * - Homepage
 * - Discover page
 * - City explore pages
 * - Research page
 */
export function AdSlotAutoRefresh({
  enableAutoRefresh = false,
  refreshInterval = 30000,
  maxRefreshes = 10,
  ...adSlotProps
}: AdSlotAutoRefreshProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isAdViewable, setIsAdViewable] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const adRef = useRef<HTMLDivElement>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setIsActive(true);
    };

    // Activity events
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    // Check inactivity every 5 seconds
    const inactivityCheck = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      // Mark inactive after 2 minutes of no activity
      if (timeSinceActivity > 120000) {
        setIsActive(false);
      }
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(inactivityCheck);
    };
  }, [enableAutoRefresh]);

  // Track ad viewability for refresh eligibility
  useEffect(() => {
    if (!enableAutoRefresh || !adRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsAdViewable(entry.isIntersecting && entry.intersectionRatio >= 0.5);
        });
      },
      {
        threshold: [0.5],
      }
    );

    observer.observe(adRef.current);

    return () => {
      if (adRef.current) {
        observer.unobserve(adRef.current);
      }
    };
  }, [enableAutoRefresh]);

  // Auto-refresh logic
  useEffect(() => {
    if (!enableAutoRefresh) return;
    if (refreshCount >= maxRefreshes) {
      console.log(`[AdSlot] Max refreshes (${maxRefreshes}) reached for slot:`, adSlotProps.slot);
      return;
    }

    const shouldRefresh = () => {
      // Don't refresh if:
      // - Page is not visible
      if (document.visibilityState !== 'visible') return false;
      // - User is inactive
      if (!isActive) return false;
      // - Ad is not viewable
      if (!isAdViewable) return false;

      return true;
    };

    refreshTimerRef.current = setInterval(() => {
      if (shouldRefresh()) {
        console.log(`[AdSlot] Refreshing ad: ${adSlotProps.slot} (refresh #${refreshCount + 1})`);
        setRefreshKey((prev) => prev + 1);
        setRefreshCount((prev) => prev + 1);
        trackAdRefresh(adSlotProps.slot, refreshCount + 1);
        adPerformanceTracker.recordRefresh(adSlotProps.slot);
      }
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [
    enableAutoRefresh,
    refreshInterval,
    refreshCount,
    maxRefreshes,
    isActive,
    isAdViewable,
    adSlotProps.slot,
  ]);

  // Pause refresh when page is hidden
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableAutoRefresh]);

  return (
    <div ref={adRef}>
      <AdSlot key={refreshKey} {...adSlotProps} />
      {enableAutoRefresh && process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mt-1 text-center">
          Auto-refresh: {refreshCount}/{maxRefreshes} | Active: {isActive ? '✓' : '✗'} | Viewable:{' '}
          {isAdViewable ? '✓' : '✗'}
        </div>
      )}
    </div>
  );
}
