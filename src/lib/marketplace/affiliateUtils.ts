/**
 * Affiliate link utilities for Amazon integration
 */

// Placeholder affiliate tag - replace with your actual Amazon Associates tag
export const AFFILIATE_TAG = 'trippiy-20';

/**
 * Generate an affiliate URL from an Amazon product URL
 */
export function generateAffiliateUrl(amazonUrl: string): string {
  try {
    const url = new URL(amazonUrl);
    url.searchParams.set('tag', AFFILIATE_TAG);
    return url.toString();
  } catch {
    // If URL parsing fails, append tag manually
    const separator = amazonUrl.includes('?') ? '&' : '?';
    return `${amazonUrl}${separator}tag=${AFFILIATE_TAG}`;
  }
}

/**
 * Generate a direct Amazon product URL from ASIN
 */
export function generateAmazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
}

/**
 * Extract ASIN from an Amazon URL
 */
export function extractAsin(amazonUrl: string): string | null {
  // Match patterns like /dp/ASIN, /gp/product/ASIN
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
  ];

  for (const pattern of patterns) {
    const match = amazonUrl.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Track click event for analytics (placeholder for future implementation)
 */
export function trackAffiliateClick(productId: string, productName: string): void {
  // TODO: Implement analytics tracking
  console.log(`Affiliate click: ${productId} - ${productName}`);
}
