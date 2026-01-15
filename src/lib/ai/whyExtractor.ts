/**
 * Why Extractor - Extract "why" information from AI markdown response
 *
 * Parses AI-generated markdown to extract contextual "why" information
 * for each recommended place and enriches card data with it.
 */

import type { PlaceCard } from '@/types';
import type { PlaceWithWhy } from '@/components/chat/PlaceCardGroup';

/**
 * Extracted "why" information for a single place
 */
export interface ExtractedWhy {
  name: string;
  whyTags: string[];
  whyBullets: string[];
  location?: string;
}

/**
 * Extract "why" information from AI markdown response
 *
 * Expected format:
 * #### Place Name
 * - 💕 Romantic traditional atmosphere
 * - 🎬 Famous "Kill Bill" restaurant
 * - 📍 Nishi-Azabu
 */
export function extractWhyFromMarkdown(markdown: string): ExtractedWhy[] {
  if (!markdown?.trim()) return [];

  const results: ExtractedWhy[] = [];

  // Split by #### headers (place entries)
  const placeBlocks = markdown.split(/####\s+/).slice(1);

  for (const block of placeBlocks) {
    const lines = block.trim().split('\n');
    if (lines.length === 0) continue;

    // First line is the place name
    const name = lines[0].trim();
    if (!name) continue;

    const whyTags: string[] = [];
    const whyBullets: string[] = [];
    let location: string | undefined;

    // Parse bullet points
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Stop if we hit another section or empty content
      if (line.startsWith('#') || line.startsWith('---')) break;
      if (!line.startsWith('-') && !line.startsWith('•')) continue;

      // Remove bullet marker
      const bulletContent = line.replace(/^[-•]\s*/, '').trim();
      if (!bulletContent) continue;

      // Extract emoji and text
      const { emoji, text } = parseEmojiText(bulletContent);

      // Check if this is a location bullet
      if (emoji === '📍') {
        location = text;
        continue;
      }

      // Add to whyBullets (the full text)
      if (text) {
        whyBullets.push(text);

        // Extract a short tag from the first word or phrase
        const tag = extractTag(text, emoji);
        if (tag && !whyTags.includes(tag)) {
          whyTags.push(tag);
        }
      }
    }

    // Only add if we found meaningful content
    if (whyBullets.length > 0 || location) {
      results.push({
        name,
        whyTags: whyTags.slice(0, 3), // Max 3 tags
        whyBullets: whyBullets.slice(0, 3), // Max 3 bullets
        location,
      });
    }
  }

  return results;
}

/**
 * Parse emoji and text from a bullet content
 */
function parseEmojiText(content: string): { emoji: string; text: string } {
  // Match emoji at start followed by text
  const match = content.match(/^(\p{Emoji}+)\s*(.+)$/u);
  if (match) {
    return {
      emoji: match[1],
      text: match[2].trim(),
    };
  }

  // No emoji found
  return {
    emoji: '',
    text: content.trim(),
  };
}

/**
 * Extract a short tag from bullet text
 */
function extractTag(text: string, emoji: string): string {
  // Common emoji-to-tag mappings
  const emojiTags: Record<string, string> = {
    '💕': 'Romantic',
    '❤️': 'Romantic',
    '✨': 'Special',
    '🌟': 'Popular',
    '⭐': 'Top Rated',
    '💰': 'Great Value',
    '🎉': 'Fun',
    '🔒': 'Hidden Gem',
    '👨‍👩‍👧‍👦': 'Family-friendly',
    '🎬': 'Famous',
    '🍗': 'Great Food',
    '🍣': 'Japanese',
    '🌙': 'Nightlife',
    '☕': 'Cozy',
    '🏨': 'Stay',
    '🎯': 'Must-do',
  };

  // Check for emoji-based tag
  if (emoji && emojiTags[emoji]) {
    return emojiTags[emoji];
  }

  // Extract first meaningful word/phrase from text
  const words = text.split(/\s+/);
  const firstWord = words[0]?.replace(/[^a-zA-Z]/g, '');

  // Common descriptive words to use as tags
  const tagWords = [
    'Romantic', 'Famous', 'Popular', 'Hidden', 'Local', 'Traditional',
    'Modern', 'Classic', 'Authentic', 'Stunning', 'Beautiful', 'Cozy',
    'Budget', 'Luxury', 'Premium', 'Best', 'Top', 'Great', 'Perfect',
  ];

  for (const word of words.slice(0, 3)) {
    const cleaned = word.replace(/[^a-zA-Z]/g, '');
    if (tagWords.some(t => t.toLowerCase() === cleaned.toLowerCase())) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    }
  }

  // Fallback: use first word if it's a reasonable length
  if (firstWord && firstWord.length >= 4 && firstWord.length <= 12) {
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }

  return '';
}

/**
 * Normalize a place name for matching
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * Check if two place names match (fuzzy)
 */
function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);

  // Exact match
  if (n1 === n2) return true;

  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Check if significant words overlap
  const words1 = n1.split(' ').filter(w => w.length > 2);
  const words2 = n2.split(' ').filter(w => w.length > 2);

  const matchingWords = words1.filter(w => words2.includes(w));
  return matchingWords.length >= Math.min(2, Math.min(words1.length, words2.length));
}

/**
 * Enrich cards with extracted "why" information
 */
export function enrichCardsWithWhy(
  cards: PlaceCard[],
  extracted: ExtractedWhy[]
): PlaceWithWhy[] {
  if (!cards?.length) return [];
  if (!extracted?.length) {
    // Return cards as PlaceWithWhy without enrichment
    return cards.map(card => ({ ...card }));
  }

  return cards.map(card => {
    // Find matching extracted why by name
    const match = extracted.find(e => namesMatch(e.name, card.name));

    if (match) {
      return {
        ...card,
        whyTags: match.whyTags.length > 0 ? match.whyTags : card.whyTags,
        whyBullets: match.whyBullets.length > 0 ? match.whyBullets : card.whyBullets,
      };
    }

    return { ...card };
  });
}

/**
 * Debug: Log extraction results
 */
export function debugExtraction(markdown: string): void {
  console.log('=== Why Extraction Debug ===');
  const results = extractWhyFromMarkdown(markdown);
  console.log('Extracted places:', results.length);
  results.forEach((r, i) => {
    console.log(`\n[${i + 1}] ${r.name}`);
    console.log('  Tags:', r.whyTags);
    console.log('  Bullets:', r.whyBullets);
    console.log('  Location:', r.location);
  });
}
