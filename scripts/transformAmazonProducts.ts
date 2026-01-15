/**
 * Transform Amazon Products to Marketplace Product Format
 * Intelligent mapping and classification
 */

import type { Product, ProductCategory, BudgetTier, WeatherCondition, TripType } from '../src/types/marketplace';
import type { AmazonProduct } from './importAmazonProducts';

// Category keyword mapping
const CATEGORY_KEYWORDS: Record<ProductCategory, string[]> = {
  essentials: [
    'luggage', 'suitcase', 'backpack', 'travel bag', 'carry-on', 'duffel',
    'passport', 'wallet', 'money belt', 'travel essential', 'packing'
  ],
  electronics: [
    'charger', 'adapter', 'camera', 'headphones', 'cable', 'power bank',
    'phone', 'tablet', 'laptop', 'electronic', 'usb', 'battery'
  ],
  toiletries: [
    'shampoo', 'soap', 'lotion', 'sunscreen', 'deodorant', 'toothbrush',
    'toothpaste', 'shave', 'shower', 'body wash', 'skincare', 'facial',
    'cleansing', 'moisturizer', 'toner', 'spray bottle', 'mister'
  ],
  safety: [
    'lock', 'first aid', 'alarm', 'money belt', 'security', 'safe',
    'emergency', 'medical', 'medicine', 'motion sickness', 'dramamine'
  ],
  clothing: [
    'shirt', 'pants', 'socks', 'jacket', 'dress', 'shoes', 'hat',
    'gloves', 'scarf', 'underwear', 'clothing', 'apparel', 'wear'
  ],
  comfort: [
    'pillow', 'blanket', 'eye mask', 'compression', 'neck pillow',
    'sleep', 'comfort', 'cushion', 'rest', 'relaxation'
  ],
  organization: [
    'packing cube', 'organizer', 'pouch', 'bag', 'container', 'case',
    'storage', 'drawstring', 'shoe bag', 'toiletry bag', 'compartment'
  ],
  weather: [
    'rain', 'umbrella', 'waterproof', 'winter', 'thermal', 'coat',
    'weather', 'windproof', 'snow', 'cold weather', 'heat'
  ],
  activity: [
    'hiking', 'beach', 'swimming', 'trekking', 'outdoor', 'sports',
    'gym', 'fitness', 'exercise', 'camping', 'adventure'
  ],
};

// Weather condition keywords
const WEATHER_KEYWORDS: Record<WeatherCondition, string[]> = {
  tropical: ['sun', 'beach', 'spf', 'sunscreen', 'tropical', 'hot', 'summer', 'heat'],
  cold: ['winter', 'thermal', 'warm', 'insulated', 'cold', 'snow', 'ice'],
  rainy: ['waterproof', 'rain', 'umbrella', 'water resistant', 'wet'],
  desert: ['dry', 'desert', 'arid', 'dust'],
  temperate: ['spring', 'fall', 'autumn', 'mild', 'temperate'],
};

// Trip type keywords
const TRIP_TYPE_KEYWORDS: Record<TripType, string[]> = {
  business: ['business', 'professional', 'work', 'office', 'corporate'],
  family: ['family', 'kids', 'children', 'baby', 'infant', 'toddler'],
  luxury: ['luxury', 'premium', 'deluxe', 'high-end', 'exclusive'],
  budget: ['budget', 'affordable', 'cheap', 'economical', 'value'],
  adventure: ['adventure', 'outdoor', 'hiking', 'camping', 'extreme'],
  couple: ['couple', 'romantic', 'honeymoon', 'two'],
  solo: ['solo', 'single', 'individual', 'one person'],
};

// Activity keywords
const ACTIVITY_KEYWORDS: Record<string, string[]> = {
  hiking: ['hiking', 'trekking', 'trail', 'mountain', 'backpacking'],
  beach: ['beach', 'swimming', 'surf', 'ocean', 'seaside'],
  camping: ['camping', 'tent', 'outdoor', 'wilderness'],
  sightseeing: ['sightseeing', 'tourist', 'city', 'urban', 'explore'],
  skiing: ['skiing', 'snowboard', 'winter sports', 'slope'],
  flight: ['flight', 'airplane', 'air travel', 'plane', 'flying'],
};

/**
 * Classify product category based on title, description, and Amazon categories
 */
function classifyCategory(product: AmazonProduct): ProductCategory {
  const text = `${product.title} ${product.description} ${product.categories}`.toLowerCase();

  // Count matches for each category
  const scores: Partial<Record<ProductCategory, number>> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchCount = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (matchCount > 0) {
      scores[category as ProductCategory] = matchCount;
    }
  }

  // Return category with highest score
  if (Object.keys(scores).length > 0) {
    const topCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    return topCategory as ProductCategory;
  }

  // Default fallback based on Amazon categories
  const amazonCat = product.categories?.toLowerCase() || '';
  if (amazonCat.includes('beauty') || amazonCat.includes('personal care')) return 'toiletries';
  if (amazonCat.includes('clothing') || amazonCat.includes('shoes')) return 'clothing';
  if (amazonCat.includes('luggage') || amazonCat.includes('travel')) return 'essentials';
  if (amazonCat.includes('electronic')) return 'electronics';

  // Final fallback
  return 'essentials';
}

