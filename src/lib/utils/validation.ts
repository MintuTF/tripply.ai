import type { Card } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TimeSlotConflict {
  cardId: string;
  cardName: string;
  timeSlot: string;
  duration: number;
}

// ============================================================================
// Time Utilities
// ============================================================================

/**
 * Parse time string (HH:MM) to minutes since midnight
 * @param time - Time in HH:MM format (24-hour)
 * @returns Minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

/**
 * Format minutes since midnight to HH:MM
 * @param minutes - Minutes since midnight
 * @returns Time in HH:MM format
 */
export function formatMinutesToTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Format time to 12-hour format with AM/PM
 * @param time24 - Time in HH:MM format (24-hour)
 * @returns Time in 12-hour format with AM/PM
 */
export function formatTime12Hour(time24: string): string {
  const [hour, minute] = time24.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate time slot format (HH:MM in 24-hour format)
 * @param timeSlot - Time slot string
 * @returns True if valid
 */
export function isValidTimeFormat(timeSlot: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeSlot);
}

/**
 * Validate day number (must be between 1 and 365)
 * @param day - Day number
 * @returns True if valid
 */
export function isValidDay(day: number): boolean {
  return day >= 1 && day <= 365;
}

/**
 * Check if two time ranges overlap
 * @param start1 - Start time of first range (minutes)
 * @param end1 - End time of first range (minutes)
 * @param start2 - Start time of second range (minutes)
 * @param end2 - End time of second range (minutes)
 * @returns True if ranges overlap
 */
export function timeRangesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Find time slot conflicts for a card
 * @param card - Card to check
 * @param allCards - All cards in the trip
 * @returns Array of conflicting cards
 */
export function findTimeSlotConflicts(
  card: Card,
  allCards: Card[]
): TimeSlotConflict[] {
  if (!card.day || !card.time_slot) {
    return [];
  }

  const cardStart = parseTimeToMinutes(card.time_slot);
  const cardDuration = (card.payload_json as any).duration || 60; // Default 60 minutes
  const cardEnd = cardStart + cardDuration;

  const conflicts: TimeSlotConflict[] = [];

  // Find other cards on the same day
  const dayCards = allCards.filter(c => c.day === card.day && c.id !== card.id);

  for (const otherCard of dayCards) {
    if (!otherCard.time_slot) continue;

    const otherStart = parseTimeToMinutes(otherCard.time_slot);
    const otherDuration = (otherCard.payload_json as any).duration || 60;
    const otherEnd = otherStart + otherDuration;

    // Check for overlap
    if (timeRangesOverlap(cardStart, cardEnd, otherStart, otherEnd)) {
      conflicts.push({
        cardId: otherCard.id,
        cardName: (otherCard.payload_json as any).name || 'Untitled',
        timeSlot: otherCard.time_slot,
        duration: otherDuration,
      });
    }
  }

  return conflicts;
}

/**
 * Validate a card update
 * @param card - Original card
 * @param updates - Proposed updates
 * @param allCards - All cards in the trip
 * @returns Validation result with errors and warnings
 */
