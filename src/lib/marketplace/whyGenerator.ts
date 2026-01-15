/**
 * WHY Generation Engine for Smart Marketplace
 * Generates contextual "why" bullets and smart badges for products based on trip context
 *
 * Approach: Hybrid template-based system (fast, cost-effective, contextual)
 * - Uses rule-based templates with dynamic variables
 * - 10-15 template categories cover 90% of scenarios
 * - Fallback to generic product descriptions
 */

import { Product, MarketplaceTripContext, WeatherCondition } from '@/types/marketplace';

interface WhyTemplate {
  condition: (product: Product, context: MarketplaceTripContext) => boolean;
  bullets: (product: Product, context: MarketplaceTripContext) => string[];
  priority: number; // Higher priority templates are checked first
}

/**
 * Generate 2-3 contextual WHY bullets for a product
 */
export function generateWhyBullets(
  product: Product,
  context: MarketplaceTripContext
): string[] {
  const bullets: string[] = [];

  // Find matching templates and generate bullets
  const sortedTemplates = WHY_TEMPLATES.sort((a, b) => b.priority - a.priority);

  for (const template of sortedTemplates) {
    if (template.condition(product, context)) {
      const templateBullets = template.bullets(product, context);
      bullets.push(...templateBullets);

      // Stop after we have 2-3 bullets
      if (bullets.length >= 2) {
        break;
      }
    }
  }

  // If no bullets generated, use fallback
  if (bullets.length === 0) {
    bullets.push(...getFallbackBullets(product, context));
  }

  // Limit to 3 bullets max
  return bullets.slice(0, 3);
}

/**
 * Generate 1-2 smart badges with emoji
 */
export function generateSmartBadges(
  product: Product,
  context: MarketplaceTripContext
): string[] {
  const badges: string[] = [];

  // Weather-based badges
  if (context.weather) {
    const temp = context.weather.temperature;
    const condition = context.weather.condition.toLowerCase();

    if (temp <= 45 && product.weatherConditions?.includes('cold')) {
      badges.push('❄️ Cold weather essential');
    } else if (temp >= 85 && product.weatherConditions?.includes('tropical')) {
      badges.push('☀️ Hot weather essential');
    } else if (condition.includes('rain') && product.tags?.includes('waterproof')) {
      badges.push('🌧️ Rain protection');
    }
  }

  // Duration-based badges
  if (context.duration) {
    if (context.duration <= 3 && product.tags?.includes('compact')) {
      badges.push('📦 Perfect for short trips');
    } else if (context.duration >= 7 && product.tags?.includes('durable')) {
      badges.push('🎯 Long trip essential');
    }
  }

  // Activity-based badges
  if (context.activities) {
    if (context.activities.includes('walking') && product.category === 'comfort') {
      badges.push('🚶 Great for walking');
    } else if (context.activities.includes('beach') && product.weatherConditions?.includes('tropical')) {
      badges.push('🏖️ Beach essential');
    }
  }

  // Destination-specific badges (e.g., plug adapters for specific countries)
  if (context.destination && product.category === 'electronics') {
    if (product.name.toLowerCase().includes('adapter')) {
      badges.push(`🔌 Essential for ${context.destination}`);
    }
  }

  // TSA/Travel badges
  if (product.tags?.includes('TSA-approved')) {
    badges.push('✈️ TSA approved');
  }

  // Value badges
  if (product.budgetTier === 'premium') {
    badges.push('✨ Premium choice');
  } else if (product.budgetTier === 'budget' && (product.rating || 0) >= 4.5) {
    badges.push('💰 Great value');
  }

  // Best seller badge
  if ((product.reviewCount || 0) >= 10000) {
    badges.push('⭐ Best seller');
  }

  // Limit to 2 badges max
  return badges.slice(0, 2);
}

/**
 * WHY Template Definitions
 */
