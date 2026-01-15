/**
 * Script to import products from Excel file to database
 * Run with: npx tsx scripts/import-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Map Amazon categories to system categories
function mapCategory(amazonCats: string | null): string {
  if (!amazonCats) return 'essentials';
  const cats = amazonCats.toLowerCase();

  if (['electronics', 'gadget', 'phone', 'charger', 'battery', 'cable'].some(x => cats.includes(x))) {
    return 'electronics';
  }
  if (['clothing', 'apparel', 'shirt', 'pants', 'jacket'].some(x => cats.includes(x))) {
    return 'clothing';
  }
  if (['beauty', 'personal care', 'skin', 'hair', 'toiletries', 'shower', 'soap', 'cream', 'spray'].some(x => cats.includes(x))) {
    return 'toiletries';
  }
  if (['safety', 'security', 'first aid', 'medicine', 'health', 'medical'].some(x => cats.includes(x))) {
    return 'safety';
  }
  if (['bag', 'luggage', 'organizer', 'packing', 'storage'].some(x => cats.includes(x))) {
    return 'organization';
  }
  if (['comfort', 'pillow', 'sleep', 'relaxation', 'neck'].some(x => cats.includes(x))) {
    return 'comfort';
  }
  if (['weather', 'rain', 'umbrella', 'coat'].some(x => cats.includes(x))) {
    return 'weather';
  }
  if (['sports', 'outdoor', 'hiking', 'camping', 'activity'].some(x => cats.includes(x))) {
    return 'activity';
  }
  return 'essentials';
}

// Determine budget tier based on price
function getBudgetTier(price: number | null): string {
  if (!price) return 'mid-range';
  if (price < 15) return 'budget';
  if (price < 50) return 'mid-range';
  return 'premium';
}

// Generate tags from product data
function generateTags(row: any): string[] {
  const tags: string[] = [];

  // Add brand
  if (row.brand) {
    tags.push(row.brand);
  }

  // Analyze title for common tags
  const title = (row.title || '').toLowerCase();
  if (title.includes('travel')) tags.push('travel-size');
  if (title.includes('mini') || title.includes('portable')) tags.push('portable');
  if (title.includes('tsa')) tags.push('TSA-approved');
  if (title.includes('waterproof')) tags.push('waterproof');
  if (title.includes('lightweight')) tags.push('lightweight');
  if (title.includes('compact')) tags.push('compact');

  return [...new Set(tags)]; // Remove duplicates
}

async function importProducts() {
  console.log('Reading Excel file...');

  const filePath = path.join(process.cwd(), 'sample_product (2).xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Found ${rows.length} products to import`);

  let imported = 0;
  let failed = 0;

  for (const row of rows as any[]) {
    try {
      // Get description from multiple sources
      let description = row.description || row.top_review || '';
      if (description && description.length > 2000) {
        description = description.substring(0, 2000);
      }

      // Get short description
      let shortDesc = row.customer_says || row.customers_say || '';
      if (typeof shortDesc === 'object') {
        shortDesc = shortDesc.text || '';
      }
      if (shortDesc && shortDesc.length > 200) {
        shortDesc = shortDesc.substring(0, 200);
      }

      const product = {
        name: (row.title || 'Unknown Product').substring(0, 255),
        description: description || null,
        short_description: shortDesc || null,
        image: row.image_url || row.image || null,
        price: parseFloat(row.final_price || row.initial_price || 0),
        affiliate_url: row.product_link || row.url || '',
        category: mapCategory(row.categories),
        tags: generateTags(row),
        rating: row.rating ? parseFloat(row.rating) : null,
        review_count: row.reviews_count ? parseInt(row.reviews_count) : 0,
        budget_tier: getBudgetTier(row.final_price),
        is_active: true,
      };

      // Insert into database
      const { error } = await supabase
        .from('products')
        .insert(product);

      if (error) {
        console.error(`Failed to insert "${product.name.substring(0, 50)}...":`, error.message);
        failed++;
      } else {
        console.log(`✓ Imported: ${product.name.substring(0, 50)}...`);
        imported++;
      }
    } catch (err) {
      console.error('Error processing row:', err);
      failed++;
    }
  }

  console.log(`\nImport complete!`);
  console.log(`Successfully imported: ${imported}`);
  console.log(`Failed: ${failed}`);
}

importProducts().catch(console.error);
