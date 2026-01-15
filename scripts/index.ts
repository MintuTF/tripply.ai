#!/usr/bin/env tsx
/**
 * Main Import Script
 * Orchestrates the entire Amazon product import process
 */

import { parseAmazonData, validateAmazonProducts } from './importAmazonProducts';
import { transformProducts } from './transformAmazonProducts';
import { generateProductsFile } from './generateProductsFile';

async function main() {
  console.log('🚀 Starting Amazon Product Import Process');
  console.log('═'.repeat(70));

  try {
    // Step 1: Parse Amazon data from TSV
    console.log('\n📥 Step 1: Parsing Amazon data from TSV...');
    const amazonProducts = parseAmazonData();

    // Step 2: Validate Amazon products
    console.log('\n✅ Step 2: Validating Amazon products...');
    const { valid, invalid } = validateAmazonProducts(amazonProducts);

    if (invalid.length > 0) {
      console.warn(`\n⚠️  Warning: ${invalid.length} invalid products will be skipped`);
    }

    if (valid.length === 0) {
      throw new Error('No valid products found!');
    }

    console.log(`✅ ${valid.length} valid products ready for transformation`);

    // Step 3: Transform to Marketplace format
    console.log('\n🔄 Step 3: Transforming products to Marketplace format...');
    const marketplaceProducts = transformProducts(valid);

    // Step 4: Generate products.ts file
    console.log('\n📝 Step 4: Generating products.ts file...');
    generateProductsFile(marketplaceProducts);

    // Success!
    console.log('\n🎉 Import Complete!');
    console.log('═'.repeat(70));
    console.log('\n✅ Next Steps:');
    console.log('  1. Review the generated products.ts file');
    console.log('  2. Start the dev server: npm run dev');
    console.log('  3. Visit http://localhost:3001/marketplace');
    console.log('  4. Test filtering, search, and recommendations');
    console.log('\n💡 Backup saved at: src/lib/marketplace/products.backup.ts');
    console.log('');

  } catch (error) {
    console.error('\n❌ Import Failed!');
    console.error('═'.repeat(70));
    console.error(error);
    process.exit(1);
  }
}

// Run the import
main();
