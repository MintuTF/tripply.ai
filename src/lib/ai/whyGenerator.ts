/**
 * Algorithmic WHY Generator
 *
 * Generates contextual WHY tags and bullets for place cards
 * when AI-generated WHY is not available (fallback system).
 *
 * Uses place attributes + user context to create relevant reasoning.
 */

import { PlaceCard } from '@/types';

export interface UserContext {
  interests?: string[];
  budget?: 'budget' | 'moderate' | 'luxury';
  travelStyle?: 'relaxed' | 'moderate' | 'active';
  travelerType?: 'solo' | 'couple' | 'family' | 'friends';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface WhyOutput {
  tags: string[];
  bullets: string[];
}

/**
 * Generate WHY tags based on place attributes
 */
function generateTags(place: PlaceCard, context: UserContext): string[] {
  const tags: string[] = [];

  // Rating-based tags
  if (place.rating && place.rating >= 4.5) {
    tags.push('Highly rated');
  } else if (place.rating && place.rating >= 4.0) {
    tags.push('Well reviewed');
  }

  // Price-based tags
  if (place.price_level !== undefined) {
    if (place.price_level <= 1) {
      tags.push('Budget-friendly');
    } else if (place.price_level >= 3) {
      tags.push('Special occasion');
    }
  }

  // Type-based tags
  switch (place.type) {
    case 'restaurant':
      if (place.cuisine_type) {
        tags.push(place.cuisine_type);
      }
      break;
    case 'hotel':
      if (place.amenities?.includes('spa')) {
        tags.push('Spa');
      }
      if (place.amenities?.includes('pool')) {
        tags.push('Pool');
      }
      break;
    case 'activity':
      if (place.duration) {
        const hours = parseInt(place.duration);
        if (hours <= 2) {
          tags.push('Quick visit');
        } else if (hours >= 4) {
          tags.push('Half-day');
        }
      }
      break;
  }

  // Context-based tags
  if (context.travelerType === 'couple') {
    // Check for romantic indicators
    if (
      place.description?.toLowerCase().includes('romantic') ||
      place.description?.toLowerCase().includes('intimate') ||
      place.description?.toLowerCase().includes('couples')
    ) {
      tags.push('Romantic');
    }
  }

  if (context.travelerType === 'family') {
    if (
      place.description?.toLowerCase().includes('family') ||
      place.description?.toLowerCase().includes('kids') ||
      place.description?.toLowerCase().includes('children')
    ) {
      tags.push('Family-friendly');
    }
  }

  // Location-based tags
  if (place.address?.toLowerCase().includes('downtown') || place.address?.toLowerCase().includes('central')) {
    tags.push('Central location');
  }

  // Limit to 3 tags
  return tags.slice(0, 3);
}

/**
 * Generate WHY bullets based on place attributes and context
 */
function generateBullets(place: PlaceCard, context: UserContext): string[] {
  const bullets: string[] = [];

  // Rating bullet
  if (place.rating && place.review_count) {
    if (place.rating >= 4.5) {
      bullets.push(`Highly rated (${place.rating}) with ${place.review_count}+ reviews`);
    } else if (place.rating >= 4.0) {
      bullets.push(`${place.rating} rating from ${place.review_count} reviews`);
    }
  }

  // Price alignment
  if (context.budget && place.price_level !== undefined) {
    const budgetMap = { budget: 1, moderate: 2, luxury: 3 };
    const userLevel = budgetMap[context.budget];

    if (place.price_level <= userLevel) {
      bullets.push('Fits your budget');
    } else if (place.price_level === userLevel + 1) {
      bullets.push('Slight splurge but worth it');
    }
  }

  // Interest alignment
  if (context.interests?.length) {
    const placeText = `${place.description || ''} ${place.type}`.toLowerCase();
    for (const interest of context.interests) {
      if (placeText.includes(interest.toLowerCase())) {
        bullets.push(`Matches your interest in ${interest}`);
        break;
      }
    }
  }

  // Time-based suggestions
  if (context.timeOfDay) {
    const timeBasedBullets: Record<string, string[]> = {
      morning: ['Great for starting your day', 'Best visited before crowds'],
      afternoon: ['Perfect for a leisurely afternoon', 'Good midday stop'],
      evening: ['Ideal for evening ambiance', 'Beautiful at sunset'],
      night: ['Great nightlife atmosphere', 'Perfect for late night'],
    };

    const timeBullets = timeBasedBullets[context.timeOfDay];
    if (timeBullets && Math.random() > 0.5) {
      bullets.push(timeBullets[Math.floor(Math.random() * timeBullets.length)]);
    }
  }

  // Type-specific bullets
  switch (place.type) {
    case 'restaurant':
      if (place.cuisine_type) {
        bullets.push(`Known for ${place.cuisine_type} cuisine`);
      }
      if (place.opening_hours) {
        bullets.push('Open during your travel times');
      }
      break;

    case 'hotel':
      if (place.amenities?.length) {
        const topAmenities = place.amenities.slice(0, 2).join(' & ');
        bullets.push(`Features ${topAmenities}`);
      }
      break;

    case 'activity':
      if (place.duration) {
        bullets.push(`Takes about ${place.duration}`);
      }
      break;

    case 'location':
      bullets.push('Popular attraction in the area');
      break;
  }

  // Traveler type specific
  if (context.travelerType === 'couple' && !bullets.some(b => b.includes('romantic'))) {
    if (place.type === 'restaurant') {
      bullets.push('Nice atmosphere for couples');
    }
  }

  if (context.travelerType === 'family') {
    if (place.type === 'activity') {
      bullets.push('Enjoyable for all ages');
    }
  }

  // Limit to 3 bullets
  return bullets.slice(0, 3);
}

/**
 * Main function: Generate fallback WHY for a place
 */
export function generateFallbackWhy(
  place: PlaceCard,
  context: UserContext = {}
): WhyOutput {
  return {
    tags: generateTags(place, context),
    bullets: generateBullets(place, context),
  };
}

/**
 * Generate WHY for multiple places with consistent logic
 */
export function generateWhyForPlaces(
  places: PlaceCard[],
  context: UserContext = {}
): Map<string, WhyOutput> {
  const results = new Map<string, WhyOutput>();

  for (const place of places) {
    results.set(place.id, generateFallbackWhy(place, context));
  }

  return results;
}

/**
 * Merge AI-generated WHY with fallback
 * AI takes priority, fallback fills gaps
 */
export function mergeWhyWithFallback(
  aiWhy: Partial<WhyOutput> | null,
  place: PlaceCard,
  context: UserContext = {}
): WhyOutput {
  const fallback = generateFallbackWhy(place, context);

  if (!aiWhy) {
    return fallback;
  }

  return {
    tags: aiWhy.tags?.length ? aiWhy.tags : fallback.tags,
    bullets: aiWhy.bullets?.length ? aiWhy.bullets : fallback.bullets,
  };
}

/**
 * Extract WHY from AI response text for a specific place
 */
export function extractWhyFromText(
  text: string,
  placeName: string
): Partial<WhyOutput> | null {
  const result: Partial<WhyOutput> = {};

  // Look for WHY tags pattern: (WHY: tag1, tag2, tag3)
  const tagPattern = new RegExp(
    `${escapeRegex(placeName)}[^)]*\\(WHY:\\s*([^)]+)\\)`,
    'i'
  );
  const tagMatch = text.match(tagPattern);

  if (tagMatch) {
    result.tags = tagMatch[1]
      .split(/[,·]/)
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  // Look for bullet points after the place name
  const bulletPattern = new RegExp(
    `${escapeRegex(placeName)}[\\s\\S]*?(?:^|\\n)\\s*[-•]\\s*([^\\n]+)(?:\\n\\s*[-•]\\s*([^\\n]+))?(?:\\n\\s*[-•]\\s*([^\\n]+))?`,
    'im'
  );
  const bulletMatch = text.match(bulletPattern);

  if (bulletMatch) {
    result.bullets = [bulletMatch[1], bulletMatch[2], bulletMatch[3]]
      .filter(Boolean)
      .map(b => b.trim())
      .slice(0, 3);
  }

  return result.tags || result.bullets ? result : null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
