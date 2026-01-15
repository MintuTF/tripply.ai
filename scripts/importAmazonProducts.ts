/**
 * Import Amazon Products from TSV
 * Parses the TSV file and returns structured Amazon product data
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

export interface AmazonProduct {
  title: string;
  seller_name: string;
  brand: string;
  description: string;
  initial_price: string;
  currency: string;
  availability: string;
  reviews_count: string;
  categories: string;
  parent_asin: string;
  asin: string;
  buybox_seller: string;
  number_of_sellers: string;
  root_bs_rank: string;
  ISBN10: string;
  answered_questions: string;
  domain: string;
  product_link: string;
  images_count: string;
  url: string;
  video_count: string;
  image_url: string;
  item_weight: string;
  rating: string;
  product_dimensions: string;
  seller_id: string;
  image: string;
  date_first_available: string;
  discount: string;
  model_number: string;
  manufacturer: string;
  department: string;
  plus_content: string;
  upc: string;
  video: string;
  top_review: string;
  final_price_high: string;
  final_price: string;
  variations: string;
  delivery: string;
  features: string;
  format: string;
  buybox_prices: string;
  input_asin: string;
  ingredients: string;
  origin_url: string;
  bought_past_month: string;
  is_available: string;
  root_bs_category: string;
  bs_category: string;
  bs_rank: string;
  badge: string;
  subcategory_rank: string;
  amazon_choice: string;
  images: string;
  product_details: string;
  prices_breakdown: string;
  country_of_origin: string;
  from_the_brand: string;
  product_description: string;
  seller_url: string;
  customer_says: string;
  sustainability_features: string;
  climate_pledge_friendly: string;
  videos: string;
  other_sellers_prices: string;
  downloadable_videos: string;
  editorial_reviews: string;
  about_the_author: string;
  zipcode: string;
  coupon: string;
  sponsered: string;
  store_url: string;
  ships_from: string;
  city: string;
  customers_say: string;
  max_quantity_available: string;
  variations_values: string;
  language: string;
  return_policy: string;
  inactive_buy_box: string;
  buybox_seller_rating: string;
  premium_brand: string;
  amazon_prime: string;
  coupon_description: string;
  all_badges: string;
  sponsored: string;
  timestamp: string;
  input_url: string;
  input_origin_url: string;
  error: string;
  error_code: string;
  warning: string;
  warning_code: string;
  discovery_input: string;
}

const TSV_FILE = path.join(__dirname, '..', 'data', 'amazon-products-raw.tsv');

export function parseAmazonData(): AmazonProduct[] {
  console.log('📂 Reading TSV file...');

  if (!fs.existsSync(TSV_FILE)) {
    throw new Error(`TSV file not found: ${TSV_FILE}`);
  }

  const content = fs.readFileSync(TSV_FILE, 'utf-8');

  console.log('🔍 Parsing TSV data...');

  // Parse TSV (tab-separated)
  const records = parse(content, {
    delimiter: '\t',
    columns: true, // Use first row as headers
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true, // Handle rows with different column counts
  }) as AmazonProduct[];

  console.log(`✅ Parsed ${records.length} products`);

  return records;
}

export function validateAmazonProducts(products: AmazonProduct[]): {
  valid: AmazonProduct[];
  invalid: { product: AmazonProduct; reasons: string[] }[];
} {
  const valid: AmazonProduct[] = [];
  const invalid: { product: AmazonProduct; reasons: string[] }[] = [];

  products.forEach((product, index) => {
    const reasons: string[] = [];

    // Check required fields
    if (!product.asin || product.asin.trim() === '') {
      reasons.push('Missing ASIN');
    }
    if (!product.title || product.title.trim() === '') {
      reasons.push('Missing title');
    }
    if (!product.final_price || product.final_price.trim() === '') {
      reasons.push('Missing final_price');
    }
    if (!product.url || product.url.trim() === '') {
      reasons.push('Missing URL');
    }
    if (!product.image_url || product.image_url.trim() === '') {
      reasons.push('Missing image_url');
    }

    if (reasons.length > 0) {
      invalid.push({ product, reasons });
    } else {
      valid.push(product);
    }
  });

  if (invalid.length > 0) {
    console.warn(`⚠️  ${invalid.length} invalid products found:`);
    invalid.forEach(({ product, reasons }, idx) => {
      console.warn(`  ${idx + 1}. ASIN: ${product.asin || 'N/A'} - ${reasons.join(', ')}`);
    });
  }

  return { valid, invalid };
}
