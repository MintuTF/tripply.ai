import type {
  PackingListTemplate,
  TemplateItem,
  PackingCategory,
  TripType,
  WeatherCondition,
} from '@/types/packing';

// Base essentials everyone needs
const BASE_ESSENTIALS: TemplateItem[] = [
  {
    name: 'Passport/ID',
    category: 'documents',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'passport-holder',
    aiReason: 'Required for travel identification',
  },
  {
    name: 'Phone charger',
    category: 'electronics',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'universal-adapter',
    aiReason: 'Keep your devices powered',
  },
  {
    name: 'Toothbrush & toothpaste',
    category: 'toiletries',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'toiletry-bag',
    aiReason: 'Daily hygiene essential',
  },
  {
    name: 'Underwear',
    category: 'clothing',
    baseQuantity: 3,
    quantityPerDay: 1,
    maxQuantity: 10,
    isEssential: true,
    aiReason: 'Daily essential clothing',
  },
  {
    name: 'Socks',
    category: 'clothing',
    baseQuantity: 3,
    quantityPerDay: 1,
    maxQuantity: 10,
    isEssential: true,
    linkedProductId: 'compression-socks',
    aiReason: 'Comfortable travel essentials',
  },
  {
    name: 'Deodorant',
    category: 'toiletries',
    baseQuantity: 1,
    isEssential: true,
    aiReason: 'Personal hygiene essential',
  },
  {
    name: 'Medications',
    category: 'health',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'first-aid-kit',
    aiReason: 'Bring any personal prescriptions',
  },
  {
    name: 'Wallet/Cards',
    category: 'documents',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'rfid-wallet',
    aiReason: 'Payment and identification',
  },
  {
    name: 'Phone',
    category: 'electronics',
    baseQuantity: 1,
    isEssential: true,
    aiReason: 'Communication and navigation',
  },
];

// Weather-specific items
const COLD_WEATHER_ITEMS: TemplateItem[] = [
  {
    name: 'Winter jacket',
    category: 'clothing',
    baseQuantity: 1,
    isEssential: true,
    conditions: { weather: ['cold', 'snowy'] },
    aiReason: 'Essential for cold weather protection',
  },
  {
    name: 'Warm sweaters',
    category: 'clothing',
    baseQuantity: 2,
    maxQuantity: 4,
    isEssential: false,
    conditions: { weather: ['cold', 'snowy', 'mild'] },
    aiReason: 'Layering for warmth',
  },
  {
    name: 'Thermal underwear',
    category: 'clothing',
    baseQuantity: 2,
    isEssential: false,
    conditions: { weather: ['cold', 'snowy'] },
    aiReason: 'Base layer for extreme cold',
  },
  {
    name: 'Warm hat/beanie',
    category: 'accessories',
    baseQuantity: 1,
    isEssential: true,
    conditions: { weather: ['cold', 'snowy'] },
    aiReason: 'Protect against heat loss',
  },
  {
    name: 'Gloves',
    category: 'accessories',
    baseQuantity: 1,
    isEssential: true,
    conditions: { weather: ['cold', 'snowy'] },
    aiReason: 'Hand protection from cold',
  },
  {
    name: 'Scarf',
    category: 'accessories',
    baseQuantity: 1,
    isEssential: false,
    conditions: { weather: ['cold', 'snowy'] },
    aiReason: 'Neck warmth and style',
  },
  {
    name: 'Winter boots',
    category: 'clothing',
    baseQuantity: 1,
    isEssential: true,
    conditions: { weather: ['cold', 'snowy'] },
    aiReason: 'Insulated footwear for cold/snow',
  },
];