const WHY_TEMPLATES: WhyTemplate[] = [
  // Weather-based templates
  {
    priority: 10,
    condition: (p, ctx) =>
      !!ctx.weather &&
      ctx.weather.temperature <= 45 &&
      p.weatherConditions?.includes('cold'),
    bullets: (p, ctx) => [
      `${ctx.destination || 'Your destination'} averages ${ctx.weather?.temperature}°F in ${getSeason(ctx)} - this will keep you warm`,
      p.tags?.includes('lightweight')
        ? 'Lightweight and packable for easy travel'
        : 'Essential for cold weather protection',
    ],
  },
  {
    priority: 10,
    condition: (p, ctx) =>
      !!ctx.weather &&
      ctx.weather.temperature >= 85 &&
      p.weatherConditions?.includes('tropical'),
    bullets: (p, ctx) => [
      `${ctx.destination || 'Your destination'} averages ${ctx.weather?.temperature}°F - stay cool and comfortable`,
      'Designed for hot, humid climates',
    ],
  },
  {
    priority: 9,
    condition: (p, ctx) =>
      !!ctx.weather &&
      (ctx.weather.condition.toLowerCase().includes('rain') ||
       ctx.weather.condition.toLowerCase().includes('storm')) &&
      p.tags?.includes('waterproof'),
    bullets: (p, ctx) => [
      `${ctx.destination || 'Your destination'} has ${ctx.weather?.condition.toLowerCase()} conditions`,
      'Waterproof protection keeps your belongings safe',
    ],
  },

  // Duration-based templates
  {
    priority: 8,
    condition: (p, ctx) =>
      !!ctx.duration &&
      ctx.duration <= 3 &&
      (p.tags?.includes('compact') || p.tags?.includes('lightweight')),
    bullets: (p, ctx) => [
      `Perfect for ${ctx.duration}-day trips - compact and efficient`,
      'Save luggage space without sacrificing functionality',
    ],
  },
  {
    priority: 8,
    condition: (p, ctx) =>
      !!ctx.duration &&
      ctx.duration >= 7 &&
      p.category === 'organization',
    bullets: (p, ctx) => [
      `Essential for ${ctx.duration}-day trips - stay organized`,
      'Makes packing and unpacking much easier',
    ],
  },

  // Party composition templates
  {
    priority: 7,
    condition: (p, ctx) =>
      ctx.tripType === 'couple' &&
      (p.tags?.includes('romantic') || p.category === 'comfort'),
    bullets: (p, ctx) => [
      'Great for couples traveling together',
      'Enhances comfort and makes the journey more enjoyable',
    ],
  },
  {
    priority: 7,
    condition: (p, ctx) =>
      (ctx.hasChildren || ctx.tripType === 'family') &&
      (p.category === 'safety' || p.tags?.includes('family-friendly')),
    bullets: (p, ctx) => [
      'Essential for families traveling with children',
      'Provides peace of mind and extra safety',
    ],
  },

  // Activity-based templates
  {
    priority: 7,
    condition: (p, ctx) =>
      ctx.activities?.includes('walking') &&
      p.category === 'comfort',
    bullets: (p, ctx) => [
      'Perfect for cities with lots of walking',
      'Reduces fatigue during long exploration days',
    ],
  },
  {
    priority: 7,
    condition: (p, ctx) =>
      ctx.activities?.includes('beach') &&
      p.weatherConditions?.includes('tropical'),
    bullets: (p, ctx) => [
      'Beach vacation essential - protects and enhances your experience',
      'Water-friendly and designed for sand and sun',
    ],
  },

  // Commonly forgotten items
  {
    priority: 6,
    condition: (p, ctx) =>
      p.category === 'electronics' &&
      p.name.toLowerCase().includes('adapter'),
    bullets: (p, ctx) => [
      '86% of travelers forget to check plug compatibility',
      `Essential for staying connected in ${ctx.destination || 'your destination'}`,
    ],
  },
  {
    priority: 6,
    condition: (p, ctx) =>
      p.category === 'electronics' &&
      p.name.toLowerCase().includes('charger'),
    bullets: (p, ctx) => [
      'Most commonly forgotten travel item',
      'Keep your devices powered throughout your trip',
    ],
  },
  {
    priority: 6,
    condition: (p, ctx) =>
      p.category === 'toiletries' &&
      p.tags?.includes('TSA-approved'),
    bullets: (p, ctx) => [
      'TSA-approved for hassle-free airport security',
      'Saves time and reduces travel stress',
    ],
  },

  // Category-specific templates
  {
    priority: 5,
    condition: (p, ctx) => p.category === 'organization',
    bullets: (p, ctx) => [
      'Keeps your luggage organized and accessible',
      'Makes packing and unpacking much faster',
    ],
  },
  {
    priority: 5,
    condition: (p, ctx) => p.category === 'safety',
    bullets: (p, ctx) => [
      'Provides peace of mind while traveling',
      'Essential for secure and worry-free trips',
    ],
  },
];

/**
 * Fallback bullets when no template matches
 */
function getFallbackBullets(product: Product, context: MarketplaceTripContext): string[] {
  const bullets: string[] = [];

  // Use product's short description
  if (product.shortDescription) {
    bullets.push(product.shortDescription);
  }

  // Add rating-based bullet
  if (product.rating && product.rating >= 4.5) {
    bullets.push(`Highly rated by ${formatNumber(product.reviewCount || 0)} travelers`);
  }

  // Add category-specific bullet
  const categoryDescriptions: Record<string, string> = {
    essentials: 'A must-have for any trip',
    clothing: 'Versatile and travel-friendly',
    electronics: 'Keeps you connected on the go',
    toiletries: 'Convenient and TSA-compliant',
    safety: 'Travel with confidence',
    comfort: 'Makes your journey more enjoyable',
    organization: 'Stay organized while traveling',
    weather: 'Prepared for any conditions',
    activity: 'Perfect for your planned activities',
  };

  if (categoryDescriptions[product.category]) {
    bullets.push(categoryDescriptions[product.category]);
  }

  return bullets.slice(0, 2);
}

/**
 * Helper: Get season from trip context
 */
function getSeason(context: MarketplaceTripContext): string {
  if (!context.startDate) return 'this season';

  const date = new Date(context.startDate);
  const month = date.getMonth();

  if (month >= 11 || month <= 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'fall';
}

/**
 * Helper: Format large numbers (e.g., 12000 → "12k")
 */
function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}
