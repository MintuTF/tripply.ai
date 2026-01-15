import type { AdUnitConfig } from './types';

/**
 * Google AdSense Ad Unit Configurations
 *
 * Centralized configuration for all ad placements across the app.
 * Update slot IDs after creating ad units in Google AdSense dashboard.
 */

// Ad Slot IDs - Your actual AdSense slot IDs
export const AD_SLOTS = {
  // Homepage
  HOMEPAGE_FOOTER_LEADERBOARD: '6334963078', // 970x90
  HOMEPAGE_SECTION_DIVIDER: '8895863025', // 728x90

  // Discover Page
  DISCOVER_GRID_NATIVE: '8633823354', // 300x250
  DISCOVER_SECTION_DIVIDER: '7471950771', // 728x90

  // Research Page
  RESEARCH_SIDEBAR_HALFPAGE: '1345526121', // 300x600
  RESEARCH_GRID_NATIVE: '1345526121', // 300x250 (reusing same slot)

  // City Explore Pages
  CITY_EXPLORE_GRID_NATIVE: '5387862857', // 300x250
  CITY_EXPLORE_SIDEBAR: '1097264051', // 300x600

  // Video Content
  VIDEO_CONTENT_PRE: '7471100712', // 728x90
  VIDEO_CONTENT_POST: '1809572310', // 300x250

  // Trending Carousel
  TRENDING_CAROUSEL_NATIVE: '3122653988', // 300x250

  // Modal/Drawer
  MODAL_HEADER_LEADERBOARD: '6158019046', // 728x90

  // Plan Page
  PLAN_SIDEBAR: '6406281114', // 300x250
} as const;

// Ad Unit Configurations with optimal settings
export const AD_UNIT_CONFIGS: Record<string, AdUnitConfig> = {
  // Homepage Ads
  HOMEPAGE_FOOTER_LEADERBOARD: {
    slot: AD_SLOTS.HOMEPAGE_FOOTER_LEADERBOARD,
    format: 'horizontal',
    dimensions: { width: 970, height: 90 },
    layout: 'display',
    priority: 'high', // Above fold on desktop
  },
  HOMEPAGE_SECTION_DIVIDER: {
    slot: AD_SLOTS.HOMEPAGE_SECTION_DIVIDER,
    format: 'horizontal',
    dimensions: { width: 728, height: 90 },
    layout: 'display',
    priority: 'normal',
  },

  // Discover Page Ads
  DISCOVER_GRID_NATIVE: {
    slot: AD_SLOTS.DISCOVER_GRID_NATIVE,
    format: 'rectangle',
    dimensions: { width: 300, height: 250 },
    layout: 'in-feed',
    priority: 'normal',
  },
  DISCOVER_SECTION_DIVIDER: {
    slot: AD_SLOTS.DISCOVER_SECTION_DIVIDER,
    format: 'horizontal',
    dimensions: { width: 728, height: 90 },
    layout: 'display',
    priority: 'low',
  },

  // Research Page Ads
  RESEARCH_SIDEBAR_HALFPAGE: {
    slot: AD_SLOTS.RESEARCH_SIDEBAR_HALFPAGE,
    format: 'vertical',
    dimensions: { width: 300, height: 600 },
    layout: 'display',
    priority: 'high', // High engagement area
  },
  RESEARCH_GRID_NATIVE: {
    slot: AD_SLOTS.RESEARCH_GRID_NATIVE,
    format: 'rectangle',
    dimensions: { width: 300, height: 250 },
    layout: 'in-feed',
    priority: 'normal',
  },

  // City Explore Ads
  CITY_EXPLORE_GRID_NATIVE: {
    slot: AD_SLOTS.CITY_EXPLORE_GRID_NATIVE,
    format: 'rectangle',
    dimensions: { width: 300, height: 250 },
    layout: 'in-feed',
    priority: 'normal',
  },
  CITY_EXPLORE_SIDEBAR: {
    slot: AD_SLOTS.CITY_EXPLORE_SIDEBAR,
    format: 'vertical',
    dimensions: { width: 300, height: 600 },
    layout: 'display',
    priority: 'normal',
  },

  // Video Content Ads
  VIDEO_CONTENT_PRE: {
    slot: AD_SLOTS.VIDEO_CONTENT_PRE,
    format: 'horizontal',
    dimensions: { width: 728, height: 90 },
    layout: 'display',
    priority: 'high',
  },
  VIDEO_CONTENT_POST: {
    slot: AD_SLOTS.VIDEO_CONTENT_POST,
    format: 'rectangle',
    dimensions: { width: 300, height: 250 },
    layout: 'display',
    priority: 'low',
  },

  // Trending Carousel Ads
  TRENDING_CAROUSEL_NATIVE: {
    slot: AD_SLOTS.TRENDING_CAROUSEL_NATIVE,
    format: 'rectangle',
    dimensions: { width: 300, height: 250 },
    layout: 'in-feed',
    priority: 'normal',
  },

  // Modal/Drawer Ads
  MODAL_HEADER_LEADERBOARD: {
    slot: AD_SLOTS.MODAL_HEADER_LEADERBOARD,
    format: 'horizontal',
    dimensions: { width: 728, height: 90 },
    layout: 'display',
    priority: 'normal',
  },

  // Plan Page Ads
  PLAN_SIDEBAR: {
    slot: AD_SLOTS.PLAN_SIDEBAR,
    format: 'rectangle',
    dimensions: { width: 300, height: 250 },
    layout: 'display',
    priority: 'low',
  },
};

// Helper to get ad config by slot name
export function getAdConfig(slotName: keyof typeof AD_SLOTS): AdUnitConfig | undefined {
  return AD_UNIT_CONFIGS[slotName];
}

// Validate that AdSense is enabled
export function isAdSenseEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true' &&
    !!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID &&
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID !== 'REPLACE_WITH_CLIENT_ID'
  );
}

// Get AdSense client ID
export function getAdSenseClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
}
