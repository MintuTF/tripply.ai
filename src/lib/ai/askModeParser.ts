/**
 * Ask Mode Markdown Parser
 *
 * Parses the strict markdown template from AI into structured UI data.
 *
 * Expected format:
 * ### 🤖 AI Insight
 * [One sentence]
 *
 * ---
 *
 * ### [emoji] [Category] ([count])
 *
 * #### [Place Name]
 * - [emoji] [highlight]
 * - 📍 [location]
 *
 * ---
 *
 * ### 💬 Want more?
 * - [suggestion 1]
 * - [suggestion 2]
 */

import type {
  ParsedAskModeResponse,
  AskModeInsight,
  AskModeSection,
  AskModePlace,
  AskModeHighlight,
  PlaceCard,
} from '@/types';

/**
 * Parse Ask mode markdown into structured data
 */
export function parseAskModeMarkdown(markdown: string): ParsedAskModeResponse {
  const result: ParsedAskModeResponse = {
    insight: null,
    sections: [],
    followUps: null,
  };

  if (!markdown?.trim()) {
    return result;
  }

  // Split by horizontal rule (---)
  const majorSections = markdown.split(/\n---\n/).map(s => s.trim());

  for (const section of majorSections) {
    // Check for AI Insight section
    const insightMatch = section.match(/###\s*🤖\s*AI Insight\s*\n+(.+)/i);
    if (insightMatch) {
      result.insight = { text: insightMatch[1].trim() };
      continue;
    }

    // Check for "Want more?" follow-up section
    const followUpMatch = section.match(/###\s*💬\s*Want more\??\s*\n+([\s\S]*)/i);
    if (followUpMatch) {
      const suggestions = parseFollowUpSuggestions(followUpMatch[1]);
      if (suggestions.length > 0) {
        result.followUps = { suggestions };
      }
      continue;
    }

    // Check for content sections (restaurants, activities, etc.)
    const contentSection = parseContentSection(section);
    if (contentSection) {
      result.sections.push(contentSection);
    }
  }

  return result;
}

/**
 * Parse a content section with places
 */
function parseContentSection(section: string): AskModeSection | null {
  // Match section header: ### [emoji] Title (count)
  const headerMatch = section.match(/###\s*(\p{Emoji}+)\s*(.+?)(?:\s*\((\d+)\))?\s*$/mu);
  if (!headerMatch) {
    return null;
  }

  const emoji = headerMatch[1];
  const title = headerMatch[2].trim();
  const count = headerMatch[3] ? parseInt(headerMatch[3], 10) : undefined;

  // Parse places (#### headers with bullets)
  const places = parsePlaces(section);

  // Skip if this looks like an insight or follow-up section
  if (title.toLowerCase().includes('insight') || title.toLowerCase().includes('want more')) {
    return null;
  }

  return {
    emoji,
    title,
    count,
    places,
  };
}

/**
 * Parse place entries from a section
 */
function parsePlaces(section: string): AskModePlace[] {
  const places: AskModePlace[] = [];

  // Split by #### headers
  const placeBlocks = section.split(/####\s+/).slice(1); // Skip first empty/header part

  for (const block of placeBlocks) {
    const lines = block.trim().split('\n');
    if (lines.length === 0) continue;

    const name = lines[0].trim();
    if (!name) continue;

    const highlights: AskModeHighlight[] = [];
    let location: string | undefined;

    // Parse bullet points
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('-')) continue;

      const bulletContent = line.slice(1).trim();
      const highlight = parseBulletHighlight(bulletContent);

      if (highlight) {
        // Check if this is a location bullet
        if (highlight.emoji === '📍') {
          location = highlight.text;
        } else {
          highlights.push(highlight);
        }
      }
    }

    places.push({
      name,
      highlights,
      location,
    });
  }

  return places;
}

/**
 * Parse a bullet point into emoji and text
 */
function parseBulletHighlight(content: string): AskModeHighlight | null {
  // Match emoji at start followed by text
  const match = content.match(/^(\p{Emoji}+)\s*(.+)$/u);
  if (match) {
    return {
      emoji: match[1],
      text: match[2].trim(),
    };
  }

  // No emoji found, use generic sparkle
  if (content.trim()) {
    return {
      emoji: '✨',
      text: content.trim(),
    };
  }

  return null;
}

/**
 * Parse follow-up suggestions from bullets
 */
function parseFollowUpSuggestions(content: string): string[] {
  const suggestions: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-')) {
      const suggestion = trimmed.slice(1).trim();
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
  }

  return suggestions;
}

/**
 * Merge parsed places with enriched card data from API
 */
export function mergePlacesWithCards(
  sections: AskModeSection[],
  cards?: PlaceCard[]
): AskModeSection[] {
  if (!cards?.length) {
    return sections;
  }

  // Create lookup map by normalized name
  const cardsByName = new Map<string, PlaceCard>();
  for (const card of cards) {
    cardsByName.set(normalizeName(card.name), card);
  }

  return sections.map(section => ({
    ...section,
    places: section.places.map(place => {
      const matchedCard = cardsByName.get(normalizeName(place.name));
      return {
        ...place,
        card: matchedCard,
      };
    }),
  }));
}

/**
 * Normalize place name for matching
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Check if parsed response has meaningful content
 */
export function hasValidAskModeContent(parsed: ParsedAskModeResponse): boolean {
  return (
    parsed.insight !== null ||
    parsed.sections.length > 0 ||
    parsed.followUps !== null
  );
}
