/**
 * Trip Context Utilities for Marketplace
 * Helpers for parsing and formatting trip context data
 */

import { TripContextSummary, TripType } from '@/types/marketplace';
import { Trip } from '@/types';

/**
 * Derive season from trip dates
 */
export function deriveSeasonFromDates(dates: { start: string; end: string }): string {
  if (!dates.start) return 'Year-round';

  const startDate = new Date(dates.start);
  const month = startDate.getMonth(); // 0-11

  // Northern hemisphere seasons
  if (month === 11 || month === 0 || month === 1) return 'Winter';
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';

  return 'Year-round';
}

/**
 * Format travelers text from trip party data
 */
export function formatTravelersText(party: any): string {
  if (!party) return 'Solo';

  const adults = party.adults || 0;
  const children = party.children || 0;
  const infants = party.infants || 0;

  // Solo traveler
  if (adults === 1 && children === 0 && infants === 0) {
    return 'Solo';
  }

  // Couple
  if (adults === 2 && children === 0 && infants === 0) {
    return 'Couple';
  }

  // Family with children
  if (children > 0 || infants > 0) {
    const totalKids = children + infants;
    if (totalKids === 1) {
      return `Family with 1 kid`;
    }
    return `Family with ${totalKids} kids`;
  }

  // Group of adults
  if (adults > 2) {
    return `Group of ${adults}`;
  }

  // Default
  return `${adults} traveler${adults > 1 ? 's' : ''}`;
}

/**
 * Get duration in days from trip dates
 */
export function getDurationInDays(dates: { start: string; end: string }): number {
  if (!dates.start || !dates.end) return 0;

  const startDate = new Date(dates.start);
  const endDate = new Date(dates.end);

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Infer trip type from party composition and duration
 */
export function inferTripType(party: any, duration: number): TripType {
  const adults = party?.adults || 0;
  const children = party?.children || 0;
  const infants = party?.infants || 0;

  // Family trip
  if (children > 0 || infants > 0) {
    return 'family';
  }

  // Solo trip
  if (adults === 1) {
    return 'solo';
  }

  // Couple trip
  if (adults === 2 && duration >= 3) {
    return 'couple';
  }

  // Business trip (short duration, solo/small group)
  if (duration <= 3 && adults <= 2) {
    return 'business';
  }

  // Adventure trip (longer duration)
  if (duration >= 7) {
    return 'adventure';
  }

  // Default to couple for 2 people, adventure for groups
  if (adults === 2) return 'couple';
  return 'adventure';
}

/**
 * Get complete trip context summary from Trip object
 */
export function getTripContextSummary(trip: Trip | null | undefined): TripContextSummary | null {
  if (!trip) return null;

  // Extract destination name
  const destination = trip.destination?.name || trip.title || 'Unknown';

  // Extract duration
  const duration = trip.dates
    ? getDurationInDays(trip.dates)
    : 0;

  // Extract travelers text
  const travelers = formatTravelersText(trip.party_json);

  // Extract season
  const season = trip.dates
    ? deriveSeasonFromDates(trip.dates)
    : 'Year-round';

  // Infer trip type
  const tripType = inferTripType(trip.party_json, duration);

  return {
    destination,
    duration,
    travelers,
    season,
    tripType,
  };
}

/**
 * Format duration for display (e.g., "2 Days", "1 Week")
 */
export function formatDuration(days: number): string {
  if (days === 0) return 'Not set';
  if (days === 1) return '1 Day';
  if (days <= 6) return `${days} Days`;
  if (days === 7) return '1 Week';
  if (days <= 13) return `${days} Days`;
  if (days === 14) return '2 Weeks';
  if (days <= 20) return `${days} Days`;

  const weeks = Math.floor(days / 7);
  return `${weeks} Week${weeks > 1 ? 's' : ''}`;
}

/**
 * Generate display text for trip context bar
 * Example: "Tokyo · 2 Days · Couple · Winter"
 */
export function generateTripContextDisplayText(summary: TripContextSummary | null): string {
  if (!summary) return 'Select a trip to get personalized recommendations';

  const parts: string[] = [];

  // Destination
  parts.push(summary.destination);

  // Duration
  if (summary.duration > 0) {
    parts.push(formatDuration(summary.duration));
  }

  // Travelers
  if (summary.travelers) {
    parts.push(summary.travelers);
  }

  // Season
  if (summary.season && summary.season !== 'Year-round') {
    parts.push(summary.season);
  }

  return parts.join(' · ');
}

/**
 * Check if trip has enough context for recommendations
 */
export function hasSufficientTripContext(trip: Trip | null | undefined): boolean {
  if (!trip) return false;

  // At minimum, we need a destination
  return !!(trip.destination?.name || trip.title);
}