const WARM_WEATHER_ITEMS: TemplateItem[] = [
  {
    name: 'Sunscreen',
    category: 'toiletries',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'sunscreen',
    conditions: { weather: ['hot', 'warm'] },
    aiReason: 'UV protection is crucial',
  },
  {
    name: 'Sunglasses',
    category: 'accessories',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'sunglasses',
    conditions: { weather: ['hot', 'warm'] },
    aiReason: 'Eye protection from sun',
  },
  {
    name: 'Sun hat',
    category: 'accessories',
    baseQuantity: 1,
    isEssential: false,
    conditions: { weather: ['hot', 'warm'] },
    aiReason: 'Additional sun protection',
  },
  {
    name: 'Light T-shirts',
    category: 'clothing',
    baseQuantity: 3,
    quantityPerDay: 1,
    maxQuantity: 8,
    isEssential: true,
    conditions: { weather: ['hot', 'warm', 'humid'] },
    aiReason: 'Breathable clothing for heat',
  },
  {
    name: 'Shorts',
    category: 'clothing',
    baseQuantity: 2,
    maxQuantity: 4,
    isEssential: false,
    conditions: { weather: ['hot', 'warm'] },
    aiReason: 'Stay cool in warm weather',
  },
  {
    name: 'Sandals',
    category: 'clothing',
    baseQuantity: 1,
    isEssential: false,
    conditions: { weather: ['hot', 'warm'] },
    aiReason: 'Breathable footwear',
  },
];

const RAINY_WEATHER_ITEMS: TemplateItem[] = [
  {
    name: 'Rain jacket',
    category: 'clothing',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'rain-jacket',
    conditions: { weather: ['rainy'] },
    aiReason: 'Stay dry in wet conditions',
  },
  {
    name: 'Umbrella',
    category: 'accessories',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'travel-umbrella',
    conditions: { weather: ['rainy'] },
    aiReason: 'Compact rain protection',
  },
  {
    name: 'Waterproof bag',
    category: 'gear',
    baseQuantity: 1,
    isEssential: false,
    conditions: { weather: ['rainy'] },
    aiReason: 'Protect belongings from rain',
  },
  {
    name: 'Quick-dry clothes',
    category: 'clothing',
    baseQuantity: 2,
    isEssential: false,
    conditions: { weather: ['rainy', 'humid'] },
    aiReason: 'Dries quickly if wet',
  },
];

// Activity-specific items
const BEACH_ITEMS: TemplateItem[] = [
  {
    name: 'Swimsuit',
    category: 'clothing',
    baseQuantity: 2,
    isEssential: true,
    conditions: { activities: ['beach', 'swimming', 'water sports'] },
    aiReason: 'Essential for water activities',
  },
  {
    name: 'Beach towel',
    category: 'accessories',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'microfiber-towel',
    conditions: { activities: ['beach', 'swimming'] },
    aiReason: 'Quick-dry towel for beach',
  },
  {
    name: 'Flip flops',
    category: 'clothing',
    baseQuantity: 1,
    isEssential: true,
    conditions: { activities: ['beach'] },
    aiReason: 'Beach and pool footwear',
  },
  {
    name: 'Waterproof phone pouch',
    category: 'accessories',
    baseQuantity: 1,
    isEssential: false,
    conditions: { activities: ['beach', 'water sports'] },
    aiReason: 'Protect phone near water',
  },
  {
    name: 'Snorkel gear',
    category: 'gear',
    baseQuantity: 1,
    isEssential: false,
    conditions: { activities: ['snorkeling', 'diving'] },
    aiReason: 'Explore underwater',
  },
];

