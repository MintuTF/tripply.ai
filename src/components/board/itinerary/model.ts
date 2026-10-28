import type { Card } from '@/types';
import type { LatLng } from '@/lib/travel/routeTools';

/** Colour per day, shared by the map lines, pins and the list so they read as one thing */
export const DAY_COLORS = ['#7C3AED', '#0284C7', '#E11D48', '#D97706', '#059669', '#4F46E5', '#DB2777', '#0D9488'];
export const UNSCHEDULED_COLOR = '#64748B';

export const dayColor = (day: number) => (day <= 0 ? UNSCHEDULED_COLOR : DAY_COLORS[(day - 1) % DAY_COLORS.length]);

export const TYPE_LABEL: Record<string, string> = { hotel: 'Stay', food: 'Food & drink', spot: 'Sight', activity: 'Activity' };
const PLACE_TYPES = new Set(['hotel', 'spot', 'food', 'activity']);

export interface PlanStop {
  id: string;
  card: Card;
  name: string;
  type: string;
  typeLabel: string;
  coords?: LatLng;
  rating?: number;
  imageUrl?: string;
  address?: string;
  hours?: string;
  note?: string;
  time?: string;
  /** 0 = not scheduled to a day yet */
  day: number;
  order: number;
}

/** day number -> ordered stop ids (0 = unscheduled) */
export type Layout = Record<number, string[]>;

export interface AIPlanStop {
  id: string;
  time?: string;
  reason: string;
}
export interface AIPlan {
  summary: string;
  days: { day: number; theme: string; stops: AIPlanStop[] }[];
  warnings: string[];
}

// Card payloads are free-form JSON that differs per card type, so they are read loosely
/* eslint-disable @typescript-eslint/no-explicit-any */
export function readPayload(card: Card): Record<string, any> {
  try {
    return typeof card.payload_json === 'string' ? JSON.parse(card.payload_json) : (card.payload_json as any) || {};
  } catch {
    return {};
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function isConfirmed(card: Card): boolean {
  const labels = card.labels || [];
  return PLACE_TYPES.has(card.type) && (labels.includes('confirmed') || labels.includes('booked'));
}

export function isPlace(card: Card): boolean {
  return PLACE_TYPES.has(card.type);
}

function validCoords(c: unknown): c is LatLng {
  const o = c as { lat?: unknown; lng?: unknown } | undefined;
  return !!o && typeof o.lat === 'number' && typeof o.lng === 'number' && Number.isFinite(o.lat) && Number.isFinite(o.lng) && !(o.lat === 0 && o.lng === 0);
}

export function toStop(card: Card): PlanStop {
  const p = readPayload(card);
  const photo = Array.isArray(p.photos) && typeof p.photos[0] === 'string' ? p.photos[0] : typeof p.imageUrl === 'string' ? p.imageUrl : undefined;
  return {
    id: card.id,
    card,
    name: String(p.name || p.title || 'Untitled place'),
    type: card.type,
    typeLabel: TYPE_LABEL[card.type] || 'Place',
    coords: validCoords(p.coordinates) ? p.coordinates : validCoords(p.location) ? p.location : undefined,
    rating: typeof p.rating === 'number' && p.rating > 0 ? p.rating : undefined,
    imageUrl: photo,
    address: typeof p.address === 'string' ? p.address : undefined,
    hours: typeof p.opening_hours === 'string' ? p.opening_hours : undefined,
    note: typeof p.description === 'string' && p.description ? p.description : undefined,
    time: card.time_slot || undefined,
    day: card.day || 0,
    order: card.order ?? 0,
  };
}

export function buildLayout(stops: PlanStop[]): Layout {
  const layout: Layout = { 0: [] };
  stops
    .slice()
    .sort((a, b) => a.day - b.day || a.order - b.order)
    .forEach((s) => {
      (layout[s.day] ||= []).push(s.id);
    });
  return layout;
}

export function layoutFromPlan(plan: AIPlan): Layout {
  const layout: Layout = { 0: [] };
  plan.days.forEach((d) => {
    layout[d.day] = d.stops.map((s) => s.id);
  });
  return layout;
}

export function highestDay(layout: Layout): number {
  return Math.max(0, ...Object.keys(layout).map(Number).filter((d) => (layout[d] || []).length > 0));
}

export function formatClock(value?: string): string | undefined {
  const m = value?.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return undefined;
  const h = parseInt(m[1], 10);
  if (h > 23) return undefined;
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}

/**
 * Where a dragged stop should land, given what it was dropped on (a stop or an empty day area).
 * Returns the target day and the index inside that day's list once the stop has been taken out of its old spot.
 */
export function resolveDrop(layout: Layout, activeId: string, overId: string): { toDay: number; toIndex: number } | null {
  if (activeId === overId) return null;
  const dayOf = (id: string) => Object.keys(layout).map(Number).find((d) => (layout[d] || []).includes(id));
  if (overId.startsWith('day-')) {
    const toDay = parseInt(overId.slice(4), 10);
    if (Number.isNaN(toDay)) return null;
    const list = (layout[toDay] || []).filter((id) => id !== activeId);
    return { toDay, toIndex: list.length };
  }
  const toDay = dayOf(overId);
  if (toDay === undefined) return null;
  return { toDay, toIndex: (layout[toDay] || []).indexOf(overId) };
}

/** The layout after moving one stop to a day/position (the stop is removed from its old spot first) */
export function applyMove(layout: Layout, id: string, toDay: number, toIndex: number): Layout {
  const next: Layout = Object.fromEntries(Object.entries(layout).map(([d, ids]) => [d, ids.filter((x) => x !== id)]));
  const target = (next[toDay] ||= []);
  target.splice(Math.max(0, Math.min(toIndex, target.length)), 0, id);
  return next;
}
