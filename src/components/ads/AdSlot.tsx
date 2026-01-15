'use client';

import { useEffect, useRef, useState } from 'react';
import type { AdSlotProps } from '@/lib/adsense/types';
import { cn } from '@/lib/utils';
import {
  trackAdImpression,
  trackAdViewability,
  trackAdError,
  adPerformanceTracker,
} from '@/lib/adsense/analytics';

/**
 * AdSlot - Reusable Google AdSense ad container component
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Skeleton loading state
 * - CLS prevention with fixed dimensions
 * - Error boundary handling
 * - Priority-based loading thresholds
 */
export function AdSlot({
  slot,
  format = 'auto',
  responsive = true,
  className,
  style,
  layout = 'display',
  priority = 'normal',
}: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [viewabilityTracked, setViewabilityTracked] = useState(false);
  const viewabilityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Priority-based loading thresholds
  const getThreshold = () => {
    switch (priority) {
      case 'high':
        return '0px'; // Load immediately when in viewport
      case 'low':
        return '500px'; // Load when 500px from viewport
      default:
        return '200px'; // Load when 200px from viewport
    }
  };

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!adRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      {
        rootMargin: getThreshold(),
        threshold: 0.01,
      }
    );

    observer.observe(adRef.current);

    return () => {
      if (adRef.current) {
        observer.unobserve(adRef.current);
      }
    };
  }, [isVisible, priority]);

  // Initialize AdSense when visible
  useEffect(() => {
    if (!isVisible) return;

    let mounted = true;
    let checkInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Check if AdSense script is loaded
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        // Push ad to AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        if (mounted) setIsLoaded(true);
      } else {
        // Wait for script to load - extended timeout for new accounts
        checkInterval = setInterval(() => {
          if (window.adsbygoogle && mounted) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setIsLoaded(true);
            if (checkInterval) clearInterval(checkInterval);
          }
        }, 100);

        // Extended timeout for new AdSense accounts (10 seconds instead of 5)
        timeoutId = setTimeout(() => {
          if (checkInterval) clearInterval(checkInterval);
          if (!isLoaded && mounted) {
            // Don't mark as error immediately - log warning instead
            console.warn(`[AdSense] Ad slow to load for slot: ${slot}. This is normal for new accounts.`);
            // Still set loaded to true to prevent blocking
            setIsLoaded(true);
          }
        }, 10000);
      }
    } catch (error) {
      console.error('AdSense initialization error:', error);
      if (mounted) {
        // Don't set error for new accounts - just log
        console.warn(`[AdSense] Non-critical error for slot ${slot}:`, error);
        setIsLoaded(true); // Prevent blocking
      }
    }

    return () => {
      mounted = false;
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, isLoaded, slot]);

  // Track ad impression when loaded
  useEffect(() => {
    if (isLoaded && !hasError) {
      trackAdImpression(slot, format, priority);
      adPerformanceTracker.recordImpression(slot);
    }
  }, [isLoaded, hasError, slot, format, priority]);

  // Track ad viewability (50%+ visible for 1+ seconds)
  useEffect(() => {
    if (!isLoaded || hasError || viewabilityTracked || !adRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Start timer - mark as viewable after 1 second
            viewabilityTimerRef.current = setTimeout(() => {
              const visiblePercentage = Math.round(entry.intersectionRatio * 100);
              trackAdViewability(slot, visiblePercentage, 1000);
              adPerformanceTracker.recordViewable(slot, 1000);
              setViewabilityTracked(true);
            }, 1000);
          } else {
            // Clear timer if ad goes out of view before 1 second
            if (viewabilityTimerRef.current) {
              clearTimeout(viewabilityTimerRef.current);
              viewabilityTimerRef.current = null;
            }
          }
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
      if (viewabilityTimerRef.current) {
        clearTimeout(viewabilityTimerRef.current);
      }
    };
  }, [isLoaded, hasError, viewabilityTracked, slot]);

  // Track errors (only for critical errors)
  useEffect(() => {
    if (hasError) {
      // Only log to console for new accounts, don't track as error
      console.info(`[AdSense] Ad placeholder shown for slot: ${slot}. Waiting for AdSense approval.`);
    }
  }, [hasError, slot]);

  // Get ad dimensions based on format
  const getAdDimensions = () => {
    if (!responsive) {
      switch (format) {
        case 'horizontal':
          return { width: 728, height: 90 };
        case 'rectangle':
          return { width: 300, height: 250 };
        case 'vertical':
          return { width: 300, height: 600 };
        default:
          return { width: 'auto', height: 250 };
      }
    }
    return { width: '100%', height: 'auto' };
  };

  const dimensions = getAdDimensions();

  // For new accounts, show placeholder instead of hiding completely
  // This helps with testing and layout verification
  const showPlaceholder = hasError && process.env.NODE_ENV === 'development';

  // Hide completely in production if error, show placeholder in dev
  if (hasError && !showPlaceholder) {
    return null;
  }

  return (
    <div
      ref={adRef}
      className={cn(
        'relative overflow-hidden',
        'border border-gray-100 dark:border-gray-800 rounded-lg',
        'bg-gray-50 dark:bg-gray-900',
        className
      )}
      style={{
        minWidth: typeof dimensions.width === 'number' ? `${dimensions.width}px` : dimensions.width,
        minHeight: typeof dimensions.height === 'number' ? `${dimensions.height}px` : dimensions.height,
        ...style,
      }}
    >
      {/* Ad Label */}
      <div className="absolute top-1 left-1 z-10">
        <span className="text-[10px] text-gray-400 dark:text-gray-600 px-1.5 py-0.5 bg-white/50 dark:bg-black/50 rounded backdrop-blur-sm">
          Advertisement
        </span>
      </div>

      {/* Development Placeholder (for new accounts) */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-xs text-gray-400 dark:text-gray-600 mb-2">
              AdSense Placeholder
            </div>
            <div className="text-[10px] text-gray-300 dark:text-gray-700">
              Slot: {slot}
            </div>
            <div className="text-[10px] text-gray-300 dark:text-gray-700 mt-1">
              Waiting for AdSense approval
            </div>
          </div>
        </div>
      )}

      {/* Skeleton Loading State */}
      {isVisible && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse" />
        </div>
      )}

      {/* AdSense Ad Unit */}
      {isVisible && !hasError && (
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            width: typeof dimensions.width === 'number' ? `${dimensions.width}px` : '100%',
            height: typeof dimensions.height === 'number' ? `${dimensions.height}px` : 'auto',
          }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format={format}
          data-ad-layout={layout}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      )}
    </div>
  );
}