export function validateCardUpdate(
  card: Card,
  updates: Partial<Card>,
  allCards: Card[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Create merged card for validation
  const mergedCard = { ...card, ...updates };

  // Validate day range
  if (updates.day !== undefined && updates.day !== null) {
    if (!isValidDay(updates.day)) {
      errors.push('Day must be between 1 and 365');
    }
  }

  // Validate time slot format
  if (updates.time_slot !== undefined && updates.time_slot !== null) {
    if (!isValidTimeFormat(updates.time_slot)) {
      errors.push('Time must be in HH:MM format (24-hour)');
    }
  }

  // Validate order (must be non-negative)
  if (updates.order !== undefined && updates.order !== null) {
    if (updates.order < 0) {
      errors.push('Order must be a non-negative number');
    }
  }

  // Check for time slot conflicts
  if (mergedCard.day && mergedCard.time_slot && isValidTimeFormat(mergedCard.time_slot)) {
    // Create temporary cards array with the update applied
    const tempCards = allCards.map(c => (c.id === card.id ? mergedCard : c));
    const conflicts = findTimeSlotConflicts(mergedCard, tempCards);

    if (conflicts.length > 0) {
      const conflictNames = conflicts.map(c => c.cardName).join(', ');
      warnings.push(
        `This time overlaps with: ${conflictNames}. You may want to adjust the schedule.`
      );
    }
  }

  // Validate duration (if present)
  const duration = (mergedCard.payload_json as any)?.duration;
  if (duration !== undefined && duration !== null) {
    if (duration <= 0) {
      errors.push('Duration must be greater than 0 minutes');
    }
    if (duration > 1440) {
      warnings.push('Duration exceeds 24 hours. This may span multiple days.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate multiple card updates (batch validation)
 * @param updates - Array of {card, updates} pairs
 * @param allCards - All cards in the trip
 * @returns Map of card IDs to validation results
 */
export function validateBatchUpdates(
  updates: Array<{ card: Card; updates: Partial<Card> }>,
  allCards: Card[]
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();

  // Apply all updates to create temporary cards array
  const tempCards = allCards.map(card => {
    const update = updates.find(u => u.card.id === card.id);
    return update ? { ...card, ...update.updates } : card;
  });

  // Validate each update
  for (const { card, updates: cardUpdates } of updates) {
    const result = validateCardUpdate(card, cardUpdates, tempCards);
    results.set(card.id, result);
  }

  return results;
}

// ============================================================================
// Day Statistics
// ============================================================================

export interface DayStats {
  totalActivities: number;
  scheduledActivities: number;
  unscheduledActivities: number;
  totalDuration: number; // minutes
  totalCost: number;
  hasConflicts: boolean;
  conflictCount: number;
  startTime: string | null; // HH:MM
  endTime: string | null; // HH:MM
}

/**
 * Calculate statistics for a specific day
 * @param dayNumber - Day number
 * @param allCards - All cards in the trip
 * @returns Day statistics
 */
export function calculateDayStats(dayNumber: number, allCards: Card[]): DayStats {
  const dayCards = allCards.filter(c => c.day === dayNumber);

  let scheduledActivities = 0;
  let totalDuration = 0;
  let totalCost = 0;
  let conflictCount = 0;
  let startTime: number | null = null;
  let endTime: number | null = null;

  for (const card of dayCards) {
    const payload = card.payload_json as any;

    // Count scheduled activities
    if (card.time_slot) {
      scheduledActivities++;

      // Track earliest and latest times
      const timeMinutes = parseTimeToMinutes(card.time_slot);
      const duration = payload.duration || 60;
      const endMinutes = timeMinutes + duration;

      if (startTime === null || timeMinutes < startTime) {
        startTime = timeMinutes;
      }
      if (endTime === null || endMinutes > endTime) {
        endTime = endMinutes;
      }

      // Check for conflicts
      const conflicts = findTimeSlotConflicts(card, allCards);
      if (conflicts.length > 0) {
        conflictCount++;
      }
    }

    // Sum duration
    if (payload.duration) {
      totalDuration += payload.duration;
    }

    // Sum cost
    if (payload.price || payload.cost) {
      totalCost += payload.price || payload.cost || 0;
    }
  }

  return {
    totalActivities: dayCards.length,
    scheduledActivities,
    unscheduledActivities: dayCards.length - scheduledActivities,
    totalDuration,
    totalCost,
    hasConflicts: conflictCount > 0,
    conflictCount,
    startTime: startTime !== null ? formatMinutesToTime(startTime) : null,
    endTime: endTime !== null ? formatMinutesToTime(endTime) : null,
  };
}

/**
 * Format duration in minutes to human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "2h 30m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}
