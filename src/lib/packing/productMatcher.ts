import type { PackingItem, PackingCategory, PackingContext, ProductMatch } from '@/types/packing';
import type { Product } from '@/types/marketplace';
import { getAllProducts, searchProducts } from '@/lib/marketplace/products';
import { generateAffiliateUrl } from '@/lib/marketplace/affiliateUtils';

// Category mapping from packing categories to marketplace categories
const CATEGORY_MAPPING: Record<PackingCategory, string[]> = {
  clothing: ['clothing'],
  toiletries: ['toiletries'],
  electronics: ['electronics'],
  documents: ['essentials', 'organization'],
  health: ['safety', 'essentials'],
  accessories: ['essentials', 'comfort', 'organization'],
  gear: ['essentials', 'comfort', 'activity'],
  misc: ['essentials', 'comfort'],
};

// Item name to product keyword mappings
const ITEM_KEYWORD_MAP: Record<string, string[]> = {
  // Documents
  'Passport/ID': ['passport holder', 'travel wallet', 'document organizer'],
  'Wallet/Cards': ['RFID wallet', 'travel wallet', 'card holder'],
  'Business cards': ['card holder', 'business card case'],

  // Electronics
  'Phone charger': ['adapter', 'charger', 'power bank'],
  'Portable charger': ['power bank', 'portable charger', 'battery pack'],
  'Camera': ['camera bag', 'camera case'],
  'Laptop': ['laptop bag', 'laptop backpack', 'laptop sleeve'],

  // Toiletries
  'Toothbrush & toothpaste': ['toiletry bag', 'travel toiletry', 'dopp kit'],
  'Deodorant': ['toiletry bag', 'travel kit'],
  'Sunscreen': ['sunscreen', 'SPF', 'sun protection'],
  'Insect repellent': ['insect repellent', 'bug spray', 'mosquito'],

  // Clothing & Accessories
  'Socks': ['compression socks', 'travel socks', 'merino socks'],
  'Underwear': ['packing cubes', 'compression bags'],
  'Rain jacket': ['rain jacket', 'waterproof', 'rain gear'],
  'Umbrella': ['travel umbrella', 'compact umbrella'],
  'Sunglasses': ['sunglasses', 'polarized', 'UV protection'],
  'Day bag/crossbody': ['anti-theft bag', 'crossbody', 'day pack'],
  'Daypack/backpack': ['daypack', 'day pack', 'backpack'],

  // Health & Safety
  'Medications': ['first aid', 'pill organizer', 'medicine case'],
  'First aid kit': ['first aid kit', 'emergency kit', 'medical kit'],

  // Gear
  'Water bottle': ['water bottle', 'hydration', 'insulated bottle'],
  'Beach towel': ['microfiber towel', 'quick dry towel', 'travel towel'],
  'Headlamp/flashlight': ['headlamp', 'flashlight', 'travel light'],

  // Misc
  'Entertainment (books/games)': ['kindle', 'e-reader', 'tablet'],
};

