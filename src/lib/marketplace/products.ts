/**
 * Real Amazon Products for Voyagr Marketplace
 * Fetches from database with fallback to static products
 */

import type { Product, ProductCategory } from '@/types/marketplace';
import { createServiceRoleClient } from '@/lib/db/supabase';

// Cache for database products
let cachedProducts: Product[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch products from database
 */
export async function fetchProductsFromDB(): Promise<Product[]> {
  // Check cache first
  if (cachedProducts && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedProducts;
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products from DB:', error);
      return PRODUCTS; // Fallback to static products
    }

    if (!data || data.length === 0) {
      return PRODUCTS; // Fallback to static products
    }

    // Transform database format to Product type
    const products: Product[] = data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      shortDescription: row.short_description || row.description?.substring(0, 100) || '',
      image: row.image || '',
      price: row.price || 0,
      affiliateUrl: row.affiliate_url || '',
      category: row.category || 'essentials',
      tags: row.tags || [],
      budgetTier: row.budget_tier || 'mid-range',
      rating: row.rating,
      reviewCount: row.review_count || 0,
      weatherConditions: row.weather_conditions || [],
      tripTypes: row.trip_types || [],
      activities: row.activities || [],
      destinations: row.destinations || [],
    }));

    // Update cache
    cachedProducts = products;
    cacheTimestamp = Date.now();

    return products;
  } catch (err) {
    console.error('Error in fetchProductsFromDB:', err);
    return PRODUCTS; // Fallback to static products
  }
}

