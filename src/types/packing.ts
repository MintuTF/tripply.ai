import type { Product } from './marketplace';

// Packing categories for organizing items
export type PackingCategory =
  | 'clothing'
  | 'toiletries'
  | 'electronics'
  | 'documents'
  | 'health'
  | 'accessories'
  | 'gear'
  | 'misc';

// Trip types that affect packing recommendations
export type TripType =
  | 'leisure'
  | 'business'
  | 'adventure'
  | 'beach'
  | 'city'
  | 'nature'
  | 'family'
  | 'romantic';

// Weather conditions that affect packing
export type WeatherCondition =
  | 'hot'
  | 'warm'
  | 'mild'
  | 'cold'
  | 'rainy'
  | 'snowy'
  | 'humid'
  | 'dry';

// Individual packing item
export interface PackingItem {
  id: string;
  name: string;
  category: PackingCategory;
  quantity: number;
  isPacked: boolean;
  isEssential: boolean;
  notes?: string;
  linkedProductId?: string;
  linkedProduct?: Product;
  aiReason?: string;
  customItem?: boolean; // User-added items not from templates
}

// Full packing list with metadata
export interface PackingList {
  id: string;
  tripId?: string;
  name: string;
  destination: string;
  duration: number;
  weather?: {
    avgTemp: number;
    conditions: WeatherCondition[];
  };
  activities?: string[];
  tripType?: TripType;
  items: PackingItem[];
  createdAt: string;
  updatedAt: string;
  isTemplate?: boolean;
}

// Template for generating packing lists
export interface PackingListTemplate {
  id: string;
  name: string;
  description: string;
  tripTypes: TripType[];
  weatherConditions: WeatherCondition[];
  durationRange: { min: number; max: number };
  items: TemplateItem[];
}

// Item within a template (without packed status)
export interface TemplateItem {
  name: string;
  category: PackingCategory;
  baseQuantity: number;
  quantityPerDay?: number; // For items that scale with trip duration
  maxQuantity?: number;
  isEssential: boolean;
  conditions?: {
    weather?: WeatherCondition[];
    activities?: string[];
    tripTypes?: TripType[];
  };
  linkedProductId?: string;
  aiReason?: string;
}

// Context for generating smart packing lists
export interface PackingContext {
  destination: string;
  duration: number;
  startDate?: string;
  endDate?: string;
  weather?: {
    avgTemp: number;
    conditions: WeatherCondition[];
  };
  activities?: string[];
  tripType?: TripType;
  travelers?: number;
  customPreferences?: {
    includeCategories?: PackingCategory[];
    excludeCategories?: PackingCategory[];
    budgetTier?: 'budget' | 'mid-range' | 'premium';
  };
}

// Category display metadata
export interface CategoryMeta {
  id: PackingCategory;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
}

// Packing progress statistics
export interface PackingProgress {
  totalItems: number;
  packedItems: number;
  essentialItems: number;
  packedEssentials: number;
  percentComplete: number;
  percentEssentialsComplete: number;
  byCategory: Record<PackingCategory, {
    total: number;
    packed: number;
    percent: number;
  }>;
}

// Product match result from recommendation engine
export interface ProductMatch {
  item: PackingItem;
  products: Product[];
  topMatch?: Product;
  matchScore: number;
  reason: string;
}

// Category metadata for UI
export const CATEGORY_META: CategoryMeta[] = [
  {
    id: 'clothing',
    name: 'Clothing',
    icon: 'Shirt',
    description: 'Clothes and wearables',
    sortOrder: 1,
  },
  {
    id: 'toiletries',
    name: 'Toiletries',
    icon: 'Droplet',
    description: 'Personal care items',
    sortOrder: 2,
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: 'Laptop',
    description: 'Devices and chargers',
    sortOrder: 3,
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: 'FileText',
    description: 'Travel documents and IDs',
    sortOrder: 4,
  },
  {
    id: 'health',
    name: 'Health & Safety',
    icon: 'Heart',
    description: 'Medical and safety items',
    sortOrder: 5,
  },
  {
    id: 'accessories',
    name: 'Accessories',
    icon: 'Watch',
    description: 'Bags, watches, jewelry',
    sortOrder: 6,
  },
  {
    id: 'gear',
    name: 'Gear',
    icon: 'Backpack',
    description: 'Activity-specific equipment',
    sortOrder: 7,
  },
  {
    id: 'misc',
    name: 'Miscellaneous',
    icon: 'Package',
    description: 'Other essentials',
    sortOrder: 8,
  },
];

// Helper to get category metadata
export function getCategoryMeta(category: PackingCategory): CategoryMeta {
  return CATEGORY_META.find((c) => c.id === category) || CATEGORY_META[CATEGORY_META.length - 1];
}

// Helper to generate unique IDs
export function generatePackingId(): string {
  return `pack_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to calculate packing progress
export function calculatePackingProgress(items: PackingItem[]): PackingProgress {
  const totalItems = items.length;
  const packedItems = items.filter((i) => i.isPacked).length;
  const essentialItems = items.filter((i) => i.isEssential).length;
  const packedEssentials = items.filter((i) => i.isEssential && i.isPacked).length;

  const byCategory = {} as PackingProgress['byCategory'];

  for (const category of CATEGORY_META.map((c) => c.id)) {
    const categoryItems = items.filter((i) => i.category === category);
    const categoryPacked = categoryItems.filter((i) => i.isPacked).length;
    byCategory[category] = {
      total: categoryItems.length,
      packed: categoryPacked,
      percent: categoryItems.length > 0
        ? Math.round((categoryPacked / categoryItems.length) * 100)
        : 0,
    };
  }

  return {
    totalItems,
    packedItems,
    essentialItems,
    packedEssentials,
    percentComplete: totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0,
    percentEssentialsComplete: essentialItems > 0
      ? Math.round((packedEssentials / essentialItems) * 100)
      : 0,
    byCategory,
  };
}
