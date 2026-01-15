/**
 * Google AdSense TypeScript type definitions
 */

export type AdFormat = 'auto' | 'rectangle' | 'vertical' | 'horizontal';
export type AdLayout = 'display' | 'in-article' | 'in-feed';
export type AdPriority = 'high' | 'normal' | 'low';

export interface AdSlotProps {
  slot: string;
  format?: AdFormat;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  layout?: AdLayout;
  priority?: AdPriority;
}

export interface AdUnitConfig {
  slot: string;
  format: AdFormat;
  dimensions?: { width: number; height: number };
  layout: AdLayout;
  priority: AdPriority;
}

export interface AdSenseContextValue {
  isAdBlockerActive: boolean;
  isScriptLoaded: boolean;
  adUnits: Map<string, AdUnitConfig>;
  registerAdUnit: (id: string, config: AdUnitConfig) => void;
  refreshAds: () => void;
}

// Extend Window interface for AdSense
declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}
