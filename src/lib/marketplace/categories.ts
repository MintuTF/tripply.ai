/**
 * Category definitions for the Travel Marketplace
 */

import { CategoryDefinition, ProductCategory } from '@/types/marketplace';

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'essentials',
    name: 'Travel Essentials',
    description: 'Must-have items for any trip',
    icon: 'Plane',
  },
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Travel-friendly apparel and accessories',
    icon: 'Shirt',
  },
  {
    id: 'electronics',
    name: 'Electronics & Gadgets',
    description: 'Tech accessories for travelers',
    icon: 'Smartphone',
  },
  {
    id: 'toiletries',
    name: 'Toiletries',
    description: 'TSA-approved personal care items',
    icon: 'Droplet',
  },
  {
    id: 'safety',
    name: 'Safety & Security',
    description: 'Keep yourself and belongings safe',
    icon: 'Shield',
  },
  {
    id: 'comfort',
    name: 'Comfort',
    description: 'Make your journey more comfortable',
    icon: 'Heart',
  },
  {
    id: 'organization',
    name: 'Organization',
    description: 'Packing cubes, bags, and organizers',
    icon: 'Package',
  },
  {
    id: 'weather',
    name: 'Weather Gear',
    description: 'Rain, sun, and cold weather protection',
    icon: 'Cloud',
  },
  {
    id: 'activity',
    name: 'Activity Gear',
    description: 'Gear for specific activities',
    icon: 'Mountain',
  },
];

export function getCategoryById(id: ProductCategory): CategoryDefinition | undefined {
  return CATEGORIES.find((cat) => cat.id === id);
}

export function getCategoryIcon(id: ProductCategory): string {
  const category = getCategoryById(id);
  return category?.icon || 'Package';
}

export function getCategoryName(id: ProductCategory): string {
  const category = getCategoryById(id);
  return category?.name || id;
}
