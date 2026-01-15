import type { Trip, Card, Message, PlaceCard } from '@/types';
import { format, differenceInDays } from 'date-fns';

/**
 * Generates a markdown representation of a trip with all details
 */
export function generateTripMarkdown(
  trip: Trip,
  cards: Card[] = [],
  messages: Message[] = [],
  aiCards: PlaceCard[] = []
): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${trip.title}\n`);

  // Trip Overview
  sections.push(`## Trip Overview\n`);

  if (trip.destination?.name) {
    sections.push(`**Destination:** ${trip.destination.name}\n`);
  }

  const startDate = new Date(trip.dates.start);
  const endDate = new Date(trip.dates.end);
  const duration = differenceInDays(endDate, startDate) + 1;

  sections.push(`**Dates:** ${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`);
  sections.push(`**Duration:** ${duration} day${duration > 1 ? 's' : ''}\n`);

  if (trip.party_json) {
    const { adults, children, infants } = trip.party_json;
    const partySize = (adults || 0) + (children || 0) + (infants || 0);
    sections.push(`**Party Size:** ${partySize} (${adults || 0} adult${adults !== 1 ? 's' : ''}${children ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}${infants ? `, ${infants} infant${infants !== 1 ? 's' : ''}` : ''})\n`);
  }

  if (trip.budget_range && trip.budget_range[0] > 0) {
    sections.push(`**Budget Range:** $${trip.budget_range[0].toLocaleString()} - $${trip.budget_range[1].toLocaleString()}\n`);
  }

  sections.push(`**Status:** ${trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}\n`);

  // Day-by-Day Itinerary
  if (cards.length > 0) {
    sections.push(`\n---\n`);
    sections.push(`## Day-by-Day Itinerary\n`);

    const cardsByDay = cards
      .filter(c => c.day && c.day > 0)
      .sort((a, b) => {
        if (a.day !== b.day) return (a.day || 0) - (b.day || 0);
        return (a.order || 0) - (b.order || 0);
      })
      .reduce((acc, card) => {
        const day = card.day || 1;
        if (!acc[day]) acc[day] = [];
        acc[day].push(card);
        return acc;
      }, {} as Record<number, Card[]>);

    Object.entries(cardsByDay).forEach(([dayNum, dayCards]) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + parseInt(dayNum) - 1);

      sections.push(`\n### Day ${dayNum} - ${format(dayDate, 'EEEE, MMMM d')}\n`);

      dayCards.forEach((card, index) => {
        const payload = card.payload_json as any;
        const type = card.type;

        sections.push(`\n#### ${index + 1}. ${payload.name || 'Untitled'}`);

        // Type badge
        sections.push(`*${type.charAt(0).toUpperCase() + type.slice(1)}*\n`);

        // Time slot
        if (card.time_slot) {
          sections.push(`**Time:** ${card.time_slot}\n`);
        }

        // Address
        if (payload.address) {
          sections.push(`**Location:** ${payload.address}\n`);
        }

        // Rating
        if (payload.rating) {
          sections.push(`**Rating:** ⭐ ${payload.rating.toFixed(1)}/5\n`);
        }

        // Type-specific details
        if (type === 'hotel') {
          if (payload.price_range) {
            sections.push(`**Price Range:** $${payload.price_range[0]} - $${payload.price_range[1]} per night\n`);
          }
          if (payload.amenities && payload.amenities.length > 0) {
            sections.push(`**Amenities:** ${payload.amenities.join(', ')}\n`);
          }
          if (payload.cost) {
            sections.push(`**Booked Cost:** $${payload.cost}${payload.currency ? ` ${payload.currency}` : ''}\n`);
          }
        } else if (type === 'food') {
          if (payload.cuisine_type) {
            sections.push(`**Cuisine:** ${payload.cuisine_type}\n`);
          }
          if (payload.price_level) {
            sections.push(`**Price Level:** ${'$'.repeat(payload.price_level)}\n`);
          }
          if (payload.cost) {
            sections.push(`**Estimated Cost:** $${payload.cost}${payload.currency ? ` ${payload.currency}` : ''}\n`);
          }
        } else if (type === 'activity') {
          if (payload.duration) {
            sections.push(`**Duration:** ${payload.duration}\n`);
          }
          if (payload.price || payload.cost) {
            sections.push(`**Cost:** $${payload.cost || payload.price}${payload.currency ? ` ${payload.currency}` : ''}\n`);
          }
        } else if (type === 'spot') {
          if (payload.type) {
            sections.push(`**Type:** ${payload.type}\n`);
          }
          if (payload.opening_hours) {
            sections.push(`**Hours:** ${payload.opening_hours}\n`);
          }
          if (payload.cost) {
            sections.push(`**Admission:** $${payload.cost}${payload.currency ? ` ${payload.currency}` : ''}\n`);
          }
        } else if (type === 'note') {
          if (payload.content) {
            sections.push(`\n${payload.content}\n`);
          }
        }

        // Description
        if (payload.description) {
          sections.push(`\n${payload.description}\n`);
        }

        // URL
        if (payload.url) {
          sections.push(`\n[View on Map/Website](${payload.url})\n`);
        }

        // Travel info to next stop
        if (card.travel_info && index < dayCards.length - 1) {
          const { distance, duration: travelDuration, mode } = card.travel_info;
          sections.push(`\n*Travel to next stop: ${distance.toFixed(1)}km, ${travelDuration} min by ${mode}*\n`);
        }
      });
    });
  }

  // Saved Places (unassigned)
  const unassignedCards = cards.filter(c => !c.day || c.day === 0);
  if (unassignedCards.length > 0) {
    sections.push(`\n---\n`);
    sections.push(`## Saved Places (Unassigned)\n`);

    unassignedCards.forEach(card => {
      const payload = card.payload_json as any;
      sections.push(`\n### ${payload.name || 'Untitled'}`);
      sections.push(`*${card.type.charAt(0).toUpperCase() + card.type.slice(1)}*\n`);

      if (payload.address) {
        sections.push(`**Location:** ${payload.address}\n`);
      }
      if (payload.rating) {
        sections.push(`**Rating:** ⭐ ${payload.rating.toFixed(1)}/5\n`);
      }
      if (payload.description) {
        sections.push(`\n${payload.description}\n`);
      }
    });
  }

  // AI Research Results
  if (aiCards.length > 0) {
    sections.push(`\n---\n`);
    sections.push(`## AI Research Results\n`);
    sections.push(`*Places recommended by AI assistant*\n`);

    const cardsByType = aiCards.reduce((acc, card) => {
      if (!acc[card.type]) acc[card.type] = [];
      acc[card.type].push(card);
      return acc;
    }, {} as Record<string, PlaceCard[]>);

    Object.entries(cardsByType).forEach(([type, typeCards]) => {
      sections.push(`\n### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n`);

      typeCards.forEach(card => {
        sections.push(`\n#### ${card.name}`);

        if (card.rating) {
          sections.push(` ⭐ ${card.rating.toFixed(1)}`);
        }
        sections.push('\n');

        if (card.address) {
          sections.push(`**Location:** ${card.address}\n`);
        }

        if (card.price_per_night) {
          sections.push(`**Price:** $${card.price_per_night}/night\n`);
        } else if (card.price) {
          sections.push(`**Price:** $${card.price}\n`);
        } else if (card.price_level) {
          sections.push(`**Price Level:** ${'$'.repeat(card.price_level)}\n`);
        }

        if (card.cuisine_type) {
          sections.push(`**Cuisine:** ${card.cuisine_type}\n`);
        }

        if (card.duration) {
          sections.push(`**Duration:** ${card.duration}\n`);
        }

        if (card.description) {
          sections.push(`\n${card.description}\n`);
        }

        if (card.url) {
          sections.push(`\n[More Info](${card.url})\n`);
        }
      });
    });
  }

  // Conversation History
  if (messages.length > 0) {
    sections.push(`\n---\n`);
    sections.push(`## Conversation History\n`);
    sections.push(`*AI assistant conversation about this trip*\n`);

    messages.forEach(msg => {
      if (msg.role === 'user') {
        sections.push(`\n**You:** ${msg.text}\n`);
      } else if (msg.role === 'assistant') {
        sections.push(`\n**AI Assistant:**\n${msg.text}\n`);
      }
    });
  }

  // Footer
  sections.push(`\n---\n`);
  sections.push(`*Generated by Voyagr AI on ${format(new Date(), 'MMMM d, yyyy HH:mm')}*`);

  return sections.join('\n');
}

/**
 * Downloads the markdown content as a file
 */
export function downloadMarkdown(markdown: string, filename: string = 'trip-itinerary.md') {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies markdown content to clipboard
 */
export async function copyMarkdownToClipboard(markdown: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(markdown);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
