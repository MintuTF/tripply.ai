/**
 * Generate products.ts file from transformed Amazon products
 * Creates a TypeScript file with the PRODUCTS array
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Product } from '../src/types/marketplace';

const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'lib', 'marketplace', 'products.ts');
const BACKUP_FILE = path.join(__dirname, '..', 'src', 'lib', 'marketplace', 'products.backup.ts');

/**
 * Generate quality report for products
 */
export function generateQualityReport(products: Product[]): void {
  const report = {
    total: products.length,
    byCategory: {} as Record<string, number>,
    byBudget: {} as Record<string, number>,
    withRatings: products.filter(p => p.rating).length,
    withWeather: products.filter(p => p.weatherConditions?.length).length,
    withActivities: products.filter(p => p.activities?.length).length,
    withTripTypes: products.filter(p => p.tripTypes?.length).length,
    avgPrice: products.reduce((sum, p) => sum + p.price, 0) / products.length,
    avgRating: products.filter(p => p.rating).reduce((sum, p) => sum + (p.rating || 0), 0) /
               products.filter(p => p.rating).length,
    priceRange: {
      min: Math.min(...products.map(p => p.price)),
      max: Math.max(...products.map(p => p.price)),
    },
  };

  // Count by category
  products.forEach(p => {
    report.byCategory[p.category] = (report.byCategory[p.category] || 0) + 1;
  });

  // Count by budget tier
  products.forEach(p => {
    report.byBudget[p.budgetTier] = (report.byBudget[p.budgetTier] || 0) + 1;
  });

  console.log('\n📊 Product Quality Report:');
  console.log('═'.repeat(50));
  console.log(`Total Products: ${report.total}`);
  console.log(`\nBy Category:`);
  Object.entries(report.byCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
  console.log(`\nBy Budget Tier:`);
  Object.entries(report.byBudget).forEach(([tier, count]) => {
    console.log(`  ${tier}: ${count}`);
  });
  console.log(`\nMetadata Coverage:`);
  console.log(`  With Ratings: ${report.withRatings} (${((report.withRatings / report.total) * 100).toFixed(1)}%)`);
  console.log(`  With Weather: ${report.withWeather} (${((report.withWeather / report.total) * 100).toFixed(1)}%)`);
  console.log(`  With Activities: ${report.withActivities} (${((report.withActivities / report.total) * 100).toFixed(1)}%)`);
  console.log(`  With Trip Types: ${report.withTripTypes} (${((report.withTripTypes / report.total) * 100).toFixed(1)}%)`);
  console.log(`\nPricing:`);
  console.log(`  Average Price: $${report.avgPrice.toFixed(2)}`);
  console.log(`  Price Range: $${report.priceRange.min.toFixed(2)} - $${report.priceRange.max.toFixed(2)}`);
  console.log(`  Average Rating: ${report.avgRating.toFixed(2)} / 5.0`);
  console.log('═'.repeat(50));
}

/**
 * Validate products before generation
 */
export function validateProducts(products: Product[]): void {
  const errors: string[] = [];

  products.forEach((product, index) => {
    if (!product.id) errors.push(`Product ${index}: Missing ID`);
    if (!product.name) errors.push(`Product ${index}: Missing name`);
    if (!product.category) errors.push(`Product ${index}: Missing category`);
    if (!product.budgetTier) errors.push(`Product ${index}: Missing budgetTier`);
    if (product.price <= 0) errors.push(`Product ${index}: Invalid price ${product.price}`);
    if (!product.affiliateUrl) errors.push(`Product ${index}: Missing affiliateUrl`);
    if (!product.image) errors.push(`Product ${index}: Missing image`);
  });

  if (errors.length > 0) {
    console.error('❌ Validation errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    throw new Error(`${errors.length} validation errors found`);
  }

  console.log(`✅ Validated ${products.length} products successfully`);
}

/**
 * Backup existing products.ts file
 */
export function backupExistingProducts(): void {
  if (fs.existsSync(OUTPUT_FILE)) {
    console.log('💾 Backing up existing products.ts...');
    fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
    console.log(`✅ Backup created: ${BACKUP_FILE}`);
  }
}

/**
 * Generate the products.ts file content
 */
function generateFileContent(products: Product[]): string {
  return `/**
 * Real Amazon Products for Voyagr Marketplace
 * Auto-generated from Amazon product data
 * Last updated: ${new Date().toISOString()}
 * Total products: ${products.length}
 */

import type { Product, ProductCategory } from '@/types/marketplace';

export const PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};

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
`;
}

/**
 * Generate products.ts file
 */
export function generateProductsFile(products: Product[]): void {
  console.log('\n📝 Generating products.ts file...');

  // Validate products
  validateProducts(products);

  // Backup existing file
  backupExistingProducts();

  // Generate file content
  const content = generateFileContent(products);

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');

  console.log(`✅ Generated products.ts with ${products.length} products`);
  console.log(`📁 File: ${OUTPUT_FILE}`);
  console.log(`📏 Size: ${(content.length / 1024).toFixed(2)} KB`);

  // Generate quality report
  generateQualityReport(products);
}
