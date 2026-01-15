import type {
  PackingItem,
  PackingList,
  PackingContext,
  PackingCategory,
  TemplateItem,
  TripType,
  WeatherCondition,
} from '@/types/packing';
import {
  generatePackingId,
  CATEGORY_META,
} from '@/types/packing';
import {
  PACKING_TEMPLATES,
  getMatchingTemplates,
  getWeatherItems,
  getActivityItems,
} from './templates';
import { enrichItemsWithProducts } from './productMatcher';

// Convert template item to packing item
function templateItemToPackingItem(
  templateItem: TemplateItem,
  duration: number
): PackingItem {
  // Calculate quantity based on duration
  let quantity = templateItem.baseQuantity;

  if (templateItem.quantityPerDay && duration > 0) {
    quantity = templateItem.baseQuantity + templateItem.quantityPerDay * (duration - 1);
  }

  if (templateItem.maxQuantity) {
    quantity = Math.min(quantity, templateItem.maxQuantity);
  }

  return {
    id: generatePackingId(),
    name: templateItem.name,
    category: templateItem.category,
    quantity,
    isPacked: false,
    isEssential: templateItem.isEssential,
    linkedProductId: templateItem.linkedProductId,
    aiReason: templateItem.aiReason,
    customItem: false,
  };
}

// Check if template item matches context
function itemMatchesContext(
  item: TemplateItem,
  context: PackingContext
): boolean {
  // Items without conditions always match
  if (!item.conditions) return true;

  const { weather, activities, tripTypes } = item.conditions;

  // Check weather conditions
  if (weather && weather.length > 0) {
    if (!context.weather?.conditions) return false;
    const hasWeatherMatch = weather.some((w) =>
      context.weather!.conditions.includes(w)
    );
    if (!hasWeatherMatch) return false;
  }

  // Check activities
  if (activities && activities.length > 0) {
    if (!context.activities || context.activities.length === 0) return false;
    const normalizedContextActivities = context.activities.map((a) =>
      a.toLowerCase()
    );
    const hasActivityMatch = activities.some((a) =>
      normalizedContextActivities.some(
        (ca) => ca.includes(a.toLowerCase()) || a.toLowerCase().includes(ca)
      )
    );
    if (!hasActivityMatch) return false;
  }

  // Check trip types
  if (tripTypes && tripTypes.length > 0) {
    if (!context.tripType) return false;
    if (!tripTypes.includes(context.tripType)) return false;
  }

  return true;
}

// Generate packing list from context
export function generatePackingList(context: PackingContext): PackingList {
  const itemsMap = new Map<string, PackingItem>();

  // 1. Get matching templates
  const matchingTemplates = getMatchingTemplates(
    context.tripType,
    context.weather?.conditions
  );

  // 2. Add items from matching templates
  for (const template of matchingTemplates) {
    for (const templateItem of template.items) {
      // Check if item matches context
      if (!itemMatchesContext(templateItem, context)) continue;

      // Skip if already added (use name as key to dedupe)
      if (itemsMap.has(templateItem.name)) continue;

      const packingItem = templateItemToPackingItem(templateItem, context.duration);
      itemsMap.set(templateItem.name, packingItem);
    }
  }

  // 3. Add weather-specific items
  if (context.weather?.conditions) {
    const weatherItems = getWeatherItems(context.weather.conditions);
    for (const item of weatherItems) {
      if (itemsMap.has(item.name)) continue;
      if (!itemMatchesContext(item, context)) continue;
      itemsMap.set(item.name, templateItemToPackingItem(item, context.duration));
    }
  }

  // 4. Add activity-specific items
  if (context.activities && context.activities.length > 0) {
    const activityItems = getActivityItems(context.activities);
    for (const item of activityItems) {
      if (itemsMap.has(item.name)) continue;
      if (!itemMatchesContext(item, context)) continue;
      itemsMap.set(item.name, templateItemToPackingItem(item, context.duration));
    }
  }

  // 5. Convert to array and sort by category/essential
  const items = Array.from(itemsMap.values()).sort((a, b) => {
    // Essential items first
    if (a.isEssential !== b.isEssential) {
      return a.isEssential ? -1 : 1;
    }
    // Then by category order
    const catOrderA = CATEGORY_META.find((c) => c.id === a.category)?.sortOrder || 99;
    const catOrderB = CATEGORY_META.find((c) => c.id === b.category)?.sortOrder || 99;
    return catOrderA - catOrderB;
  });

  // 6. Enrich items with product data
  const enrichedItems = enrichItemsWithProducts(items, context);

  // 7. Create packing list
  const packingList: PackingList = {
    id: generatePackingId(),
    name: `${context.destination} Trip`,
    destination: context.destination,
    duration: context.duration,
    weather: context.weather,
    activities: context.activities,
    tripType: context.tripType,
    items: enrichedItems,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemplate: false,
  };

  return packingList;
}

