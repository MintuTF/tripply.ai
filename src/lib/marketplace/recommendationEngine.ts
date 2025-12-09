/**
 * AI Recommendation Engine for Travel Marketplace
 * Generates personalized product recommendations based on trip context
 */

import {
  Product,
  ProductRecommendation,
  MarketplaceTripContext,
  MarketplaceFilters,
  CategoryKit,
  WeatherCondition,
} from '@/types/marketplace';
import {
  getAllProducts,
  getProductsByCategory,
  getProductsForWeather,
  getProductsForActivity,
  getProductsForDestination,
  searchProducts,
} from './products';
import { CATEGORIES } from './categories';
import { generateAffiliateUrl } from './affiliateUtils';

/**
 * Determine weather condition from temperature and description
 */
function determineWeatherCondition(
  temperature?: number,
  condition?: string
): WeatherCondition | null {
  if (!temperature && !condition) return null;

  const lowerCondition = (condition || '').toLowerCase();

  // Check condition first
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return 'rainy';
  }
  if (lowerCondition.includes('snow') || lowerCondition.includes('blizzard')) {
    return 'cold';
  }

  // Then check temperature
  if (temperature !== undefined) {
    if (temperature >= 85) return 'tropical';
    if (temperature >= 75) return 'desert';
    if (temperature <= 45) return 'cold';
    if (temperature <= 60) return 'temperate';
  }

  return 'temperate';
}

/**
 * Calculate relevance score for a product based on trip context
 */
function calculateRelevanceScore(product: Product, context: MarketplaceTripContext): number {
  let score = 50; // Base score

  // Weather matching (+20 points)
  const weatherCondition = determineWeatherCondition(
    context.weather?.temperature,
    context.weather?.condition
  );
  if (weatherCondition && product.weatherConditions?.includes(weatherCondition)) {
    score += 20;
  }

  // Destination matching (+15 points)
  if (context.destination && product.destinations) {
    const destLower = context.destination.toLowerCase();
    if (product.destinations.some((d) => destLower.includes(d.toLowerCase()))) {
      score += 15;
    }
  }

  // Activity matching (+15 points each, max 30)
  if (context.activities && product.activities) {
    const matchingActivities = context.activities.filter((a) =>
      product.activities?.some((pa) => pa.toLowerCase() === a.toLowerCase())
    );
    score += Math.min(matchingActivities.length * 15, 30);
  }

  // Trip type matching (+10 points)
  if (context.tripType && product.tripTypes?.includes(context.tripType)) {
    score += 10;
  }

  // Family with children bonus for safety/comfort items
  if (context.hasChildren || context.hasInfants) {
    if (['safety', 'comfort', 'toiletries'].includes(product.category)) {
      score += 10;
    }
  }

  // Long trip bonus for organization items
  if (context.duration && context.duration > 7) {
    if (['organization', 'toiletries', 'clothing'].includes(product.category)) {
      score += 5;
    }
  }

  return Math.min(score, 100);
}

/**
 * Generate a reason why a product is recommended for this trip
 */
function generateReason(product: Product, context: MarketplaceTripContext): string {
  const reasons: string[] = [];

  // Weather-based reason
  const weatherCondition = determineWeatherCondition(
    context.weather?.temperature,
    context.weather?.condition
  );
  if (weatherCondition && product.weatherConditions?.includes(weatherCondition)) {
    const temp = context.weather?.temperature;
    switch (weatherCondition) {
      case 'rainy':
        reasons.push(
          `${context.destination || 'Your destination'} expects rain - stay dry and comfortable.`
        );
        break;
      case 'cold':
        reasons.push(
          `With temperatures around ${temp}°F, you'll need to stay warm.`
        );
        break;
      case 'tropical':
        reasons.push(
          `Hot weather at ${temp}°F means you need sun and heat protection.`
        );
        break;
      case 'desert':
        reasons.push(
          `The desert climate requires proper sun protection and hydration.`
        );
        break;
      default:
        break;
    }
  }

  // Activity-based reason
  if (context.activities && product.activities) {
    const matchingActivity = context.activities.find((a) =>
      product.activities?.some((pa) => pa.toLowerCase() === a.toLowerCase())
    );
    if (matchingActivity) {
      reasons.push(`Essential gear for your ${matchingActivity} activities.`);
    }
  }

  // Destination-based reason
  if (context.destination && product.destinations) {
    const destLower = context.destination.toLowerCase();
    if (product.destinations.some((d) => destLower.includes(d.toLowerCase()))) {
      reasons.push(`Specifically recommended for travelers to ${context.destination}.`);
    }
  }

  // Trip duration reason
  if (context.duration && context.duration > 7 && product.category === 'organization') {
    reasons.push(
      `For a ${context.duration}-day trip, good organization is key.`
    );
  }

  // Family reason
  if ((context.hasChildren || context.hasInfants) && product.category === 'safety') {
    reasons.push('Extra safety measures are important when traveling with family.');
  }

  // Default to product's short description if no specific reason
  if (reasons.length === 0) {
    return product.shortDescription;
  }

  return reasons[0];
}

