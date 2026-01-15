/**
 * Convert Excel file to TSV format
 * Extracts Amazon product data from sample_product.xlsx
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const EXCEL_FILE = path.join(__dirname, '..', 'sample_product.xlsx');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'amazon-products-raw.tsv');

function convertExcelToTsv() {
  console.log('📊 Reading Excel file...');
  const workbook = XLSX.readFile(EXCEL_FILE);

  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  console.log(`📄 Processing sheet: ${sheetName}`);

  // Convert to TSV (tab-separated values)
  const tsv = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });

  // Ensure data directory exists
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Write TSV file
  fs.writeFileSync(OUTPUT_FILE, tsv, 'utf-8');

  console.log(`✅ TSV file created: ${OUTPUT_FILE}`);
  console.log(`📏 File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);

  // Count rows (excluding header)
  const rows = tsv.split('\n').filter(line => line.trim()).length - 1;
  console.log(`📦 Total products: ${rows}`);
}

try {
  convertExcelToTsv();
} catch (error) {
  console.error('❌ Error converting Excel to TSV:', error);
  process.exit(1);
}