// Calculate match score between packing item and product
function calculateMatchScore(
  item: PackingItem,
  product: Product,
  context?: PackingContext
): number {
  let score = 0;

  // Exact ID match (linked product)
  if (item.linkedProductId === product.id) {
    return 100;
  }

  // Name/keyword matching
  const itemNameLower = item.name.toLowerCase();
  const productNameLower = product.name.toLowerCase();
  const productDescLower = product.description.toLowerCase();

  // Direct name match
  if (productNameLower.includes(itemNameLower) || itemNameLower.includes(productNameLower)) {
    score += 40;
  }

  // Keyword mapping match
  const keywords = ITEM_KEYWORD_MAP[item.name] || [];
  for (const keyword of keywords) {
    if (productNameLower.includes(keyword.toLowerCase())) {
      score += 30;
      break;
    }
    if (productDescLower.includes(keyword.toLowerCase())) {
      score += 15;
      break;
    }
  }

  // Category match
  const mappedCategories = CATEGORY_MAPPING[item.category] || [];
  if (mappedCategories.includes(product.category)) {
    score += 20;
  }

  // Tag matching
  const productTags = product.tags.map((t) => t.toLowerCase());
  if (productTags.some((tag) => itemNameLower.includes(tag))) {
    score += 15;
  }

  // Context-based scoring
  if (context) {
    // Weather match
    if (context.weather?.conditions && product.weatherConditions) {
      const hasWeatherMatch = context.weather.conditions.some((w) =>
        product.weatherConditions?.includes(w)
      );
      if (hasWeatherMatch) {
        score += 10;
      }
    }

    // Activity match
    if (context.activities && product.activities) {
      const hasActivityMatch = context.activities.some((a) =>
        product.activities?.some(
          (pa) => pa.toLowerCase().includes(a.toLowerCase())
        )
      );
      if (hasActivityMatch) {
        score += 10;
      }
    }

    // Budget tier matching
    if (context.customPreferences?.budgetTier) {
      if (product.budgetTier === context.customPreferences.budgetTier) {
        score += 5;
      }
    }
  }

  // Rating bonus (higher rated products score better)
  if (product.rating >= 4.5) {
    score += 5;
  }

  return Math.min(score, 100);
}

// Generate a reason for why this product matches
function generateMatchReason(
  item: PackingItem,
  product: Product,
  score: number
): string {
  if (item.linkedProductId === product.id) {
    return `Top recommended product for ${item.name}`;
  }

  const reasons: string[] = [];

  // Check for keyword match
  const keywords = ITEM_KEYWORD_MAP[item.name] || [];
  const matchedKeyword = keywords.find(
    (k) =>
      product.name.toLowerCase().includes(k.toLowerCase()) ||
      product.description.toLowerCase().includes(k.toLowerCase())
  );

  if (matchedKeyword) {
    reasons.push(`matches your ${item.name.toLowerCase()}`);
  }

  // Rating-based reason
  if (product.rating >= 4.5) {
    reasons.push(`highly rated (${product.rating}${'\u2B50'})`);
  }

  // Review count reason
  if (product.reviewCount > 500) {
    reasons.push('trusted by many travelers');
  }

  // Price reason
  if (product.budgetTier === 'budget') {
    reasons.push('budget-friendly option');
  } else if (product.budgetTier === 'premium') {
    reasons.push('premium quality choice');
  }

  if (reasons.length === 0) {
    reasons.push(`related to ${item.category}`);
  }

  return reasons.slice(0, 2).join(' and ');
}

// Find matching products for a packing item
export function findProductsForItem(
  item: PackingItem,
  context?: PackingContext,
  limit: number = 3
): ProductMatch {
  const allProducts = getAllProducts();

  // Score all products
  const scoredProducts = allProducts
    .map((product) => ({
      product,
      score: calculateMatchScore(item, product, context),
    }))
    .filter(({ score }) => score > 15) // Minimum threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const topMatch = scoredProducts[0];

  return {
    item,
    products: scoredProducts.map(({ product }) => product),
    topMatch: topMatch?.product,
    matchScore: topMatch?.score || 0,
    reason: topMatch
      ? generateMatchReason(item, topMatch.product, topMatch.score)
      : 'No matching products found',
  };
}

// Find products for multiple packing items
export function findProductsForItems(
  items: PackingItem[],
  context?: PackingContext,
  productsPerItem: number = 3
): ProductMatch[] {
  return items.map((item) => findProductsForItem(item, context, productsPerItem));
}