/**
 * Classify budget tier based on price
 */
function classifyBudgetTier(price: number): BudgetTier {
  if (price < 15) return 'budget';
  if (price < 40) return 'mid-range';
  return 'premium';
}

/**
 * Extract tags from product title and description
 */
function extractTags(product: AmazonProduct, category: ProductCategory): string[] {
  const tags = new Set<string>();
  const text = `${product.title} ${product.description}`.toLowerCase();

  // Add category as tag
  tags.add(category);

  // Travel-specific keywords
  const travelKeywords = [
    'travel', 'portable', 'compact', 'lightweight', 'tsa-approved',
    'waterproof', 'packable', 'reusable', 'refillable', 'eco-friendly',
    'durable', 'versatile', 'multi-use', 'ergonomic'
  ];

  travelKeywords.forEach(kw => {
    if (text.includes(kw)) tags.add(kw);
  });

  // Limit to 10 most relevant tags
  return Array.from(tags).slice(0, 10);
}

/**
 * Infer weather conditions from product details
 */
function inferWeatherConditions(product: AmazonProduct): WeatherCondition[] | undefined {
  const text = `${product.title} ${product.description}`.toLowerCase();
  const conditions: WeatherCondition[] = [];

  for (const [condition, keywords] of Object.entries(WEATHER_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      conditions.push(condition as WeatherCondition);
    }
  }

  return conditions.length > 0 ? conditions : undefined;
}

/**
 * Infer trip types from product details
 */
function inferTripTypes(product: AmazonProduct): TripType[] | undefined {
  const text = `${product.title} ${product.description}`.toLowerCase();
  const types: TripType[] = [];

  for (const [type, keywords] of Object.entries(TRIP_TYPE_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      types.push(type as TripType);
    }
  }

  return types.length > 0 ? types : undefined;
}

/**
 * Infer activities from product details
 */
function inferActivities(product: AmazonProduct): string[] | undefined {
  const text = `${product.title} ${product.description}`.toLowerCase();
  const activities: string[] = [];

  for (const [activity, keywords] of Object.entries(ACTIVITY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      activities.push(activity);
    }
  }

  return activities.length > 0 ? activities : undefined;
}

/**
 * Generate short description from full description or title
 */
function generateShortDescription(product: AmazonProduct, category: ProductCategory): string {
  // Try to extract first sentence from description
  if (product.description) {
    const sentences = product.description.split(/[.!?]/);
    if (sentences.length > 0 && sentences[0].length < 200) {
      const firstSentence = sentences[0].trim();
      if (firstSentence.length > 20) {
        return firstSentence + '.';
      }
    }
  }

  // Fallback: Generate from category and product name
  const categoryNames: Record<ProductCategory, string> = {
    essentials: 'essential travel gear',
    electronics: 'travel electronics',
    toiletries: 'travel toiletries',
    safety: 'travel safety',
    clothing: 'travel clothing',
    comfort: 'travel comfort',
    organization: 'travel organization',
    weather: 'weather protection',
    activity: 'activity gear',
  };

  const categoryName = categoryNames[category];
  return `Perfect ${categoryName} for your next trip.`;
}

/**
 * Parse price from string
 */
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove currency symbols and parse
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

/**
 * Parse rating from string
 */
function parseRating(ratingStr: string): number | undefined {
  if (!ratingStr) return undefined;
  const rating = parseFloat(ratingStr);
  return isNaN(rating) ? undefined : rating;
}

/**
 * Parse review count from string
 */
function parseReviewCount(reviewStr: string): number | undefined {
  if (!reviewStr) return undefined;
  const count = parseInt(reviewStr.replace(/[^0-9]/g, ''));
  return isNaN(count) ? undefined : count;
}

/**
 * Map Amazon product to Marketplace Product
 */
export function mapAmazonToProduct(amazon: AmazonProduct): Product {
  const category = classifyCategory(amazon);
  const price = parsePrice(amazon.final_price || amazon.initial_price);
  const budgetTier = classifyBudgetTier(price);

  return {
    id: amazon.asin,
    name: amazon.title || 'Untitled Product',
    description: amazon.description || amazon.title || 'No description available',
    shortDescription: generateShortDescription(amazon, category),
    image: amazon.image_url || '',
    price,
    affiliateUrl: amazon.url || '',
    category,
    tags: extractTags(amazon, category),
    budgetTier,
    rating: parseRating(amazon.rating),
    reviewCount: parseReviewCount(amazon.reviews_count),
    weatherConditions: inferWeatherConditions(amazon),
    tripTypes: inferTripTypes(amazon),
    activities: inferActivities(amazon),
  };
}

/**
 * Transform all Amazon products to Marketplace products
 */
export function transformProducts(amazonProducts: AmazonProduct[]): Product[] {
  console.log('🔄 Transforming Amazon products to Marketplace format...');

  const products = amazonProducts.map(mapAmazonToProduct);

  console.log(`✅ Transformed ${products.length} products`);

  return products;
}