const HIKING_ITEMS: TemplateItem[] = [
  {
    name: 'Hiking boots',
    category: 'clothing',
    baseQuantity: 1,
    isEssential: true,
    conditions: { activities: ['hiking', 'trekking'] },
    aiReason: 'Proper footwear for trails',
  },
  {
    name: 'Daypack/backpack',
    category: 'gear',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'daypack',
    conditions: { activities: ['hiking', 'trekking', 'sightseeing'] },
    aiReason: 'Carry essentials on hikes',
  },
  {
    name: 'Water bottle',
    category: 'gear',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'water-bottle',
    conditions: { activities: ['hiking', 'trekking'] },
    aiReason: 'Stay hydrated on trails',
  },
  {
    name: 'Hiking pants',
    category: 'clothing',
    baseQuantity: 2,
    isEssential: true,
    conditions: { activities: ['hiking', 'trekking'] },
    aiReason: 'Comfortable trail pants',
  },
  {
    name: 'Hiking socks',
    category: 'clothing',
    baseQuantity: 3,
    isEssential: true,
    conditions: { activities: ['hiking', 'trekking'] },
    aiReason: 'Prevent blisters on trails',
  },
  {
    name: 'Trekking poles',
    category: 'gear',
    baseQuantity: 1,
    isEssential: false,
    conditions: { activities: ['hiking', 'trekking'] },
    aiReason: 'Stability on steep terrain',
  },
];

const BUSINESS_ITEMS: TemplateItem[] = [
  {
    name: 'Business suits/dresses',
    category: 'clothing',
    baseQuantity: 2,
    isEssential: true,
    conditions: { tripTypes: ['business'] },
    aiReason: 'Professional attire for meetings',
  },
  {
    name: 'Dress shoes',
    category: 'clothing',
    baseQuantity: 1,
    isEssential: true,
    conditions: { tripTypes: ['business'] },
    aiReason: 'Formal footwear',
  },
  {
    name: 'Laptop',
    category: 'electronics',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'laptop-backpack',
    conditions: { tripTypes: ['business'] },
    aiReason: 'Work device',
  },
  {
    name: 'Business cards',
    category: 'documents',
    baseQuantity: 1,
    isEssential: false,
    conditions: { tripTypes: ['business'] },
    aiReason: 'Networking essential',
  },
  {
    name: 'Portable charger',
    category: 'electronics',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'power-bank',
    conditions: { tripTypes: ['business'] },
    aiReason: 'Keep devices charged in meetings',
  },
];

const PHOTOGRAPHY_ITEMS: TemplateItem[] = [
  {
    name: 'Camera',
    category: 'electronics',
    baseQuantity: 1,
    isEssential: true,
    linkedProductId: 'camera-bag',
    conditions: { activities: ['photography', 'sightseeing'] },
    aiReason: 'Capture memories',
  },
  {
    name: 'Extra memory cards',
    category: 'electronics',
    baseQuantity: 2,
    isEssential: true,
    conditions: { activities: ['photography'] },
    aiReason: 'Storage for photos',
  },
  {
    name: 'Camera batteries',
    category: 'electronics',
    baseQuantity: 2,
    isEssential: true,
    conditions: { activities: ['photography'] },
    aiReason: 'Extra power for shoots',
  },
  {
    name: 'Tripod',
    category: 'gear',
    baseQuantity: 1,
    isEssential: false,
    conditions: { activities: ['photography'] },
    aiReason: 'Stable shots and long exposures',
  },
];