export const PRODUCTS: Product[] = [
  {
    "id": "B0CVZWMD34",
    "name": "Kitsch Continuous Spray Bottle for Hair â€“ Fine Mist Water Mister & Water Spray Bottle â€“ Recycled Hair Spray Bottle â€“ Spray Bottles for Cleaning, Styling, Plants & More â€“ Terracotta, 150ml",
    "description": "About this item ULTRA-FINE MIST FOR EFFORTLESS HAIR STYLING: Experience smooth, clog-free spraying with this continuous spray bottle that delivers an even, ultra-fine mistâ€”perfect for refreshing curls, waves, and prepping hair without drenching. Ideal for daily styling, second-day curls, or plopping routines. MULTI-USE MISTER FOR HAIR, PLANTS, & MORE: More than just a hair spray bottleâ€”this versatile spray bottle works great for facial toners, alcohol-based solutions, light cleaners, or plant misting. Refillable and easy to clean for all-around home and beauty use. ERGONOMIC, EASY-TO-USE TRIGGER: Designed with a comfort-fit shape and smooth trigger action, this mister spray bottle reduces hand fatigue during useâ€”ideal for prolonged hairstyling sessions or daily refreshes without hassle. ECO-FRIENDLY & TRAVEL-READY DESIGN: Crafted from recycled materials, this 150ml water spray bottle is a sustainable, reusable alternative to single-use plastics. Lightweight and compact, it's the perfect travel spray bottle for hair, skincare, or quick cleanups on the go. REFILLABLE, NOT FOR THICK OR OILY LIQUIDS: Best used with lightweight, water-based liquids. Avoid thick or oily products to maintain optimal spray performance and prevent clogging. Keeps contents fresh with minimal risk of contamination from standing water. PERFECT HOLIDAY GIFTS FOR WOMEN â€“ Whether you're searching for gifts for women, white elephant gifts for adults, teen girl gifts trendy stuff, or thoughtful self care gifts for women, this spray bottle makes a versatile choice. Great as gifts for mom, valentines day gifts, or gifts for teen girls, and fits right in with fun white elephant gifts or practical stocking stuffers. â€º See more product details",
    "shortDescription": "Perfect travel toiletries for your next trip.",
    "image": "https://m.media-amazon.com/images/I/51u3yqZIjWL._AC_SL1250_.jpg",
    "price": 6.99,
    "affiliateUrl": "https://www.amazon.com/Kitsch-Spray-Bottle-Hair-Hairstyling/dp/B0CVZWMD34?th=1&psc=1&language=en_US&currency=USD",
    "category": "toiletries",
    "tags": [
      "toiletries",
      "travel",
      "compact",
      "lightweight",
      "reusable",
      "refillable",
      "eco-friendly",
      "versatile",
      "multi-use",
      "ergonomic"
    ],
    "budgetTier": "budget",
    "rating": 4.1,
    "reviewCount": 8573,
    "weatherConditions": [
      "cold"
    ],
    "tripTypes": [
      "business",
      "solo"
    ],
    "activities": [
      "camping"
    ]
  },
  {
    "id": "B0C6X2VP9R",
    "name": "Waterproof Travel Drawstring Shoe Bags for Packing, Storage, Travel Essentials for Men and Women, 15.7 x 11.8 inches, Clear, 5 pieces",
    "description": "Suitable Size: 15.7 x 11.8 inches; The package includes 5 pack of shoe bags; Ideal size for women and men; Great for packing dance shoes, sneakers, hiking golf shoes, clothes, and other travel items; Works well as a home and travel storage bag Multi-Function: Not just as a travel shoe bag, it also can be used as a traveling storage bag, toiletry bag, packing bag, gym bag, laundry bag travel; If there is any problem with the shoe bags, please let us know, and we will reply to you in time Premium Material: The travel shoe bag is made of premium PE, waterproof, and reusable; With thick drawstrings for easy hanging and quick organization; A good helper for home and travel use Thoughtful Design: The translucent design of the shoe bags for travel helps you easily identify what's inside without opening it; Save your time and protects your privacy; Convenient for your travel and life Must-have for Travel & Daily Use: These shoe bags for travel can protect your items against scuffs and dirt, help you pack luggage conveniently and quickly, and keep your shoes well organized and dust-free; Making your trip and daily convenient and neat â€º See more product details",
    "shortDescription": "Perfect travel organization for your next trip.",
    "image": "https://m.media-amazon.com/images/I/616K24V+mkL._AC_SL1500_.jpg",
    "price": 5.99,
    "affiliateUrl": "https://www.amazon.com/COIDEA-Drawstring-Waterproof-Dustproof-Portable/dp/B0C6X2VP9R?th=1&psc=1&language=en_US&currency=USD",
    "category": "organization",
    "tags": [
      "organization",
      "travel",
      "waterproof",
      "reusable"
    ],
    "budgetTier": "budget",
    "rating": 4.5,
    "reviewCount": 4337,
    "weatherConditions": [
      "rainy",
      "desert"
    ],
    "tripTypes": [
      "business",
      "luxury",
      "adventure"
    ],
    "activities": [
      "hiking"
    ]
  },
  {
    "id": "B0DNTLFHZK",
    "name": "Secret Clinical Strength Antiperspirant Deodorant for Women, 3X Stress Protection, 72hr Sweat & Odor Protection, PH Balancing Minerals, Invisible Solid, Completely Clean Scent, 0.5 oz",
    "description": "Secret Clinical Strength Antiperspirant and Deodorant for Women is clinically proven protection for 3 types of sweat; 1) stress sweat, 2) heat sweat and 3) activity sweat. This invisible solid gives you 72-hour sweat and odor protection, you can confidently go about your day, knowing you're safeguarded against sweat and odor, no matter the circumstance",
    "shortDescription": "Secret Clinical Strength Antiperspirant and Deodorant for Women is clinically proven protection for 3 types of sweat; 1) stress sweat, 2) heat sweat and 3) activity sweat.",
    "image": "https://m.media-amazon.com/images/I/71Q3c5-B0PL._SL1500_.jpg",
    "price": 2.76,
    "affiliateUrl": "https://www.amazon.com/Secret-Antiperspirant-Deodorant-Protection-Completely/dp/B0DNTLFHZK?th=1&psc=1&language=en_US&currency=USD",
    "category": "toiletries",
    "tags": [
      "toiletries"
    ],
    "budgetTier": "budget",
    "rating": 4.6,
    "reviewCount": 1001,
    "weatherConditions": [
      "tropical"
    ]
  },
  {
    "id": "B00AL14WES",
    "name": "Plackers Micro Mint Dental Flossers, Travel Pack, Perfect Travel Size, Easy Storage, Dental Care On-The-Go, Fresh Mint Flavor, 12 Count",
    "description": "You've got smiles for miles. Keep it looking fresh with Plackers Micro Mint Flossers. Easily remove food particles with smooth Super Tufffloss, engineered not to stretch, shred or break and with a built-in fold-out toothpick that folds away after use. The easy grip handle provides more control and comfort while cleaning between your teeth and gums. Rely on Plackers to Get the Gunk Out. Enjoy fresh breath with delicious mint flavor that leaves your mouth with a fresh clean feeling. These flossers come in convenient, on-the-go packs and are perfect for travel. Includes 12 mint dental flossers. Smile Like Everyone's Watching!",
    "shortDescription": "You've got smiles for miles.",
    "image": "https://m.media-amazon.com/images/I/71IVNlezlUL._AC_SL1500_.jpg",
    "price": 3.37,
    "affiliateUrl": "https://www.amazon.com/Plackers-Micro-Dental-Floss-Travel/dp/B00AL14WES?th=1&psc=1&language=en_US&currency=USD",
    "category": "clothing",
    "tags": [
      "clothing",
      "travel"
    ],
    "budgetTier": "budget",
    "rating": 4.7,
    "reviewCount": 23986
  },
  {
    "id": "B07H45NFBF",
    "name": "Wet Brush Mini Detangler Hair Brush, Pink, Detangling Travel Hairbrush, Ultra-Soft IntelliFlex Bristles Glide Through Tangles with Ease, Pain-Free, All Hair Types",
    "description": "Meet The Mini Detangler An on-the-go brush that helps hair stay strong and healthy! The Mini Detangler gently loosens knots, on wet or dry hair, without pulling or snagging. The moment you use it, you'll feel the difference, and never want to try another hairbrush again.",
    "shortDescription": "Meet The Mini Detangler An on-the-go brush that helps hair stay strong and healthy.",
    "image": "https://m.media-amazon.com/images/I/715wdpFqSPL._SL1500_.jpg",
    "price": 4.99,
    "affiliateUrl": "https://www.amazon.com/Wet-Brush-Detangler-pink-mini/dp/B07H45NFBF?th=1&psc=1&language=en_US&currency=USD",
    "category": "clothing",
    "tags": [
      "clothing",
      "travel"
    ],
    "budgetTier": "budget",
    "rating": 4.8,
    "reviewCount": 14466,
    "weatherConditions": [
      "rainy",
      "desert"
    ]
  },
  {
    "id": "B013FEIAVS",
    "name": "L'OCCITANE Cleansing & Softening Almond Shower Oil, Body Wash & Shaving Base Purifies & Smooths Without Drying Skin, Milky Lather, Nourishing Skincare",
    "description": "L'OCCITANE Cleansing & Softening Almond Shower Oil, Body Wash & Shaving Base Purifies & Smooths Without Drying Skin, Milky Lather, Nourishing Skincare",
    "shortDescription": "Perfect travel toiletries for your next trip.",
    "image": "https://m.media-amazon.com/images/I/419Tiq5IWUL._SL1200_.jpg",
    "price": 12,
    "affiliateUrl": "https://www.amazon.com/LOccitane-Cleansing-Softening-Almond-Shower/dp/B013FEIAVS?th=1&psc=1&language=en_US&currency=USD",
    "category": "toiletries",
    "tags": [
      "toiletries"
    ],
    "budgetTier": "budget",
    "rating": 4.4,
    "reviewCount": 15480,
    "weatherConditions": [
      "desert"
    ]
  },
  {
    "id": "B01M9F9JYH",
    "name": "Garnier Micellar Cleansing Water, All-in-1 Makeup Remover and Facial Cleanser, For All Skin Types, 3.4 Fl Oz (100mL), 1 Count (Packaging May Vary)",
    "description": "This All-in-1 Micellar Cleansing Water is surprisingly powerful yet gentle to skin. It effectively removes makeup, cleanses and refreshes skin. A multi-purpose cleanser that contains Micellar technology. Like a magnet, micelles capture and lift away dirt, oil and makeup without harsh rubbing, leaving skin perfectly clean, hydrated and refreshed without over-drying. â€¢ All-in-1 cleanser and makeup remover cleanses, removes makeup and refreshes skin â€¢ Oil-Free, Alcohol-Free, Fragrance-Free â€¢ Micelle Technology attracts dirt, oil and makeup like a magnet without harsh rubbing â€¢ All skin types, even sensitive TO REMOVE EYE MAKEUP: Hold pad over closed eyes for a few seconds, then gently wipe without harsh rubbing. TO CLEAN SKIN & REMOVE FACE MAKEUP: Gently wipe all over until skin is completely clean from makeup and impurities. Use daily, AM/PM. No need to rinse. Avoid contact with eyes. If contact occurs, rinse thoroughly with water.",
    "shortDescription": "This All-in-1 Micellar Cleansing Water is surprisingly powerful yet gentle to skin.",
    "image": "https://m.media-amazon.com/images/I/71oehMQkl4L._SL1500_.jpg",
    "price": 3.82,
    "affiliateUrl": "https://www.amazon.com/Garnier-SkinActive-Micellar-Cleansing-Water/dp/B01M9F9JYH?th=1&psc=1&language=en_US&currency=USD",
    "category": "toiletries",
    "tags": [
      "toiletries"
    ],
    "budgetTier": "budget",
    "rating": 4.7,
    "reviewCount": 70045,
    "weatherConditions": [
      "cold",
      "desert"
    ]
  },
  {
    "id": "B007BF7BUY",
    "name": "Dramamine Motion Sickness Less Drowsy, Travel Vial, Multicolor, 8 Count",
    "description": "Dramamine All Day Less Drowsy Motion Sickness Relief prevents and treats motion sickness, nausea, vomiting and dizziness for up to 24 hours. The tablets come in a convenient, safety Travel Vial for anytime motion sickness symptoms strike. Get less drowsy relief from motion sickness when you need it most from the number 1 pharmacist-recommended brand!* Wherever your adventure takes you, Dramamine is a vacation essential in your travel medicine bag. Don't let motion sickness affect your plans on your next cruise, theme park, visit or road trip. Dramamine fits with your other travel size toiletries and travel must haves. If you know you are going on an adventure that is likely to cause motion sickness and nausea, take Dramamine Less Drowsy BEFORE the trek. Also, be sure to drink plenty of water and avoid alcohol, which can increase dehydration and nausea. Take Dramamine and Take Control. For adults and children 6 and older. See packaging for dosing instructions and warnings. *Named by Pharmacy Times and U.S. News & World Report as number 1 Pharmacist-Recommended Brand for 2022 Motion Sickness Remedies Category.",
    "shortDescription": "Dramamine All Day Less Drowsy Motion Sickness Relief prevents and treats motion sickness, nausea, vomiting and dizziness for up to 24 hours.",
    "image": "https://m.media-amazon.com/images/I/71zyl5Ql0UL._AC_SL1500_.jpg",
    "price": 2.99,
    "affiliateUrl": "https://www.amazon.com/Dramamine-Motion-Sickness-Drowsey-Formula/dp/B007BF7BUY?th=1&psc=1&language=en_US&currency=USD",
    "category": "safety",
    "tags": [
      "safety",
      "travel"
    ],
    "budgetTier": "budget",
    "rating": 4.8,
    "reviewCount": 24638,
    "tripTypes": [
      "family",
      "adventure"
    ]
  },
  {
    "id": "B0B3SCM1L6",
    "name": "Tower 28 SOS Daily Rescue Facial Spray for Sensitive Skin, Hypochlorous Acid Spray Helps Visibly Reduce the Appearance of Redness and Breakouts, Travel Size Toner for Face, 1 FL Oz",
    "description": "About this item THE ORIGINAL HYPOCHLOROUS ACID FACIAL SPRAY: This formula, known as Tower 28 SOS Facial Spray, is backed by clinical research and dermatologist testing, helping reduce the appearance of breakouts, calm visible irritation, and soothe redness PURE + pH BALANCED: Our original, proprietary formula is 4.5 pH-balanced and designed for daily useâ€”even on sensitive skin. This daily skincare mist delivers HOCL in a skin-friendly form, with a one-step application that fits easily into any routine RESULTS YOU CAN NOTICE OVER TIME: In clinical research, the spray was shown to help reduce visible redness and support clearer-looking skin with consistent use TRUSTED FORMULA: Backed by 10+ years of research in skin care â€“ this hypochlorous acid spray is recognized by three leading U.S. skin health organizations: the National Eczema Association (NEA), American Rosacea Society (ARS), and National Psoriasis Foundation (NPF). Formulated specifically for facial use to deliver effective results with minimal irritation. Dermatologist-tested, non-toxic, vegan & cruelty-free EASY-TO-USE MIST: Use after cleansing instead of toner, over makeup to refresh, post-workout, post-sun, or on blemish-prone areas. Lightweight, no-sting, residue-free, fragrance-free. Great for travel & gym bags â€º See more product details",
    "shortDescription": "Perfect travel toiletries for your next trip.",
    "image": "https://m.media-amazon.com/images/I/61UbAbIiJeL._SL1500_.jpg",
    "price": 12,
    "affiliateUrl": "https://www.amazon.com/Tower-28-Beauty-Rescue-Facial/dp/B0B3SCM1L6?th=1&psc=1&language=en_US&currency=USD",
    "category": "toiletries",
    "tags": [
      "toiletries",
      "travel",
      "lightweight"
    ],
    "budgetTier": "budget",
    "rating": 4.5,
    "reviewCount": 3866,
    "weatherConditions": [
      "tropical",
      "cold"
    ],
    "tripTypes": [
      "business"
    ],
    "activities": [
      "camping"
    ]
  }
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all products
 */
export function getAllProducts(): Product[] {
  return PRODUCTS;
}

/**
 * Get product by ID
 */
export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id);
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter(p => p.category === category);
}

