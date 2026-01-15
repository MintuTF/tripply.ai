/**
 * Itinerary Schema Types
 *
 * Structured data format for AI-generated itineraries.
 * This JSON is parsed from AI responses and used by the app
 * to display and manage trip plans.
 */

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
export type TripPace = 'relaxed' | 'moderate' | 'active';
export type ItemType = 'activity' | 'restaurant' | 'hotel' | 'transport' | 'break';

/**
 * Summary of the entire trip plan
 */
export interface TripSummary {
  destination: string;
  days: number;
  travelerType?: string;
  pace: TripPace;
  focus: string[];
}

/**
 * A single item in the itinerary (place to visit, meal, etc.)
 */
export interface ItineraryItem {
  type: ItemType;
  placeId?: string;
  name: string;
  timeSlot: TimeSlot;
  startTime?: string; // "09:00" format
  durationMinutes: number;
  why: string[];
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  isFlexible?: boolean;
}

/**
 * A single day in the itinerary
 */
export interface ItineraryDay {
  day: number;
  date?: string; // ISO date if known
  theme: string;
  whyThisDayWorks: string[];
  items: ItineraryItem[];
  notes?: string;
}

/**
 * Complete itinerary output from AI
 */
export interface ItineraryOutput {
  tripSummary: TripSummary;
  days: ItineraryDay[];
  generalTips?: string[];
}

/**
 * Parse itinerary JSON from AI response
 * Returns null if no valid JSON found
 */
export function parseItineraryFromResponse(response: string): ItineraryOutput | null {
  try {
    // Look for JSON block in the response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);

    if (!jsonMatch) {
      // Try to find raw JSON object
      const rawJsonMatch = response.match(/\{[\s\S]*"tripSummary"[\s\S]*"days"[\s\S]*\}/);
      if (!rawJsonMatch) {
        return null;
      }
      return JSON.parse(rawJsonMatch[0]) as ItineraryOutput;
    }

    const parsed = JSON.parse(jsonMatch[1]) as ItineraryOutput;

    // Validate required fields
    if (!parsed.tripSummary || !parsed.days || !Array.isArray(parsed.days)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse itinerary JSON:', error);
    return null;
  }
}

/**
 * Validate an itinerary structure
 */
export function validateItinerary(itinerary: ItineraryOutput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check trip summary
  if (!itinerary.tripSummary.destination) {
    errors.push('Missing destination');
  }
  if (!itinerary.tripSummary.days || itinerary.tripSummary.days < 1) {
    errors.push('Invalid number of days');
  }

  // Check days
  if (!itinerary.days.length) {
    errors.push('No days in itinerary');
  }

  for (const day of itinerary.days) {
    if (!day.theme) {
      errors.push(`Day ${day.day} missing theme`);
    }
    if (!day.items || !day.items.length) {
      errors.push(`Day ${day.day} has no items`);
    }

    for (const item of day.items || []) {
      if (!item.name) {
        errors.push(`Day ${day.day} has item without name`);
      }
      if (!item.why || !item.why.length) {
        errors.push(`Day ${day.day}, ${item.name} missing WHY`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get time slot display text
 */
export function getTimeSlotLabel(slot: TimeSlot): string {
  const labels: Record<TimeSlot, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
  };
  return labels[slot];
}

/**
 * Get estimated time range for a slot
 */
export function getTimeSlotRange(slot: TimeSlot): string {
  const ranges: Record<TimeSlot, string> = {
    morning: '8:00 AM - 12:00 PM',
    afternoon: '12:00 PM - 5:00 PM',
    evening: '5:00 PM - 9:00 PM',
    night: '9:00 PM onwards',
  };
  return ranges[slot];
}

/**
 * Calculate total duration for a day
 */
export function getDayTotalMinutes(day: ItineraryDay): number {
  return day.items.reduce((total, item) => total + (item.durationMinutes || 0), 0);
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Merge a modification into an existing itinerary
 */
export function mergeItineraryUpdate(
  existing: ItineraryOutput,
  update: Partial<ItineraryOutput>
): ItineraryOutput {
  return {
    tripSummary: {
      ...existing.tripSummary,
      ...update.tripSummary,
    },
    days: update.days
      ? update.days.map((updateDay, idx) => ({
          ...existing.days[idx],
          ...updateDay,
          items: updateDay.items || existing.days[idx]?.items || [],
        }))
      : existing.days,
    generalTips: update.generalTips || existing.generalTips,
  };
}