// Get product recommendations for a whole packing list
export function getPackingListRecommendations(
  items: PackingItem[],
  context?: PackingContext
): {
  matches: ProductMatch[];
  essentialMatches: ProductMatch[];
  totalProducts: number;
  withProductMatch: number;
} {
  const matches = findProductsForItems(items, context);

  const essentialItems = items.filter((i) => i.isEssential);
  const essentialMatches = matches.filter(
    (m) => essentialItems.some((i) => i.id === m.item.id) && m.products.length > 0
  );

  const withProductMatch = matches.filter((m) => m.products.length > 0).length;

  return {
    matches,
    essentialMatches,
    totalProducts: matches.reduce((sum, m) => sum + m.products.length, 0),
    withProductMatch,
  };
}

// Search products by item name
export function searchProductsForItem(
  itemName: string,
  context?: PackingContext
): Product[] {
  // Get keywords for this item
  const keywords = ITEM_KEYWORD_MAP[itemName] || [itemName];

  // Search using all keywords
  const results = new Map<string, Product>();

  for (const keyword of keywords) {
    const searchResults = searchProducts(keyword);
    for (const product of searchResults) {
      if (!results.has(product.id)) {
        results.set(product.id, product);
      }
    }
  }

  return Array.from(results.values()).slice(0, 10);
}

// Get products by specific linked product ID
export function getLinkedProduct(productId: string): Product | undefined {
  const allProducts = getAllProducts();
  return allProducts.find((p) => p.id === productId);
}

// Enrich packing items with product data
export function enrichItemsWithProducts(
  items: PackingItem[],
  context?: PackingContext
): PackingItem[] {
  return items.map((item) => {
    // If item already has linked product, fetch it
    if (item.linkedProductId) {
      const product = getLinkedProduct(item.linkedProductId);
      if (product) {
        return {
          ...item,
          linkedProduct: {
            ...product,
            affiliateUrl: generateAffiliateUrl(product.affiliateUrl),
          },
        };
      }
    }

    // Otherwise find best match
    const match = findProductsForItem(item, context, 1);
    if (match.topMatch) {
      return {
        ...item,
        linkedProduct: {
          ...match.topMatch,
          affiliateUrl: generateAffiliateUrl(match.topMatch.affiliateUrl),
        },
        aiReason: item.aiReason || match.reason,
      };
    }

    return item;
  });
}

// Get curated product bundles for common packing needs
export function getPackingBundles(context?: PackingContext): {
  name: string;
  description: string;
  products: Product[];
}[] {
  const allProducts = getAllProducts();
  const bundles: { name: string; description: string; products: Product[] }[] = [];

  // Travel essentials bundle
  const essentialKeywords = ['adapter', 'neck pillow', 'toiletry', 'packing cube', 'luggage'];
  const essentials = allProducts
    .filter((p) =>
      essentialKeywords.some((k) =>
        p.name.toLowerCase().includes(k) || p.tags.some((t) => t.toLowerCase().includes(k))
      )
    )
    .slice(0, 5);

  if (essentials.length > 0) {
    bundles.push({
      name: 'Travel Essentials',
      description: 'Must-have items for any trip',
      products: essentials,
    });
  }

  // Tech bundle
  const techKeywords = ['charger', 'power bank', 'adapter', 'cable', 'headphone'];
  const techItems = allProducts
    .filter((p) =>
      p.category === 'electronics' ||
      techKeywords.some((k) => p.name.toLowerCase().includes(k))
    )
    .slice(0, 5);

  if (techItems.length > 0) {
    bundles.push({
      name: 'Tech Travel Kit',
      description: 'Keep your devices powered and protected',
      products: techItems,
    });
  }

  // Comfort bundle
  const comfortKeywords = ['pillow', 'blanket', 'eye mask', 'earplugs', 'comfort'];
  const comfortItems = allProducts
    .filter((p) =>
      p.category === 'comfort' ||
      comfortKeywords.some((k) => p.name.toLowerCase().includes(k))
    )
    .slice(0, 5);

  if (comfortItems.length > 0) {
    bundles.push({
      name: 'Comfort Essentials',
      description: 'Travel in comfort',
      products: comfortItems,
    });
  }

  return bundles;
}