/**
 * Create smart kits based on trip context
 */
function createSmartKits(
  context: MarketplaceTripContext,
  products: Product[]
): CategoryKit[] {
  const kits: CategoryKit[] = [];

  // Weather-based kit
  const weatherCondition = determineWeatherCondition(
    context.weather?.temperature,
    context.weather?.condition
  );
  if (weatherCondition) {
    const weatherProducts = products.filter(
      (p) => p.weatherConditions?.includes(weatherCondition)
    );
    if (weatherProducts.length > 0) {
      const kitName =
        weatherCondition === 'rainy'
          ? `${context.destination || 'Rainy Weather'} Rain Essentials`
          : weatherCondition === 'cold'
          ? `${context.destination || 'Cold Weather'} Winter Kit`
          : weatherCondition === 'tropical'
          ? `${context.destination || 'Tropical'} Sun & Heat Kit`
          : `${context.destination || 'Travel'} Weather Kit`;

      kits.push({
        id: 'weather-kit',
        name: kitName,
        description: `Essential items for ${weatherCondition} weather conditions`,
        icon: weatherCondition === 'rainy' ? 'CloudRain' : weatherCondition === 'cold' ? 'Snowflake' : 'Sun',
        products: weatherProducts.slice(0, 6).map((p) => p.id),
        isAIGenerated: true,
      });
    }
  }

  // Activity-based kit
  if (context.activities && context.activities.length > 0) {
    const activityProducts = products.filter((p) =>
      p.activities?.some((a) =>
        context.activities?.some((ca) => ca.toLowerCase() === a.toLowerCase())
      )
    );
    if (activityProducts.length > 0) {
      const mainActivity = context.activities[0];
      kits.push({
        id: 'activity-kit',
        name: `${mainActivity.charAt(0).toUpperCase() + mainActivity.slice(1)} Gear`,
        description: `Gear for your ${context.activities.join(', ')} activities`,
        icon: 'Activity',
        products: activityProducts.slice(0, 6).map((p) => p.id),
        isAIGenerated: true,
      });
    }
  }

  // Flight comfort kit (if duration implies flying)
  if (context.duration && context.duration >= 3) {
    const flightProducts = products.filter(
      (p) => p.activities?.includes('flight') || p.category === 'comfort'
    );
    if (flightProducts.length > 0) {
      kits.push({
        id: 'flight-kit',
        name: 'Flight Comfort Kit',
        description: 'Make your flight more comfortable',
        icon: 'Plane',
        products: flightProducts.slice(0, 5).map((p) => p.id),
        isAIGenerated: true,
      });
    }
  }

  return kits;
}

/**
 * Get personalized recommendations based on trip context
 */
export async function getRecommendations(
  context: MarketplaceTripContext | null,
  filters: MarketplaceFilters
): Promise<{
  personalized: ProductRecommendation[];
  kits: CategoryKit[];
  general: Product[];
}> {
  let allProducts = getAllProducts();

  // Apply filters
  if (filters.budgetTier) {
    allProducts = allProducts.filter((p) => p.budgetTier === filters.budgetTier);
  }
  if (filters.categories && filters.categories.length > 0) {
    allProducts = allProducts.filter((p) => filters.categories?.includes(p.category));
  }
  if (filters.searchQuery) {
    allProducts = searchProducts(filters.searchQuery);
  }

  // If no trip context, return general recommendations
  if (!context || !context.destination) {
    // Group by category for browsing
    const general = allProducts.slice(0, 20);
    return {
      personalized: [],
      kits: [],
      general,
    };
  }

  // Calculate relevance scores
  const scoredProducts: ProductRecommendation[] = allProducts.map((product) => ({
    ...product,
    affiliateUrl: generateAffiliateUrl(product.affiliateUrl),
    relevanceScore: calculateRelevanceScore(product, context),
    reason: generateReason(product, context),
  }));

  // Sort by relevance and filter high-scoring items
  const personalized = scoredProducts
    .filter((p) => p.relevanceScore >= 60)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 12);

  // Create smart kits
  const kits = createSmartKits(context, allProducts);

  // General recommendations (lower scoring but still useful)
  const general = scoredProducts
    .filter((p) => p.relevanceScore < 60 && p.relevanceScore >= 40)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 12);

  return {
    personalized,
    kits,
    general,
  };
}

/**
 * Get products grouped by category
 */
export function getProductsByCategories(): Record<string, Product[]> {
  const result: Record<string, Product[]> = {};

  for (const category of CATEGORIES) {
    const products = getProductsByCategory(category.id);
    if (products.length > 0) {
      result[category.id] = products;
    }
  }

  return result;
}

/**
 * Get essential products (universally recommended)
 */
export function getEssentialProducts(): Product[] {
  const essentials = getAllProducts().filter(
    (p) =>
      p.category === 'essentials' ||
      p.tags.includes('essential') ||
      (p.tripTypes?.length === 7 && p.rating && p.rating >= 4.5)
  );

  return essentials.slice(0, 10);
}