// Packing list templates
export const PACKING_TEMPLATES: PackingListTemplate[] = [
  {
    id: 'beach-vacation',
    name: 'Beach Vacation',
    description: 'Perfect for tropical getaways and coastal destinations',
    tripTypes: ['beach', 'leisure'],
    weatherConditions: ['hot', 'warm', 'humid'],
    durationRange: { min: 3, max: 14 },
    items: [
      ...BASE_ESSENTIALS,
      ...WARM_WEATHER_ITEMS,
      ...BEACH_ITEMS,
    ],
  },
  {
    id: 'city-break',
    name: 'City Break',
    description: 'Urban exploration and cultural experiences',
    tripTypes: ['city', 'leisure'],
    weatherConditions: ['warm', 'mild', 'cold'],
    durationRange: { min: 2, max: 7 },
    items: [
      ...BASE_ESSENTIALS,
      {
        name: 'Comfortable walking shoes',
        category: 'clothing',
        baseQuantity: 1,
        isEssential: true,
        aiReason: 'Essential for city exploration',
      },
      {
        name: 'Casual day outfits',
        category: 'clothing',
        baseQuantity: 3,
        quantityPerDay: 1,
        maxQuantity: 6,
        isEssential: true,
        aiReason: 'Versatile sightseeing attire',
      },
      {
        name: 'Evening outfit',
        category: 'clothing',
        baseQuantity: 1,
        isEssential: false,
        aiReason: 'Dinner and nightlife ready',
      },
      {
        name: 'Day bag/crossbody',
        category: 'accessories',
        baseQuantity: 1,
        isEssential: true,
        linkedProductId: 'anti-theft-bag',
        aiReason: 'Secure bag for sightseeing',
      },
      {
        name: 'Portable charger',
        category: 'electronics',
        baseQuantity: 1,
        isEssential: true,
        linkedProductId: 'power-bank',
        aiReason: 'Keep phone charged for maps',
      },
    ],
  },
  {
    id: 'business-trip',
    name: 'Business Trip',
    description: 'Professional travel with work essentials',
    tripTypes: ['business'],
    weatherConditions: ['warm', 'mild', 'cold'],
    durationRange: { min: 1, max: 10 },
    items: [
      ...BASE_ESSENTIALS,
      ...BUSINESS_ITEMS,
    ],
  },
  {
    id: 'adventure-outdoor',
    name: 'Adventure & Outdoor',
    description: 'Hiking, camping, and nature exploration',
    tripTypes: ['adventure', 'nature'],
    weatherConditions: ['warm', 'mild', 'cold', 'rainy'],
    durationRange: { min: 2, max: 14 },
    items: [
      ...BASE_ESSENTIALS,
      ...HIKING_ITEMS,
      {
        name: 'First aid kit',
        category: 'health',
        baseQuantity: 1,
        isEssential: true,
        linkedProductId: 'first-aid-kit',
        aiReason: 'Safety essential for outdoors',
      },
      {
        name: 'Headlamp/flashlight',
        category: 'gear',
        baseQuantity: 1,
        isEssential: true,
        conditions: { activities: ['hiking', 'camping'] },
        aiReason: 'Night visibility on trails',
      },
      {
        name: 'Insect repellent',
        category: 'toiletries',
        baseQuantity: 1,
        isEssential: true,
        linkedProductId: 'insect-repellent',
        aiReason: 'Bug protection outdoors',
      },
    ],
  },
  {
    id: 'winter-getaway',
    name: 'Winter Getaway',
    description: 'Cold weather destinations and ski trips',
    tripTypes: ['leisure', 'adventure'],
    weatherConditions: ['cold', 'snowy'],
    durationRange: { min: 3, max: 14 },
    items: [
      ...BASE_ESSENTIALS,
      ...COLD_WEATHER_ITEMS,
      {
        name: 'Lip balm',
        category: 'toiletries',
        baseQuantity: 1,
        isEssential: true,
        aiReason: 'Prevent chapped lips in cold',
      },
      {
        name: 'Hand warmers',
        category: 'gear',
        baseQuantity: 4,
        isEssential: false,
        conditions: { weather: ['cold', 'snowy'] },
        aiReason: 'Extra warmth on cold days',
      },
    ],
  },
  {
    id: 'romantic-escape',
    name: 'Romantic Escape',
    description: 'Honeymoon or couples getaway',
    tripTypes: ['romantic', 'leisure'],
    weatherConditions: ['warm', 'mild', 'hot'],
    durationRange: { min: 3, max: 14 },
    items: [
      ...BASE_ESSENTIALS,
      {
        name: 'Nice dinner outfit',
        category: 'clothing',
        baseQuantity: 2,
        isEssential: true,
        aiReason: 'Romantic dinner attire',
      },
      {
        name: 'Swimwear',
        category: 'clothing',
        baseQuantity: 2,
        isEssential: false,
        aiReason: 'Pool or beach activities',
      },
      {
        name: 'Camera',
        category: 'electronics',
        baseQuantity: 1,
        isEssential: false,
        linkedProductId: 'camera-bag',
        aiReason: 'Capture special moments',
      },
    ],
  },
  {
    id: 'family-vacation',
    name: 'Family Vacation',
    description: 'Family-friendly trip with kids',
    tripTypes: ['family', 'leisure'],
    weatherConditions: ['warm', 'mild', 'hot'],
    durationRange: { min: 4, max: 14 },
    items: [
      ...BASE_ESSENTIALS,
      {
        name: 'Snacks',
        category: 'misc',
        baseQuantity: 1,
        isEssential: true,
        aiReason: 'Keep kids fed between meals',
      },
      {
        name: 'Entertainment (books/games)',
        category: 'misc',
        baseQuantity: 1,
        isEssential: true,
        aiReason: 'Keep kids occupied during travel',
      },
      {
        name: 'First aid kit',
        category: 'health',
        baseQuantity: 1,
        isEssential: true,
        linkedProductId: 'first-aid-kit',
        aiReason: 'For minor injuries',
      },
      {
        name: 'Wet wipes',
        category: 'toiletries',
        baseQuantity: 2,
        isEssential: true,
        aiReason: 'Essential for quick cleanups',
      },
    ],
  },
];

