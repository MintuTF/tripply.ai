'use client';

import { useEffect, useCallback } from 'react';
import { useAdSenseContext } from '@/components/ads/AdSenseProvider';
import type { AdUnitConfig } from '@/lib/adsense/types';

/**
 * useAdSense - Custom hook for AdSense functionality
 *
 * Features:
 * - Ad initialization and registration
 * - Ad refresh management
 * - Performance metrics
 * - Visibility tracking
 */
export function useAdSense(id?: string, config?: AdUnitConfig) {
  const { isAdBlockerActive, isScriptLoaded, adUnits, registerAdUnit, refreshAds } =
    useAdSenseContext();

  // Register ad unit on mount
  useEffect(() => {
    if (id && config && isScriptLoaded) {
      registerAdUnit(id, config);
    }
  }, [id, config, isScriptLoaded, registerAdUnit]);

  // Auto-refresh ads (optional - for high-traffic pages)
  const enableAutoRefresh = useCallback(
    (intervalMs: number = 30000) => {
      if (isAdBlockerActive || !isScriptLoaded) return;

      const interval = setInterval(() => {
        // Only refresh if page is visible
        if (document.visibilityState === 'visible') {
          refreshAds();
        }
      }, intervalMs);

      return () => clearInterval(interval);
    },
    [isAdBlockerActive, isScriptLoaded, refreshAds]
  );

  // Manual refresh
  const manualRefresh = useCallback(() => {
    if (!isAdBlockerActive && isScriptLoaded) {
      refreshAds();
    }
  }, [isAdBlockerActive, isScriptLoaded, refreshAds]);

  // Check if specific ad unit is registered
  const isAdUnitRegistered = useCallback(
    (adId: string) => {
      return adUnits.has(adId);
    },
    [adUnits]
  );

  // Get ad unit config
  const getAdUnitConfig = useCallback(
    (adId: string) => {
      return adUnits.get(adId);
    },
    [adUnits]
  );

  return {
    isAdBlockerActive,
    isScriptLoaded,
    isReady: isScriptLoaded && !isAdBlockerActive,
    registeredAdUnits: adUnits,
    enableAutoRefresh,
    manualRefresh,
    isAdUnitRegistered,
    getAdUnitConfig,
  };
}
