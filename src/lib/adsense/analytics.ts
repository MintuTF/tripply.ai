/**
 * Google AdSense Analytics & Performance Monitoring
 *
 * Tracks ad performance metrics and integrates with Google Analytics
 */

// Track ad impression
export function trackAdImpression(slotId: string, format: string, priority: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ad_impression', {
      event_category: 'AdSense',
      event_label: slotId,
      ad_format: format,
      ad_priority: priority,
      page_path: window.location.pathname,
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 [AdSense] Ad Impression:', {
      slot: slotId,
      format,
      priority,
      page: window.location.pathname,
    });
  }
}

// Track ad click
export function trackAdClick(slotId: string, format: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ad_click', {
      event_category: 'AdSense',
      event_label: slotId,
      ad_format: format,
      page_path: window.location.pathname,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🖱️ [AdSense] Ad Click:', {
      slot: slotId,
      format,
      page: window.location.pathname,
    });
  }
}

// Track ad viewability (ad was visible for at least 1 second)
export function trackAdViewability(slotId: string, visiblePercentage: number, visibleDuration: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ad_viewable', {
      event_category: 'AdSense',
      event_label: slotId,
      visible_percentage: visiblePercentage,
      visible_duration: visibleDuration,
      page_path: window.location.pathname,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('👁️ [AdSense] Ad Viewable:', {
      slot: slotId,
      visiblePercentage: `${visiblePercentage}%`,
      duration: `${visibleDuration}ms`,
    });
  }
}

// Track ad load error
export function trackAdError(slotId: string, errorType: string, errorMessage?: string) {
  // Only track to GA in production
  if (typeof window !== 'undefined' && window.gtag && process.env.NODE_ENV === 'production') {
    window.gtag('event', 'ad_error', {
      event_category: 'AdSense',
      event_label: slotId,
      error_type: errorType,
      error_message: errorMessage,
      page_path: window.location.pathname,
    });
  }

  // Use warning instead of error for better developer experience
  // New AdSense accounts commonly have loading delays
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ [AdSense] Ad not showing (normal for new accounts):', {
      slot: slotId,
      errorType,
      note: 'Ads may take 24-48 hours to appear for new accounts',
    });
  } else {
    console.error('❌ [AdSense] Ad Error:', {
      slot: slotId,
      errorType,
      errorMessage,
    });
  }
}

// Track ad refresh
export function trackAdRefresh(slotId: string, refreshCount: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ad_refresh', {
      event_category: 'AdSense',
      event_label: slotId,
      refresh_count: refreshCount,
      page_path: window.location.pathname,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 [AdSense] Ad Refresh:', {
      slot: slotId,
      count: refreshCount,
    });
  }
}

// Calculate ad revenue (estimated based on CPM)
export function estimateAdRevenue(impressions: number, ctr: number = 0.02, cpc: number = 0.5): number {
  const clicks = impressions * ctr;
  const revenue = clicks * cpc;
  return revenue;
}

// Performance metrics aggregation
export interface AdPerformanceMetrics {
  totalImpressions: number;
  totalClicks: number;
  totalRevenue: number;
  ctr: number;
  fillRate: number;
  viewabilityRate: number;
  averageViewDuration: number;
}

class AdPerformanceTracker {
  private metrics: Map<string, {
    impressions: number;
    clicks: number;
    viewable: number;
    errors: number;
    viewDurations: number[];
    refreshCount: number;
  }> = new Map();

  recordImpression(slotId: string) {
    const current = this.metrics.get(slotId) || {
      impressions: 0,
      clicks: 0,
      viewable: 0,
      errors: 0,
      viewDurations: [],
      refreshCount: 0,
    };

    current.impressions += 1;
    this.metrics.set(slotId, current);
  }

  recordClick(slotId: string) {
    const current = this.metrics.get(slotId);
    if (current) {
      current.clicks += 1;
      this.metrics.set(slotId, current);
    }
  }

  recordViewable(slotId: string, duration: number) {
    const current = this.metrics.get(slotId);
    if (current) {
      current.viewable += 1;
      current.viewDurations.push(duration);
      this.metrics.set(slotId, current);
    }
  }

  recordError(slotId: string) {
    const current = this.metrics.get(slotId);
    if (current) {
      current.errors += 1;
      this.metrics.set(slotId, current);
    }
  }

  recordRefresh(slotId: string) {
    const current = this.metrics.get(slotId);
    if (current) {
      current.refreshCount += 1;
      this.metrics.set(slotId, current);
    }
  }

  getMetrics(slotId: string): AdPerformanceMetrics | null {
    const data = this.metrics.get(slotId);
    if (!data) return null;

    const ctr = data.impressions > 0 ? data.clicks / data.impressions : 0;
    const fillRate = data.impressions > 0 ? (data.impressions - data.errors) / data.impressions : 0;
    const viewabilityRate = data.impressions > 0 ? data.viewable / data.impressions : 0;
    const averageViewDuration =
      data.viewDurations.length > 0
        ? data.viewDurations.reduce((a, b) => a + b, 0) / data.viewDurations.length
        : 0;

    return {
      totalImpressions: data.impressions,
      totalClicks: data.clicks,
      totalRevenue: estimateAdRevenue(data.impressions, ctr),
      ctr,
      fillRate,
      viewabilityRate,
      averageViewDuration,
    };
  }

  getAllMetrics(): Map<string, AdPerformanceMetrics> {
    const results = new Map<string, AdPerformanceMetrics>();
    this.metrics.forEach((_, slotId) => {
      const metrics = this.getMetrics(slotId);
      if (metrics) {
        results.set(slotId, metrics);
      }
    });
    return results;
  }

  logSummary() {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [AdSense] Performance Summary:');
      this.metrics.forEach((data, slotId) => {
        const metrics = this.getMetrics(slotId);
        if (metrics) {
          console.log(`\n  ${slotId}:`);
          console.log(`    Impressions: ${metrics.totalImpressions}`);
          console.log(`    Clicks: ${metrics.totalClicks}`);
          console.log(`    CTR: ${(metrics.ctr * 100).toFixed(2)}%`);
          console.log(`    Viewability: ${(metrics.viewabilityRate * 100).toFixed(2)}%`);
          console.log(`    Est. Revenue: $${metrics.totalRevenue.toFixed(2)}`);
        }
      });
    }
  }
}

// Global instance
export const adPerformanceTracker = new AdPerformanceTracker();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).adPerformanceTracker = adPerformanceTracker;
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params: Record<string, any>) => void;
  }
}
