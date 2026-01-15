/**
 * URL Utility Functions for Travel Routes
 *
 * Transform city names to URL-friendly slugs and back.
 * Example: "Tokyo, Japan" → "tokyo-japan" → { city: "Tokyo", country: "Japan" }
 */

export type TravelTab = 'explore' | 'chat' | 'board' | 'shop';

const VALID_TABS: TravelTab[] = ['explore', 'chat', 'board', 'shop'];

/**
 * Generate a URL-friendly slug from city and country
 * "Tokyo" + "Japan" → "tokyo-japan"
 * "New York" + "USA" → "new-york-usa"
 */
export function generateCitySlug(city: string, country: string): string {
  const combined = `${city} ${country}`;
  return combined
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Parse a city slug back to city and country
 * "tokyo-japan" → { city: "Tokyo", country: "Japan" }
 *
 * Note: This is a best-effort parse since we lose information in slug generation.
 * The city name is typically the first part, country is the last part.
 */
export function parseCitySlug(slug: string): { city: string; country: string } | null {
  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const parts = slug.split('-');
  if (parts.length < 2) {
    // Single word - treat as city only
    return {
      city: capitalizeWords(slug),
      country: '',
    };
  }

  // For multi-word slugs, assume last part is country
  // and everything else is the city name
  const country = parts.pop()!;
  const city = parts.join(' ');

  return {
    city: capitalizeWords(city),
    country: capitalizeWords(country),
  };
}

/**
 * Capitalize first letter of each word
 */
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Build a travel URL for a specific city and tab
 * @param citySlug - URL-friendly city slug (e.g., "tokyo-japan")
 * @param tab - The tab to navigate to
 * @param tripId - Optional trip ID to include
 */
export function buildTravelUrl(
  citySlug: string,
  tab: TravelTab = 'explore',
  tripId?: string
): string {
  const basePath = `/travel/${citySlug}/${tab}`;
  if (tripId) {
    return `${basePath}?trip=${encodeURIComponent(tripId)}`;
  }
  return basePath;
}

/**
 * Build a travel URL from city and country names
 */
export function buildTravelUrlFromCity(
  city: string,
  country: string,
  tab: TravelTab = 'explore',
  tripId?: string
): string {
  const slug = generateCitySlug(city, country);
  return buildTravelUrl(slug, tab, tripId);
}

/**
 * Parse a destination string into city and country
 * "Tokyo, Japan" → { city: "Tokyo", country: "Japan" }
 * "Paris" → { city: "Paris", country: "" }
 */
export function parseDestination(destination: string): { city: string; country: string } {
  const parts = destination.split(',').map(p => p.trim());
  return {
    city: parts[0] || '',
    country: parts[1] || '',
  };
}

/**
 * Generate a slug from a full destination string
 * "Tokyo, Japan" → "tokyo-japan"
 */
export function generateSlugFromDestination(destination: string): string {
  const { city, country } = parseDestination(destination);
  return generateCitySlug(city, country);
}

/**
 * Check if a tab name is valid
 */
export function isValidTab(tab: string): tab is TravelTab {
  return VALID_TABS.includes(tab as TravelTab);
}

/**
 * Get the default tab
 */
export function getDefaultTab(): TravelTab {
  return 'explore';
}

/**
 * Format city and country for display
 * { city: "Tokyo", country: "Japan" } → "Tokyo, Japan"
 */
export function formatDestination(city: string, country: string): string {
  if (!country) return city;
  return `${city}, ${country}`;
}
