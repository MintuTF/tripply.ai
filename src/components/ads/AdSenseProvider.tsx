'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AdSenseContextValue, AdUnitConfig } from '@/lib/adsense/types';

const AdSenseContext = createContext<AdSenseContextValue | undefined>(undefined);

interface AdSenseProviderProps {
  children: React.ReactNode;
}

/**
 * AdSenseProvider - Global AdSense management context
 *
 * Features:
 * - Centralized AdSense script loading
 * - Ad blocker detection
 * - Global ad unit registry
 * - Ad refresh management
 * - Performance monitoring
 */
export function AdSenseProvider({ children }: AdSenseProviderProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isAdBlockerActive, setIsAdBlockerActive] = useState(false);
  const [adUnits, setAdUnits] = useState<Map<string, AdUnitConfig>>(new Map());

  // Check if AdSense script is loaded
  useEffect(() => {
    const checkScript = () => {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        setIsScriptLoaded(true);
        console.log('✅ [AdSense] Script loaded successfully!');
        console.log('📊 [AdSense] Publisher ID:', process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);
        console.log('💡 [AdSense] Ads may take 24-48 hours to appear for new accounts');
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkScript()) return;

    // Poll for script load
    const interval = setInterval(() => {
      if (checkScript()) {
        clearInterval(interval);
      }
    }, 100);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isScriptLoaded) {
        console.warn('⚠️ [AdSense] Script loading slowly. Check your internet connection or AdSense configuration.');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isScriptLoaded]);

  // Ad blocker detection
  useEffect(() => {
    const detectAdBlocker = async () => {
      try {
        // Check if AdSense elements are being blocked
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbygoogle';
        testAd.style.width = '1px';
        testAd.style.height = '1px';
        testAd.style.position = 'absolute';
        testAd.style.left = '-10000px';

        document.body.appendChild(testAd);

        // Wait for potential blocking
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check if ad was blocked
        const isBlocked = testAd.offsetHeight === 0;
        setIsAdBlockerActive(isBlocked);

        document.body.removeChild(testAd);

        if (isBlocked) {
          console.info('Ad blocker detected - ads will not be displayed');
        }
      } catch (error) {
        console.error('Ad blocker detection error:', error);
      }
    };

    // Run detection after script loads
    if (isScriptLoaded) {
      detectAdBlocker();
    }
  }, [isScriptLoaded]);

  // Register an ad unit
  const registerAdUnit = useCallback((id: string, config: AdUnitConfig) => {
    setAdUnits((prev) => {
      const updated = new Map(prev);
      updated.set(id, config);
      return updated;
    });
  }, []);

  // Refresh all ads on the page
  const refreshAds = useCallback(() => {
    if (typeof window !== 'undefined' && window.adsbygoogle && isScriptLoaded) {
      try {
        // Clear and reload ads
        const ads = document.querySelectorAll('.adsbygoogle');
        ads.forEach((ad) => {
          // Reset ad state
          if (ad instanceof HTMLElement) {
            ad.setAttribute('data-adsbygoogle-status', '');
          }
        });

        // Push refresh to AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});

        console.log('Ads refreshed successfully');
      } catch (error) {
        console.error('Ad refresh error:', error);
      }
    }
  }, [isScriptLoaded]);

  // Performance monitoring
  useEffect(() => {
    if (!isScriptLoaded || isAdBlockerActive) return;

    // Log ad unit performance
    const logPerformance = () => {
      if (adUnits.size > 0) {
        console.log(`AdSense: ${adUnits.size} ad units registered`);
      }
    };

    // Log every 30 seconds in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(logPerformance, 30000);
      return () => clearInterval(interval);
    }
  }, [isScriptLoaded, isAdBlockerActive, adUnits]);

  const value: AdSenseContextValue = {
    isAdBlockerActive,
    isScriptLoaded,
    adUnits,
    registerAdUnit,
    refreshAds,
  };

  return <AdSenseContext.Provider value={value}>{children}</AdSenseContext.Provider>;
}

/**
 * useAdSenseContext - Hook to access AdSense context
 */
export function useAdSenseContext() {
  const context = useContext(AdSenseContext);

  if (context === undefined) {
    throw new Error('useAdSenseContext must be used within AdSenseProvider');
  }

  return context;
}
