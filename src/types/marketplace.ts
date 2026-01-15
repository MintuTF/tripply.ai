/**
 * Marketplace Types for Smart Travel Marketplace
 */

export type ProductCategory =
  | 'essentials'
  | 'clothing'
  | 'electronics'
  | 'toiletries'
  | 'safety'
  | 'comfort'
  | 'organization'
  | 'weather'
  | 'activity';

export type WeatherCondition = 'tropical' | 'cold' | 'rainy' | 'desert' | 'temperate';

export type TripType =
  | 'solo'
  | 'couple'
  | 'family'
  | 'business'
  | 'adventure'
  | 'luxury'
  | 'budget';

export type BudgetTier = 'budget' | 'mid-range' | 'premium';

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string; // "Why you need this" - generic reason
  image: string;
  price: number;
  priceRange?: [number, number]; // For variable pricing
  affiliateUrl: string;
  category: ProductCategory;
  tags: string[]; // e.g., ['waterproof', 'lightweight', 'TSA-approved']
  rating?: number;
  reviewCount?: number;
  budgetTier: BudgetTier;
  // Relevance filters for AI matching
  weatherConditions?: WeatherCondition[];
  tripTypes?: TripType[];
  activities?: string[]; // e.g., ['hiking', 'beach', 'skiing']
  destinations?: string[]; // Specific destinations like 'iceland', 'thailand'
}

export interface ProductRecommendation extends Product {
  relevanceScore: number; // 0-100
  reason: string; // AI-generated "why you need this for THIS trip" (backward compatibility)
  whyBullets?: string[]; // NEW: 2-3 contextual reason bullets for display
  smartBadges?: string[]; // NEW: Travel-aware badges with emoji (e.g., "❄️ Cold weather")
  contextualTags?: string[]; // NEW: Trip-specific tags for enhanced filtering
}

export interface MarketplaceFilters {
  budgetTier?: BudgetTier;
  categories?: ProductCategory[];
  searchQuery?: string;
}

export interface MarketplaceTripContext {
  destination?: string;
  destinationCoordinates?: { lat: number; lng: number };
  weather?: {
    temperature: number;
    condition: string;
    humidity?: number;
  };
  duration?: number; // days
  startDate?: string;
  endDate?: string;
  activities?: string[];
  tripType?: TripType;
  partySize?: number;
  hasChildren?: boolean;
  hasInfants?: boolean;
}

export interface CategoryKit {
  id: string;
  name: string;
  description: string;
  icon: string;
  products: string[]; // Product IDs
  isAIGenerated?: boolean;
}

export interface TripContextSummary {
  destination: string;
  duration: number; // days
  travelers: string; // Formatted text like "Couple", "Family with 2 kids"
  season: string; // "Winter", "Summer", "Spring", "Fall"
  tripType?: TripType;
}

export interface CategoryDefinition {
  id: ProductCategory;
  name: string;
  description: string;
  icon: string;
}

export interface MarketplaceRecommendationResponse {
  // NEW: Sectioned recommendations (Phase 8)
  topRecommendations: ProductRecommendation[]; // Score >= 75
  dontForget: ProductRecommendation[]; // Commonly forgotten essentials
  comfortUpgrades: ProductRecommendation[]; // Premium optional items
  tripContextSummary: TripContextSummary | null; // Parsed trip context
  totalProducts: number; // Total count across all sections

  // Legacy fields (backward compatibility)
  personalized: ProductRecommendation[]; // Renamed from 'personalized' in old response
  kits: CategoryKit[];
  general: Product[];
  recommendations: ProductRecommendation[]; // All personalized (score >= 60)
  smartKits: CategoryKit[]; // Same as kits
  categoryProducts: Record<string, Product[]>; // Products grouped by category
  tripSummary?: {
    destination: string;
    weather: string;
    duration: string;
  };
}