/**
 * Get products by budget tier
 */
export function getProductsByBudgetTier(tier: 'budget' | 'mid-range' | 'premium'): Product[] {
  return PRODUCTS.filter(p => p.budgetTier === tier);
}

/**
 * Search products by query
 */
export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  return PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get products by price range
 */
export function getProductsByPriceRange(min: number, max: number): Product[] {
  return PRODUCTS.filter(p => p.price >= min && p.price <= max);
}

/**
 * Get top rated products
 */
export function getTopRatedProducts(limit: number = 10): Product[] {
  return PRODUCTS
    .filter(p => p.rating)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
}

/**
 * Get products with most reviews
 */
export function getMostReviewedProducts(limit: number = 10): Product[] {
  return PRODUCTS
    .filter(p => p.reviewCount)
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, limit);
}

/**
 * Get products by weather conditions
 */
export function getProductsForWeather(weatherCondition: string): Product[] {
  return PRODUCTS.filter(p =>
    p.weatherConditions?.some(wc => wc.toLowerCase() === weatherCondition.toLowerCase())
  );
}

/**
 * Get products by activity
 */
export function getProductsForActivity(activity: string): Product[] {
  return PRODUCTS.filter(p =>
    p.activities?.some(a => a.toLowerCase() === activity.toLowerCase())
  );
}

/**
 * Get products by destination
 */
export function getProductsForDestination(destination: string): Product[] {
  return PRODUCTS.filter(p =>
    p.destinations?.some(d => d.toLowerCase().includes(destination.toLowerCase()))
  );
}
