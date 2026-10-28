import type { ItineraryDayItem, ItineraryResponse, PlaceCard } from '@/types';
import type { TravelPlace } from './types';

export type BoardCardType = 'hotel' | 'spot' | 'food' | 'activity';

export interface PlannedStop {
  place: TravelPlace;
  cardType: BoardCardType;
  day: number;
  time_slot: string;
  order: number;
}

export function placeCardToTravelPlace(place: PlaceCard): TravelPlace {
  return {
    id: place.place_id || place.id,
    name: place.name,
    imageUrl: place.photos?.[0] || '',
    categories: [place.type],
    rating: place.rating || 0,
    reviewCount: place.review_count || 0,
    popularityScore: place.rating || 0,
    description: place.description || '',
    coordinates: place.location || place.coordinates || { lat: 0, lng: 0 },
    address: place.vicinity || place.address,
    priceLevel: place.price_level,
  };
}

const SLOT_START_MINUTES: Record<ItineraryDayItem['timeSlot'], number> = {
  morning: 9 * 60,
  afternoon: 14 * 60,
  evening: 19 * 60,
  night: 21 * 60 + 30,
};

const CARD_TYPE: Record<string, BoardCardType | undefined> = {
  restaurant: 'food',
  hotel: 'hotel',
  activity: 'spot',
};

function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(the|a|an|de|da|do|das|dos|of|and|restaurant|cafe|hotel)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.split(' ').filter(Boolean));
  const tb = new Set(b.split(' ').filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  ta.forEach((t) => tb.has(t) && shared++);
  return shared / Math.min(ta.size, tb.size);
}

/** Find the real place (from the same chat request) that an itinerary stop refers to */
function matchPlace(stopName: string, cards: PlaceCard[]): PlaceCard | undefined {
  const target = normalize(stopName);
  if (target.length < 3) return undefined;

  let best: { card: PlaceCard; score: number } | undefined;
  for (const card of cards) {
    const candidate = normalize(card.name);
    if (!candidate) continue;

    let score = 0;
    if (candidate === target) score = 1;
    else if (
      Math.min(candidate.length, target.length) >= 5 &&
      (candidate.includes(target) || target.includes(candidate))
    ) {
      score = 0.9;
    } else {
      const overlap = tokenOverlap(candidate, target);
      if (overlap >= 0.75) score = overlap * 0.8;
    }
    if (score > 0 && (!best || score > best.score)) best = { card, score };
  }
  return best?.card;
}

function formatClock(totalMinutes: number): string {
  const m = Math.min(totalMinutes, 23 * 60 + 59);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/**
 * Turn an AI itinerary into Board cards: each stop that matches a real place gets that place's data
 * (coordinates, photos, rating) plus its day, a time and an order. Generic stops with no matching
 * place (e.g. "Check-in at your hotel", a neighbourhood walk) are returned in `skipped`.
 */
export function planItineraryStops(
  itinerary: ItineraryResponse,
  cards: PlaceCard[]
): { stops: PlannedStop[]; skipped: string[] } {
  const stops: PlannedStop[] = [];
  const skipped: string[] = [];

  for (const day of itinerary.days) {
    let order = 0;
    const nextFree: Partial<Record<ItineraryDayItem['timeSlot'], number>> = {};
    const usedToday = new Set<string>();

    for (const item of day.items) {
      const cardType = CARD_TYPE[item.type];
      const card = cardType ? matchPlace(item.name, cards) : undefined;
      if (!cardType || !card || usedToday.has(card.id)) {
        if (cardType) skipped.push(item.name);
        continue;
      }
      usedToday.add(card.id);

      // Stack stops inside the same part of the day one after another
      const start = nextFree[item.timeSlot] ?? SLOT_START_MINUTES[item.timeSlot] ?? SLOT_START_MINUTES.morning;
      nextFree[item.timeSlot] = start + (item.durationMinutes || 60) + 15;

      stops.push({
        place: placeCardToTravelPlace(card),
        cardType,
        day: day.day,
        time_slot: formatClock(start),
        order: ++order,
      });
    }
  }

  return { stops, skipped };
}
