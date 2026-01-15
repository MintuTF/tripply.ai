'use client';

import { useState, useEffect } from 'react';
import { getDestinationTheme } from '@/lib/theming/destinationThemes';

// Cache for hero images (in-memory, persists across component mounts)
const imageCache = new Map<string, string>();

// Default fallback image for unknown destinations
const DEFAULT_HERO = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80';

interface UseHeroImageResult {
  imageUrl: string;
  isLoading: boolean;
  error: string | null;
}

export function useHeroImage(destinationName: string | undefined): UseHeroImageResult {
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_HERO);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!destinationName) {
      setImageUrl(DEFAULT_HERO);
      setIsLoading(false);
      return;
    }

    const normalizedName = destinationName.toLowerCase().trim();

    // Check cache first
    if (imageCache.has(normalizedName)) {
      setImageUrl(imageCache.get(normalizedName)!);
      setIsLoading(false);
      return;
    }

    // Get theme which has curated hero image
    const theme = getDestinationTheme(destinationName);

    if (theme.heroImage) {
      // Use curated image from theme
      imageCache.set(normalizedName, theme.heroImage);
      setImageUrl(theme.heroImage);
      setIsLoading(false);
      return;
    }

    // If no curated image, use default
    setImageUrl(DEFAULT_HERO);
    setIsLoading(false);
  }, [destinationName]);

  return { imageUrl, isLoading, error };
}

// Preload an image to ensure smooth display
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}
