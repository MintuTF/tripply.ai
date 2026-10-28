/**
 * Build a key-free URL for a Google Places photo. Every photo goes through
 * /api/places/photo so the API key never reaches the browser and repeat views
 * are served from the CDN cache instead of billing a new Place Photo request.
 */
export function placePhotoUrl(photoReference: string, maxWidth = 800): string {
  return `/api/places/photo?ref=${encodeURIComponent(photoReference)}&maxwidth=${maxWidth}`;
}