// Get template by ID
export function getTemplateById(id: string): PackingListTemplate | undefined {
  return PACKING_TEMPLATES.find((t) => t.id === id);
}

// Get templates matching trip context
export function getMatchingTemplates(
  tripType?: TripType,
  weather?: WeatherCondition[]
): PackingListTemplate[] {
  return PACKING_TEMPLATES.filter((template) => {
    const matchesTripType = !tripType || template.tripTypes.includes(tripType);
    const matchesWeather =
      !weather ||
      weather.length === 0 ||
      weather.some((w) => template.weatherConditions.includes(w));
    return matchesTripType || matchesWeather;
  });
}

// Get all unique items from templates
export function getAllTemplateItems(): TemplateItem[] {
  const itemMap = new Map<string, TemplateItem>();

  PACKING_TEMPLATES.forEach((template) => {
    template.items.forEach((item) => {
      if (!itemMap.has(item.name)) {
        itemMap.set(item.name, item);
      }
    });
  });

  return Array.from(itemMap.values());
}

// Get weather items
export function getWeatherItems(conditions: WeatherCondition[]): TemplateItem[] {
  const allWeatherItems = [
    ...COLD_WEATHER_ITEMS,
    ...WARM_WEATHER_ITEMS,
    ...RAINY_WEATHER_ITEMS,
  ];

  return allWeatherItems.filter((item) => {
    if (!item.conditions?.weather) return false;
    return item.conditions.weather.some((w) => conditions.includes(w));
  });
}

// Get activity items
export function getActivityItems(activities: string[]): TemplateItem[] {
  const allActivityItems = [
    ...BEACH_ITEMS,
    ...HIKING_ITEMS,
    ...PHOTOGRAPHY_ITEMS,
  ];

  const normalizedActivities = activities.map((a) => a.toLowerCase());

  return allActivityItems.filter((item) => {
    if (!item.conditions?.activities) return false;
    return item.conditions.activities.some((a) =>
      normalizedActivities.some(
        (activity) => activity.includes(a) || a.includes(activity)
      )
    );
  });
}

// Export grouped items for convenience
export const WEATHER_ITEMS = {
  cold: COLD_WEATHER_ITEMS,
  warm: WARM_WEATHER_ITEMS,
  rainy: RAINY_WEATHER_ITEMS,
};

export const ACTIVITY_ITEMS = {
  beach: BEACH_ITEMS,
  hiking: HIKING_ITEMS,
  business: BUSINESS_ITEMS,
  photography: PHOTOGRAPHY_ITEMS,
};
