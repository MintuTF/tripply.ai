import { Card, Trip, CardType, HotelCard, SpotCard, FoodCard, ActivityCard } from '@/types';
import {
  StoryData,
  TripSummary,
  DayPlan,
  PlaceItem,
  TripStats,
  CategoryCount,
  MapMarker,
} from '@/types/story';
import { addDays, format, differenceInDays } from 'date-fns';

/**
 * Prepares all data needed for story video generation
 * Processes trip and cards into a format optimized for Remotion rendering
 */
export async function prepareStoryData(trip: Trip, cards: Card[]): Promise<Omit<StoryData, 'captions' | 'mapSnapshots'>> {
  // Filter to only confirmed cards
  const confirmedCards = cards.filter((c) => c.labels?.includes('confirmed'));

  // Group by day and sort
  const days = groupCardsByDay(confirmedCards, trip);

  // Extract trip summary
  const tripSummary = extractTripSummary(trip, confirmedCards);

  // Calculate stats
  const stats = calculateTripStats(trip, confirmedCards, days);

  return {
    trip: tripSummary,
    days,
    stats,
  };
}

/**
 * Groups confirmed cards by day and sorts them by time slot
 * If no cards have day assignments, groups all cards into a single "Highlights" day
 */
export function groupCardsByDay(cards: Card[], trip: Trip): DayPlan[] {
  const startDate = new Date(trip.dates.start);
  const endDate = new Date(trip.dates.end);
  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Check if any cards have day assignments
  const cardsWithDays = cards.filter((c) => c.day !== undefined && c.day !== null && c.day > 0);
  const cardsWithoutDays = cards.filter((c) => c.day === undefined || c.day === null || c.day === 0);

  // If no cards have day assignments, create a single "Highlights" day with all cards
  if (cardsWithDays.length === 0 && cardsWithoutDays.length > 0) {
    const sortedCards = [...cardsWithoutDays].sort((a, b) => {
      // Sort by type priority, then by order
      const typePriority: Record<CardType, number> = {
        hotel: 1,
        spot: 2,
        activity: 3,
        food: 4,
        note: 5,
      };
      const priorityDiff = (typePriority[a.type] || 5) - (typePriority[b.type] || 5);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.order || 0) - (b.order || 0);
    });

    const places: PlaceItem[] = sortedCards.map((card) => cardToPlaceItem(card));

    return [
      {
        dayIndex: 1,
        date: format(startDate, 'yyyy-MM-dd'),
        places,
      },
    ];
  }

  // Create day plans for each day of the trip
  const dayPlans: DayPlan[] = [];

  for (let dayIndex = 1; dayIndex <= totalDays; dayIndex++) {
    const dayDate = addDays(startDate, dayIndex - 1);
    const dayCards = cards
      .filter((c) => c.day === dayIndex)
      .sort((a, b) => {
        // Sort by time_slot first, then by order
        if (a.time_slot && b.time_slot) {
          return a.time_slot.localeCompare(b.time_slot);
        }
        if (a.time_slot) return -1;
        if (b.time_slot) return 1;
        return (a.order || 0) - (b.order || 0);
      });

    // Convert cards to place items
    const places: PlaceItem[] = dayCards.map((card) => cardToPlaceItem(card));

    if (places.length > 0) {
      dayPlans.push({
        dayIndex,
        date: format(dayDate, 'yyyy-MM-dd'),
        places,
      });
    }
  }

  // If we have some cards with days but also unassigned cards, add unassigned to a "Bonus" day
  if (dayPlans.length > 0 && cardsWithoutDays.length > 0) {
    const sortedUnassigned = [...cardsWithoutDays].sort((a, b) => (a.order || 0) - (b.order || 0));
    const bonusPlaces: PlaceItem[] = sortedUnassigned.map((card) => cardToPlaceItem(card));

    dayPlans.push({
      dayIndex: dayPlans.length + 1,
      date: format(addDays(startDate, dayPlans.length), 'yyyy-MM-dd'),
      places: bonusPlaces,
    });
  }

  return dayPlans;
}

/**
 * Converts a Card to a PlaceItem for story display
 */
function cardToPlaceItem(card: Card): PlaceItem {
  const payload = card.payload_json as HotelCard | SpotCard | FoodCard | ActivityCard;

  return {
    id: card.id,
    name: payload.name || 'Untitled',
    type: card.type,
    timeSlot: card.time_slot,
    coordinates: payload.coordinates,
    photo: payload.photos?.[0],
    address: payload.address,
    rating: payload.rating,
  };
}

/**
 * Extracts trip summary information
 */
function extractTripSummary(trip: Trip, cards: Card[]): TripSummary {
  // Determine destination from trip or first confirmed card
  const destination = trip.destination?.name || getDestinationFromCards(cards);

  // Get cover image from first confirmed card with a photo
  const coverImage = getCoverImageFromCards(cards);

  // Calculate party size
  const partySize =
    (trip.party_json.adults || 0) +
    (trip.party_json.children || 0) +
    (trip.party_json.infants || 0);

  return {
    id: trip.id,
    title: trip.title,
    destination,
    startDate: trip.dates.start,
    endDate: trip.dates.end,
    coverImage,
    partySize: partySize || 1,
  };
}

