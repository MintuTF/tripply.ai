import type { DraftCard, DraftTrip } from './types';

/** Fired (same tab) whenever the persisted Board changes, so UI outside the travel provider can refresh */
export const BOARD_CHANGED_EVENT = 'tripply:board-changed';

const DRAFT_CARDS_KEY = 'voyagr_draft_cards';
const DRAFT_TRIP_KEY = 'voyagr_draft_trip';

export interface BoardSnapshot {
  trip: DraftTrip | null;
  cards: DraftCard[];
}

export function readBoardSnapshot(): BoardSnapshot {
  try {
    const cards = JSON.parse(localStorage.getItem(DRAFT_CARDS_KEY) || '[]');
    const trip = JSON.parse(localStorage.getItem(DRAFT_TRIP_KEY) || 'null');
    return { trip, cards: Array.isArray(cards) ? cards : [] };
  } catch {
    return { trip: null, cards: [] };
  }
}

export function notifyBoardChanged(): void {
  try {
    window.dispatchEvent(new Event(BOARD_CHANGED_EVENT));
  } catch {
    // non-browser environment
  }
}