// Suggest items based on destination
export function suggestItemsForDestination(destination: string): TemplateItem[] {
  const destinationLower = destination.toLowerCase();
  const suggestions: TemplateItem[] = [];

  // Beach destinations
  const beachDestinations = ['bali', 'hawaii', 'maldives', 'cancun', 'phuket', 'miami', 'caribbean'];
  if (beachDestinations.some((d) => destinationLower.includes(d))) {
    const beachTemplate = PACKING_TEMPLATES.find((t) => t.id === 'beach-vacation');
    if (beachTemplate) {
      suggestions.push(...beachTemplate.items.filter((i) => i.conditions?.activities?.includes('beach')));
    }
  }

  // Cold destinations
  const coldDestinations = ['iceland', 'norway', 'alaska', 'switzerland', 'canada', 'sweden', 'finland'];
  if (coldDestinations.some((d) => destinationLower.includes(d))) {
    const winterTemplate = PACKING_TEMPLATES.find((t) => t.id === 'winter-getaway');
    if (winterTemplate) {
      suggestions.push(...winterTemplate.items.filter((i) => i.conditions?.weather?.includes('cold')));
    }
  }

  // City destinations
  const cityDestinations = ['tokyo', 'paris', 'london', 'new york', 'rome', 'barcelona', 'singapore'];
  if (cityDestinations.some((d) => destinationLower.includes(d))) {
    const cityTemplate = PACKING_TEMPLATES.find((t) => t.id === 'city-break');
    if (cityTemplate) {
      suggestions.push(...cityTemplate.items.slice(0, 5));
    }
  }

  return suggestions;
}

// Get weather-appropriate items based on temperature
export function getItemsForTemperature(avgTemp: number): WeatherCondition[] {
  if (avgTemp >= 30) return ['hot', 'humid'];
  if (avgTemp >= 25) return ['warm', 'humid'];
  if (avgTemp >= 18) return ['warm', 'mild'];
  if (avgTemp >= 10) return ['mild', 'cold'];
  if (avgTemp >= 0) return ['cold'];
  return ['cold', 'snowy'];
}

// Create empty packing list
export function createEmptyPackingList(
  name: string,
  destination: string,
  duration: number
): PackingList {
  return {
    id: generatePackingId(),
    name,
    destination,
    duration,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemplate: false,
  };
}

// Add custom item to packing list
export function addCustomItem(
  list: PackingList,
  name: string,
  category: PackingCategory,
  quantity: number = 1,
  isEssential: boolean = false
): PackingList {
  const newItem: PackingItem = {
    id: generatePackingId(),
    name,
    category,
    quantity,
    isPacked: false,
    isEssential,
    customItem: true,
  };

  return {
    ...list,
    items: [...list.items, newItem],
    updatedAt: new Date().toISOString(),
  };
}

// Remove item from packing list
export function removeItem(list: PackingList, itemId: string): PackingList {
  return {
    ...list,
    items: list.items.filter((i) => i.id !== itemId),
    updatedAt: new Date().toISOString(),
  };
}

// Toggle item packed status
export function toggleItemPacked(list: PackingList, itemId: string): PackingList {
  return {
    ...list,
    items: list.items.map((i) =>
      i.id === itemId ? { ...i, isPacked: !i.isPacked } : i
    ),
    updatedAt: new Date().toISOString(),
  };
}

// Update item quantity
export function updateItemQuantity(
  list: PackingList,
  itemId: string,
  quantity: number
): PackingList {
  return {
    ...list,
    items: list.items.map((i) =>
      i.id === itemId ? { ...i, quantity: Math.max(1, quantity) } : i
    ),
    updatedAt: new Date().toISOString(),
  };
}

// Update item notes
export function updateItemNotes(
  list: PackingList,
  itemId: string,
  notes: string
): PackingList {
  return {
    ...list,
    items: list.items.map((i) =>
      i.id === itemId ? { ...i, notes } : i
    ),
    updatedAt: new Date().toISOString(),
  };
}

// Mark all items as packed/unpacked
export function setAllPacked(list: PackingList, isPacked: boolean): PackingList {
  return {
    ...list,
    items: list.items.map((i) => ({ ...i, isPacked })),
    updatedAt: new Date().toISOString(),
  };
}

// Get items grouped by category
export function getItemsByCategory(
  list: PackingList
): Record<PackingCategory, PackingItem[]> {
  const grouped: Record<PackingCategory, PackingItem[]> = {
    clothing: [],
    toiletries: [],
    electronics: [],
    documents: [],
    health: [],
    accessories: [],
    gear: [],
    misc: [],
  };

  for (const item of list.items) {
    grouped[item.category].push(item);
  }

  return grouped;
}

// Merge two packing lists (for combining templates)
export function mergePackingLists(
  base: PackingList,
  additional: PackingList
): PackingList {
  const existingNames = new Set(base.items.map((i) => i.name));
  const newItems = additional.items.filter((i) => !existingNames.has(i.name));

  return {
    ...base,
    items: [...base.items, ...newItems],
    updatedAt: new Date().toISOString(),
  };
}

// Duplicate packing list as template
export function createTemplateFromList(list: PackingList): PackingList {
  return {
    ...list,
    id: generatePackingId(),
    name: `${list.name} (Template)`,
    isTemplate: true,
    items: list.items.map((i) => ({
      ...i,
      id: generatePackingId(),
      isPacked: false,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