/**
 * Derives destination from card locations
 */
function getDestinationFromCards(cards: Card[]): string {
  // Try to extract city from first card's address
  for (const card of cards) {
    const payload = card.payload_json as HotelCard | SpotCard | FoodCard | ActivityCard;
    if (payload.address) {
      // Extract city from address (simplified - takes second to last part)
      const parts = payload.address.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        return parts[parts.length - 2]; // Usually the city
      }
    }
  }
  return 'Your Trip';
}

/**
 * Gets the best cover image from confirmed cards
 */
function getCoverImageFromCards(cards: Card[]): string | undefined {
  // Prioritize spots and activities over hotels/food for cover image
  const priorityOrder: CardType[] = ['spot', 'activity', 'food', 'hotel'];

  for (const type of priorityOrder) {
    const card = cards.find((c) => c.type === type);
    if (card) {
      const payload = card.payload_json as HotelCard | SpotCard | FoodCard | ActivityCard;
      if (payload.photos?.[0]) {
        return payload.photos[0];
      }
    }
  }

  // Fallback to any card with a photo
  for (const card of cards) {
    const payload = card.payload_json as HotelCard | SpotCard | FoodCard | ActivityCard;
    if (payload.photos?.[0]) {
      return payload.photos[0];
    }
  }

  return undefined;
}

/**
 * Calculates trip statistics for story display
 */
function calculateTripStats(trip: Trip, cards: Card[], days: DayPlan[]): TripStats {
  const startDate = new Date(trip.dates.start);
  const endDate = new Date(trip.dates.end);
  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Count places by category
  const categoryMap = new Map<CardType, number>();
  cards.forEach((card) => {
    const count = categoryMap.get(card.type) || 0;
    categoryMap.set(card.type, count + 1);
  });

  // Create category counts with icons
  const categories: CategoryCount[] = [];
  const iconMap: Record<CardType, string> = {
    hotel: '🏨',
    spot: '📍',
    food: '🍽️',
    activity: '⭐',
    note: '📝',
  };

  categoryMap.forEach((count, type) => {
    if (type !== 'note' && count > 0) {
      categories.push({
        type,
        count,
        icon: iconMap[type],
      });
    }
  });

  // Sort categories by count
  categories.sort((a, b) => b.count - a.count);

  // Extract unique cities
  const cities = extractUniqueCities(cards);

  return {
    totalDays,
    totalPlaces: cards.filter((c) => c.type !== 'note').length,
    cities,
    categories,
  };
}

/**
 * Extracts unique city names from card addresses
 */
function extractUniqueCities(cards: Card[]): string[] {
  const cities = new Set<string>();

  cards.forEach((card) => {
    const payload = card.payload_json as HotelCard | SpotCard | FoodCard | ActivityCard;
    if (payload.address) {
      const parts = payload.address.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        cities.add(parts[parts.length - 2]);
      }
    }
  });

  return Array.from(cities);
}

/**
 * Extracts map markers from day plans
 */
export function extractMapMarkers(days: DayPlan[]): MapMarker[] {
  const markers: MapMarker[] = [];

  days.forEach((day) => {
    day.places.forEach((place, index) => {
      if (place.coordinates) {
        markers.push({
          lat: place.coordinates.lat,
          lng: place.coordinates.lng,
          label: place.name,
          type: place.type,
          order: index + 1,
        });
      }
    });
  });

  return markers;
}

/**
 * Extracts markers for a specific day
 */
export function extractDayMarkers(day: DayPlan): MapMarker[] {
  return day.places
    .filter((place) => place.coordinates)
    .map((place, index) => ({
      lat: place.coordinates!.lat,
      lng: place.coordinates!.lng,
      label: place.name,
      type: place.type,
      order: index + 1,
    }));
}

/**
 * Calculates video duration in frames based on story data
 */
export function calculateVideoDuration(
  days: DayPlan[],
  fps: number = 30,
  options: {
    introSeconds?: number;
    mapOverviewSeconds?: number;
    dayHeaderSeconds?: number;
    placeSeconds?: number;
    outroSeconds?: number;
  } = {}
): number {
  const {
    introSeconds = 3,
    mapOverviewSeconds = 4,
    dayHeaderSeconds = 2,
    placeSeconds = 2,
    outroSeconds = 2,
  } = options;

  let totalSeconds = introSeconds + mapOverviewSeconds + outroSeconds;

  // Add time for each day
  days.forEach((day) => {
    totalSeconds += dayHeaderSeconds;
    totalSeconds += day.places.length * placeSeconds;
  });

  return Math.ceil(totalSeconds * fps);
}

/**
 * Formats duration for display (e.g., "30 sec")
 */
export function formatDuration(frames: number, fps: number = 30): string {
  const seconds = Math.round(frames / fps);
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}
