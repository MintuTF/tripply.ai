import { Intent, Layout } from '@/types';

/**
 * Layout Registry - Maps intents to their corresponding layouts and components
 * Based on the 7 travel patterns defined in the product spec
 */

export const LAYOUTS: Record<Intent, Layout> = {
  overview: {
    id: 'overview',
    regions: {
      chat: true,
      canvas: true,
      map: true,
      compare: false,
    },
    components: [
      'SummaryBanner',
      'FactsGrid',
      'AreasMap',
      'TopPicksCarousel',
      'PracticalTips',
    ],
  },

  stays: {
    id: 'stays',
    regions: {
      chat: true,
      canvas: true,
      map: true,
      compare: true,
    },
    components: [
      'FiltersBar',
      'HotelCardsGrid',
      'MapPanel',
      'CompareDrawer',
    ],
  },

  itinerary: {
    id: 'itinerary',
    regions: {
      chat: true,
      canvas: true,
      map: true,
      compare: false,
    },
    components: [
      'TimelineColumns',
      'MapPanel',
      'ActionBar',
    ],
  },

  nearby: {
    id: 'nearby',
    regions: {
      chat: true,
      canvas: true,
      map: true,
      compare: false,
    },
    components: [
      'MapFirst',
      'RadiusSlider',
      'ResultList',
      'FiltersBar',
    ],
  },

  transport: {
    id: 'transport',
    regions: {
      chat: true,
      canvas: true,
      map: false,
      compare: false,
    },
    components: [
      'FareTrendChart',
      'RouteCards',
      'TransferTips',
    ],
  },

  briefing: {
    id: 'briefing',
    regions: {
      chat: true,
      canvas: true,
      map: false,
      compare: false,
    },
    components: [
      'WeatherStrip',
      'PackingChips',
      'EventsList',
      'AdvisoryCard',
    ],
  },

  general: {
    id: 'general',
    regions: {
      chat: true,
      canvas: true,
      map: false,
      compare: false,
    },
    components: [
      'AnswerBlocks',
      'SuggestedLayouts',
    ],
  },
};

/**
 * Get layout configuration by intent
 */
export function getLayout(intent: Intent, confidence: number = 1.0): Layout {
  // If confidence is low, fall back to general layout
  if (confidence < 0.6) {
    return LAYOUTS.general;
  }

  return LAYOUTS[intent] || LAYOUTS.general;
}

/**
 * Detect intent from user message
 * This is a simplified version - in production, this would use an LLM
 */
export function detectIntent(message: string): { intent: Intent; confidence: number } {
  const messageLower = message.toLowerCase();

  // Overview patterns
  if (messageLower.match(/\b(is|worth|visit|overview|about|best time|when to)\b/)) {
    return { intent: 'overview', confidence: 0.8 };
  }

  // Stays patterns
  if (messageLower.match(/\b(hotel|stay|accommodation|airbnb|hostel|compare.*hotel)\b/)) {
    return { intent: 'stays', confidence: 0.85 };
  }

  // Itinerary patterns
  if (messageLower.match(/\b(plan|itinerary|day|schedule|route|days?)\b/)) {
    return { intent: 'itinerary', confidence: 0.8 };
  }

  // Nearby patterns
  if (messageLower.match(/\b(near|nearby|close to|around|within)\b/)) {
    return { intent: 'nearby', confidence: 0.75 };
  }

  // Transport patterns
  if (messageLower.match(/\b(flight|train|transport|bus|ferry|travel to|get to)\b/)) {
    return { intent: 'transport', confidence: 0.8 };
  }

  // Briefing patterns
  if (messageLower.match(/\b(weather|pack|event|festival|safety|advisory)\b/)) {
    return { intent: 'briefing', confidence: 0.75 };
  }

  // Default to general
  return { intent: 'general', confidence: 0.5 };
}
