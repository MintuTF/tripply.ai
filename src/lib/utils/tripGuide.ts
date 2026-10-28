import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Card, CardSource, Trip } from '@/types';
import { renderStaticMap, type MapPoint, type MapRoute } from './staticMap';
import { fetchRoadRoute, type RoadRoute } from '@/lib/travel/routeTools';

// ---------------------------------------------------------------------------
// Page + design system (A4 portrait, millimetres)
// ---------------------------------------------------------------------------
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 9;
const BOTTOM_LIMIT = PAGE_H - 20;

const INK = '#0F172A';
const BODY = '#334155';
const MUTED = '#64748B';
const FAINT = '#94A3B8';
const RULE = '#E2E8F0';
const SOFT = '#F8FAFC';
const BRAND = '#6D28D9';
const LINK = '#2563EB';
const GOOD = '#15803D';
const IDEAS_COLOR = '#475569';
const DAY_COLORS = ['#7C3AED', '#0284C7', '#E11D48', '#D97706', '#059669', '#4F46E5', '#DB2777', '#0D9488'];

const PLACE_TYPES = new Set(['hotel', 'spot', 'food', 'activity']);
const TYPE_ORDER: Record<string, number> = { hotel: 0, food: 1, spot: 2, activity: 3 };
const TYPE_LABEL: Record<string, string> = { hotel: 'Stay', food: 'Food & drink', spot: 'Sight', activity: 'Activity' };

type RGB = [number, number, number];
type LatLng = { lat: number; lng: number };

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** A light tint of a colour (for pill backgrounds) */
function tint(hex: string, amount = 0.88): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** The built-in PDF fonts only cover Latin-1; strip everything else so text never renders as garbage */
function safeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .normalize('NFC')
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^ -~¡-ÿ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function validCoords(c: unknown): c is LatLng {
  const o = c as { lat?: unknown; lng?: unknown } | undefined;
  return (
    !!o &&
    typeof o.lat === 'number' &&
    typeof o.lng === 'number' &&
    Number.isFinite(o.lat) &&
    Number.isFinite(o.lng) &&
    !(o.lat === 0 && o.lng === 0)
  );
}

function parseLocalDate(value?: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date, withYear = true): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

/** "14:00" -> "2:00 PM" */
function formatClock(value?: string): string | undefined {
  const m = value?.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return undefined;
  const h = parseInt(m[1], 10);
  if (h > 23) return undefined;
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "Monday: 9-5, Tuesday: 9-5, ..." -> "Daily: 9-5" when every day is the same */
function compactHours(raw?: string): string | undefined {
  const text = safeText(raw);
  if (!text) return undefined;
  const days = text.split(/,\s*(?=(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):)/i);
  const parsed = days.map((d) => d.slice(d.indexOf(':') + 1).trim());
  if (days.length === 7 && parsed.every((h) => h === parsed[0])) return `Daily ${parsed[0]}`;
  return text.length > 110 ? `${text.slice(0, 107)}...` : text;
}

// ---------------------------------------------------------------------------
// Board data -> guide model
// ---------------------------------------------------------------------------
interface GuideStop {
  /** Number shown on the map and the card (restarts at 1 in every day) */
  n: number;
  card: Card;
  name: string;
  typeLabel: string;
  confirmed: boolean;
  address: string;
  rating?: number;
  hours?: string;
  time?: string;
  note?: string;
  coords?: LatLng;
  photoUrl?: string;
  source?: CardSource;
  travelNote?: string;
  mapsUrl: string;
  color: string;
}

interface DayGroup {
  day: number | null; // null = ideas / not scheduled yet
  title: string;
  eyebrow: string;
  heading: string;
  color: string;
  stops: GuideStop[];
  routeUrl?: string;
  /** Street route between the located stops (filled in later) */
  road?: RoadRoute | null;
  /** Height of this page's map in mm, sized so the day's stops fit on the same page when they can */
  mapMm?: number;
}

// Card payloads are free-form JSON that differs per card type, so they are read loosely
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readPayload(card: Card): Record<string, any> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof card.payload_json === 'string' ? JSON.parse(card.payload_json) : (card.payload_json as any) || {};
  } catch {
    return {};
  }
}

function googleMapsPlaceUrl(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address].filter(Boolean).join(' '))}`;
}

function googleMapsRouteUrl(stops: GuideStop[]): string | undefined {
  const located = stops.filter((s) => s.coords);
  if (located.length === 0) return undefined;
  if (located.length === 1) {
    const c = located[0].coords!;
    return `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`;
  }
  const points = located.slice(0, 11).map((s) => `${s.coords!.lat},${s.coords!.lng}`); // Google allows 9 waypoints
  const waypoints = points.slice(1, -1).join('|');
  return (
    `https://www.google.com/maps/dir/?api=1&origin=${points[0]}&destination=${points[points.length - 1]}` +
    (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '') +
    '&travelmode=walking'
  );
}

function buildGroups(trip: Trip, cards: Card[]): { groups: DayGroup[]; notes: Card[] } {
  const places = cards.filter((c) => PLACE_TYPES.has(c.type));
  const notes = cards.filter((c) => c.type === 'note');

  const scheduled = places
    .filter((c) => c.day)
    .sort((a, b) => {
      if (a.day !== b.day) return (a.day || 0) - (b.day || 0);
      // The order set on the Board (drag, map, AI plan) is the sequence; the time is only a tiebreaker
      if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0);
      return (a.time_slot || '').localeCompare(b.time_slot || '');
    });
  const ideas = places
    .filter((c) => !c.day)
    .sort((a, b) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9) || (a.ranking || 0) - (b.ranking || 0));

  const start = parseLocalDate(trip.dates?.start);
  const dayNumbers = Array.from(new Set(scheduled.map((c) => c.day as number)));

  const toStop = (card: Card, n: number, color: string): GuideStop => {
    const p = readPayload(card);
    const name = safeText(p.name || p.title) || 'Untitled place';
    const address = safeText(p.address);
    const photo: string | undefined = Array.isArray(p.photos) && typeof p.photos[0] === 'string' ? p.photos[0] : undefined;
    const note = safeText(p.description || p.shortDescription);
    return {
      n,
      card,
      name,
      typeLabel: TYPE_LABEL[card.type] || 'Place',
      confirmed: (card.labels || []).includes('confirmed'),
      address,
      rating: typeof p.rating === 'number' && p.rating > 0 ? p.rating : undefined,
      hours: compactHours(p.opening_hours),
      time: formatClock(card.time_slot),
      note: note && note.length > 3 ? note : undefined,
      coords: validCoords(p.coordinates) ? p.coordinates : undefined,
      photoUrl: photo,
      source: p.source && p.source.videoId ? (p.source as CardSource) : undefined,
      mapsUrl: googleMapsPlaceUrl(name, address),
      color,
    };
  };

  const groups: DayGroup[] = dayNumbers.map((day, i) => {
    const color = DAY_COLORS[i % DAY_COLORS.length];
    const stops = scheduled.filter((c) => c.day === day).map((c, idx) => toStop(c, idx + 1, color));

    // Travel time to the next stop, from the Board's own travel info
    stops.forEach((stop, idx) => {
      const info = stop.card.travel_info;
      const next = stops[idx + 1];
      if (info && next && info.next_stop_id === next.card.id) {
        const mode = info.mode === 'walking' ? 'walk' : info.mode === 'driving' ? 'drive' : info.mode;
        stop.travelNote = `${formatDuration(info.duration)} ${mode}  |  ${info.distance.toFixed(1)} km`;
      }
    });

    const date = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + (day - 1)) : null;
    return {
      day,
      title: `Day ${day}`,
      eyebrow: date ? `DAY ${day}` : 'ITINERARY',
      heading: date ? formatLongDate(date) : `Day ${day}`,
      color,
      stops,
      routeUrl: googleMapsRouteUrl(stops),
    };
  });

  if (ideas.length > 0) {
    const stops = ideas.map((c, idx) => toStop(c, idx + 1, IDEAS_COLOR));
    groups.push({
      day: null,
      title: dayNumbers.length > 0 ? 'Saved ideas' : 'Places to consider',
      eyebrow: dayNumbers.length > 0 ? 'NOT SCHEDULED YET' : 'YOUR SHORTLIST',
      heading: dayNumbers.length > 0 ? 'Saved ideas' : 'Places to consider',
      color: IDEAS_COLOR,
      stops,
      routeUrl: googleMapsRouteUrl(stops),
    });
  }

  return { groups, notes };
}

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------
/** Cover-crop a photo to an exact box with rounded corners (white outside, so it sits cleanly on the page) */
function loadPhoto(url: string, wPx: number, hPx: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 8000);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = wPx;
        canvas.height = hPx;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, wPx, hPx);
        const r = Math.round(Math.min(wPx, hPx) * 0.09);
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.arcTo(wPx, 0, wPx, hPx, r);
        ctx.arcTo(wPx, hPx, 0, hPx, r);
        ctx.arcTo(0, hPx, 0, 0, r);
        ctx.arcTo(0, 0, wPx, 0, r);
        ctx.closePath();
        ctx.clip();
        const scale = Math.max(wPx / img.width, hPx / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (wPx - dw) / 2, (hPx - dh) / 2, dw, dh);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      } catch {
        resolve(null); // cross-origin image without CORS: skip it rather than fail the whole export
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

async function qr(url: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(url, { margin: 0, width: 260, errorCorrectionLevel: 'M' });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// The guide
// ---------------------------------------------------------------------------
const X_TIME = MARGIN + 11;
const X_DOT = MARGIN + 17.5;
const X_TEXT = MARGIN + 27;
const PHOTO_W = 34;
const PHOTO_H = 26;
const MAP_W_PX = 910;
const MAP_MIN_MM = 68;
const MAP_MAX_MM = 100;
const MAP_FALLBACK_MM = 84;
const mmToPx = (mm: number) => Math.round((mm / CONTENT_W) * MAP_W_PX);

export async function generateTripGuide(trip: Trip, cards: Card[]): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const { groups, notes } = buildGroups(trip, cards);
  const allStops = groups.flatMap((g) => g.stops);
  const dayGroups = groups.filter((g) => g.day !== null);

  // 1) Street routes for each planned day (in parallel), then fill in leg times the Board did not have
  await Promise.all(
    dayGroups.map(async (g) => {
      const located = g.stops.filter((s) => s.coords);
      g.road = await fetchRoadRoute(located.map((s) => s.coords!));
      if (g.road && located.length === g.stops.length) {
        g.stops.forEach((stop, i) => {
          const leg = g.road!.legs[i];
          if (!stop.travelNote && leg && i < g.stops.length - 1) {
            stop.travelNote = `${formatDuration(leg.minutes)} ${g.road!.mode}  |  ${leg.km.toFixed(1)} km`;
          }
        });
      }
    })
  );

  // 1b) Size each day's map so the map and its stops share one page whenever they can (no near-empty follow-up pages)
  const estimateRowMm = (s: GuideStop): number => {
    const noteLines = s.note ? Math.min(3, Math.ceil(s.note.length / 60)) : 0;
    const text =
      (s.name.length > 32 ? 10.2 : 5.1) + 6 + (s.address ? (s.address.length > 58 ? 7.8 : 3.9) : 0) +
      (noteLines ? noteLines * 4.3 + 1.2 : 0) + (s.hours ? 4.2 : 0) + (s.source ? 4.6 : 0);
    return Math.max(text, s.photoUrl ? PHOTO_H : 12) + 1 + (s.travelNote ? 9 : 5);
  };
  dayGroups.forEach((g) => {
    const rows = g.stops.reduce((sum, st) => sum + estimateRowMm(st), 0);
    const room = BOTTOM_LIMIT - (MARGIN + 31) - 9 - rows;
    g.mapMm = room >= MAP_MIN_MM ? Math.min(MAP_MAX_MM, room) : MAP_FALLBACK_MM;
  });
  groups.filter((g) => g.day === null).forEach((g) => (g.mapMm = 76));

  // 2) Everything else that is async, in parallel
  const pinsFor = (g: DayGroup, extra: Partial<MapPoint> = {}): MapPoint[] =>
    g.stops
      .filter((s) => s.coords)
      .map((s) => ({ ...s.coords!, label: String(s.n), color: s.color, name: s.name, ...extra }));

  const overviewRoutes: MapRoute[] = dayGroups.map((g) => ({
    line: g.road?.line || g.stops.filter((s) => s.coords).map((s) => s.coords!),
    color: g.color,
  }));

  const [photos, coverMap, groupMaps, groupQrs] = await Promise.all([
    Promise.all(allStops.map((s) => (s.photoUrl ? loadPhoto(s.photoUrl, 340, 260) : Promise.resolve(null)))),
    renderStaticMap({
      // Fit to the planned days; a far-away saved idea must not shrink the whole trip to a speck
      points: (dayGroups.length ? dayGroups : groups).flatMap((g) => pinsFor(g, { dot: true })),
      routes: overviewRoutes,
      width: MAP_W_PX,
      height: 540,
      lineWidth: 5,
    }),
    Promise.all(
      groups.map((g) =>
        renderStaticMap({
          points: pinsFor(g),
          routes:
            g.day !== null
              ? [{ line: g.road?.line || g.stops.filter((s) => s.coords).map((s) => s.coords!), color: g.color }]
              : [],
          width: MAP_W_PX,
          height: mmToPx(g.mapMm || MAP_FALLBACK_MM),
          labels: true,
          arrows: g.day !== null,
        })
      )
    ),
    Promise.all(groups.map((g) => (g.routeUrl && g.day !== null ? qr(g.routeUrl) : Promise.resolve(null)))),
  ]);
  const photoByCard = new Map(allStops.map((s, i) => [s.card.id, photos[i]]));

  // Videos behind the plan (grouped), for the watch-list page
  const videos = new Map<string, { source: CardSource; places: { name: string; startSec?: number }[] }>();
  allStops.forEach((s) => {
    if (!s.source) return;
    const entry = videos.get(s.source.videoId) || { source: s.source, places: [] };
    entry.places.push({ name: s.name, startSec: s.source.startSec });
    videos.set(s.source.videoId, entry);
  });
  const videoQrs = await Promise.all(Array.from(videos.keys()).map((id) => qr(`https://www.youtube.com/watch?v=${id}`)));

  // -- drawing helpers ------------------------------------------------------
  let y = MARGIN;
  const textColor = (hex: string) => doc.setTextColor(...hexToRgb(hex));
  const fill = (hex: string) => doc.setFillColor(...hexToRgb(hex));
  const stroke = (hex: string) => doc.setDrawColor(...hexToRgb(hex));
  const font = (style: 'normal' | 'bold' | 'italic', size: number, color: string) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    textColor(color);
  };
  const wrap = (text: string, width: number, maxLines: number): string[] => {
    const lines: string[] = doc.splitTextToSize(text, width);
    if (lines.length <= maxLines) return lines;
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/\s+\S*$/, '')}...`;
    return kept;
  };
  const newPage = () => {
    doc.addPage();
    y = MARGIN;
  };

  /** Small rounded label. Returns its width so callers can place the next item after it */
  const pill = (text: string, x: number, baseline: number, fg: string, bg: string): number => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    const w = doc.getTextWidth(text) + 4.4;
    fill(bg);
    doc.roundedRect(x, baseline - 3.4, w, 4.8, 2.4, 2.4, 'F');
    textColor(fg);
    doc.text(text, x + 2.2, baseline);
    return w;
  };

  const sectionHeader = (eyebrow: string, title: string, color = BRAND, subtitle?: string) => {
    font('bold', 7.5, color);
    doc.text(eyebrow.toUpperCase(), MARGIN, y + 3, { charSpace: 1.2 });
    font('bold', 22, INK);
    doc.text(title, MARGIN, y + 13);
    fill(color);
    doc.roundedRect(MARGIN, y + 17, 14, 1.3, 0.65, 0.65, 'F');
    y += 24;
    if (subtitle) {
      font('normal', 9, MUTED);
      const lines = wrap(subtitle, CONTENT_W, 3);
      doc.text(lines, MARGIN, y + 2);
      y += lines.length * 4.2 + 4;
    }
  };

  const continuedHeader = (title: string, color: string) => {
    fill(color);
    doc.circle(MARGIN + 1.6, y + 2.6, 1.6, 'F');
    font('bold', 9, MUTED);
    doc.text(`${title}  -  continued`, MARGIN + 6, y + 3.6);
    y += 11;
  };

  const ensure = (height: number, continued?: { title: string; color: string }) => {
    if (y + height > BOTTOM_LIMIT) {
      newPage();
      if (continued) continuedHeader(continued.title, continued.color);
    }
  };

  const placeMap = (dataUrl: string, pxW: number, pxH: number, caption?: string) => {
    const h = CONTENT_W * (pxH / pxW);
    doc.addImage(dataUrl, 'JPEG', MARGIN, y, CONTENT_W, h);
    stroke(RULE);
    doc.setLineWidth(0.25);
    doc.rect(MARGIN, y, CONTENT_W, h, 'S');
    y += h + 2.5;
    if (caption) {
      font('italic', 7.5, FAINT);
      doc.text(caption, MARGIN, y + 1.5);
      y += 6;
    }
  };

  // === COVER ===============================================================
  fill(INK);
  doc.rect(0, 0, PAGE_W, 92, 'F');
  fill(BRAND);
  doc.rect(0, 92, PAGE_W, 2.2, 'F');

  font('bold', 8, '#C4B5FD');
  doc.text('TRIPPLY  -  TRIP GUIDE', MARGIN, 20, { charSpace: 1.6 });

  font('bold', 33, '#FFFFFF');
  const titleLines = wrap(safeText(trip.title) || 'My Trip', CONTENT_W, 2);
  doc.text(titleLines, MARGIN, 38);
  const titleBottom = 38 + (titleLines.length - 1) * 13;

  const start = parseLocalDate(trip.dates?.start);
  const end = parseLocalDate(trip.dates?.end);
  const party = trip.party_json;
  const facts = [
    safeText(trip.destination?.name),
    start && end ? `${formatDate(start)} - ${formatDate(end)}` : '',
    party?.adults
      ? `${party.adults} adult${party.adults !== 1 ? 's' : ''}${party.children ? `, ${party.children} child${party.children !== 1 ? 'ren' : ''}` : ''}`
      : '',
  ].filter(Boolean);
  font('normal', 11, '#CBD5E1');
  doc.text(facts.join('   |   '), MARGIN, titleBottom + 10);

  // key numbers
  const keyNumbers: [string, string][] = [
    [String(allStops.length), allStops.length === 1 ? 'place' : 'places'],
    ...(dayGroups.length ? ([[String(dayGroups.length), dayGroups.length === 1 ? 'day planned' : 'days planned']] as [string, string][]) : []),
    ...(videos.size ? ([[String(videos.size), videos.size === 1 ? 'video source' : 'video sources']] as [string, string][]) : []),
  ];
  let kx = MARGIN;
  keyNumbers.forEach(([value, label]) => {
    font('bold', 17, '#FFFFFF');
    doc.text(value, kx, 78);
    const vw = doc.getTextWidth(value);
    font('normal', 8.5, '#94A3B8');
    doc.text(label, kx + vw + 2, 78);
    kx += vw + 2 + doc.getTextWidth(label) + 12;
  });

  y = 104;
  if (groups.length === 0) {
    font('normal', 12, MUTED);
    doc.text('No places on the board yet. Add places, then download the guide again.', PAGE_W / 2, y + 30, { align: 'center' });
  } else if (coverMap) {
    placeMap(coverMap, MAP_W_PX, 540);
  }

  // "Your days at a glance"
  if (groups.length > 0) {
    y += 2;
    font('bold', 7.5, BRAND);
    doc.text('YOUR PLAN AT A GLANCE', MARGIN, y + 3, { charSpace: 1.2 });
    y += 8;
    const rowH = groups.length > 7 ? 8 : 10;
    groups.forEach((g) => {
      if (y + rowH > PAGE_H - 26) return;
      fill(g.color);
      doc.circle(MARGIN + 2, y + 3.2, 2, 'F');
      font('bold', 10, INK);
      const label = g.day !== null ? g.title : g.title;
      doc.text(label, MARGIN + 8, y + 4.2);
      const labelW = doc.getTextWidth(label);

      const date = g.day !== null && start ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + (g.day - 1)) : null;
      font('normal', 8.5, MUTED);
      const meta = [date ? formatDate(date, false) : '', `${g.stops.length} ${g.stops.length === 1 ? 'stop' : 'stops'}`]
        .filter(Boolean)
        .join('  |  ');
      doc.text(meta, MARGIN + 8 + labelW + 4, y + 4.2);

      const names = g.stops.slice(0, 3).map((s) => s.name).join(', ') + (g.stops.length > 3 ? ', ...' : '');
      font('normal', 8, FAINT);
      const nameLine = wrap(names, CONTENT_W - 8, 1);
      doc.text(nameLine, MARGIN + 8, y + 8.4);
      y += rowH + 2.5;
    });
  }

  // cover footnote
  font('normal', 7.5, FAINT);
  doc.text(
    wrap(
      'Tap a place name to open it in Google Maps, or scan a day\'s QR code for the full route. Opening hours, prices and availability change, so check before you go.',
      CONTENT_W,
      2
    ),
    MARGIN,
    PAGE_H - 14
  );

  // === DAY PAGES ===========================================================
  groups.forEach((group, gi) => {
    newPage();
    const isDay = group.day !== null;
    const road = group.road;
    const qrData = groupQrs[gi];

    // header: eyebrow, date, summary, QR
    fill(group.color);
    doc.roundedRect(MARGIN, y, 1.6, 22, 0.8, 0.8, 'F');
    font('bold', 8, group.color);
    doc.text(group.eyebrow, MARGIN + 5, y + 4, { charSpace: 1.4 });
    font('bold', 22, INK);
    doc.text(wrap(group.heading, CONTENT_W - 36, 1), MARGIN + 5, y + 14);

    const summaryParts = [`${group.stops.length} ${group.stops.length === 1 ? 'stop' : 'stops'}`];
    if (road) {
      summaryParts.push(`${road.km.toFixed(1)} km ${road.mode === 'walk' ? 'on foot' : 'by road'}`);
      summaryParts.push(`about ${formatDuration(road.minutes)} between stops`);
    }
    font('normal', 9, MUTED);
    doc.text(summaryParts.join('   |   '), MARGIN + 5, y + 20.5);

    if (qrData) {
      const q = 20;
      const qx = PAGE_W - MARGIN - q;
      doc.addImage(qrData, 'PNG', qx, y, q, q);
      font('normal', 6.5, FAINT);
      doc.text('Scan for route', qx + q / 2, y + q + 3, { align: 'center' });
      if (group.routeUrl) doc.link(qx, y, q, q, { url: group.routeUrl });
    }
    y += 31;

    // map
    const map = groupMaps[gi];
    if (map) {
      const caption = isDay
        ? road
          ? 'Numbers show the order of your stops. The line follows streets; arrows show the direction.'
          : 'Numbers show the order of your stops. The line is a straight guide between stops, not the street route.'
        : 'Numbers match the list below.';
      placeMap(map, MAP_W_PX, mmToPx(group.mapMm || MAP_FALLBACK_MM), caption);
    }
    y += 3;

    if (isDay) {
      drawTimeline(group);
    } else {
      drawIdeasGrid(group);
    }
  });

  // -- timeline of stops (planned days) --------------------------------------
  interface StopLayout {
    nameLines: string[];
    addrLines: string[];
    noteLines: string[];
    hours?: string;
    sourceText?: string;
    hasPhoto: boolean;
    textW: number;
    h: number;
  }
  function layoutStop(stop: GuideStop, hasPhoto: boolean): StopLayout {
    const textW = PAGE_W - MARGIN - X_TEXT - (hasPhoto ? PHOTO_W + 5 : 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const nameLines = wrap(stop.name, textW, 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const addrLines = stop.address ? wrap(stop.address, textW, 2) : [];
    doc.setFontSize(9);
    const noteLines = stop.note ? wrap(stop.note, textW, 3) : [];
    const sourceText = stop.source
      ? `From video${stop.source.startSec !== undefined ? ` at ${formatTimestamp(stop.source.startSec)}` : ''}${stop.source.channel ? `  -  ${safeText(stop.source.channel)}` : ''}`
      : undefined;

    const content =
      nameLines.length * 5.1 + 6 + addrLines.length * 3.9 + (noteLines.length ? noteLines.length * 4.3 + 1.2 : 0) + (stop.hours ? 4.2 : 0) + (sourceText ? 4.6 : 0);
    return { nameLines, addrLines, noteLines, hours: stop.hours, sourceText, hasPhoto, textW, h: Math.max(content, hasPhoto ? PHOTO_H : 12) + 1 };
  }

  function drawStopDetails(stop: GuideStop, L: StopLayout, top: number) {
    let ty = top + 5.2;
    font('bold', 12, INK);
    doc.text(L.nameLines, X_TEXT, ty);
    doc.link(X_TEXT, top, L.textW, L.nameLines.length * 5.1, { url: stop.mapsUrl });
    ty += (L.nameLines.length - 1) * 5.1 + 5.6;

    // type, rating, confirmed
    let px = X_TEXT;
    px += pill(stop.typeLabel.toUpperCase(), px, ty, stop.color, tint(stop.color, 0.9)) + 2;
    if (stop.rating) {
      font('bold', 8.5, BODY);
      const r = `${stop.rating.toFixed(1)} / 5`;
      doc.text(r, px, ty);
      px += doc.getTextWidth(r) + 3;
    }
    if (stop.confirmed) pill('CONFIRMED', px, ty, GOOD, '#DCFCE7');
    ty += 3.6;

    if (L.addrLines.length) {
      font('normal', 8.5, MUTED);
      doc.text(L.addrLines, X_TEXT, ty + 1.2);
      ty += L.addrLines.length * 3.9;
    }
    if (L.noteLines.length) {
      font('normal', 9, BODY);
      doc.text(L.noteLines, X_TEXT, ty + 3.2);
      ty += L.noteLines.length * 4.3 + 1.2;
    }
    if (L.hours) {
      font('normal', 8, FAINT);
      doc.text(`Hours: ${L.hours}`, X_TEXT, ty + 3.2);
      ty += 4.2;
    }
    if (L.sourceText && stop.source) {
      font('bold', 8, '#BE185D');
      doc.text(L.sourceText, X_TEXT, ty + 3.4);
      const t = stop.source.startSec ? `&t=${Math.floor(stop.source.startSec)}s` : '';
      doc.link(X_TEXT, ty, L.textW, 4.6, { url: `https://www.youtube.com/watch?v=${stop.source.videoId}${t}` });
    }
  }

  function drawTimeline(group: DayGroup) {
    const layouts = group.stops.map((s) => layoutStop(s, !!photoByCard.get(s.card.id)));
    const continued = { title: group.title, color: group.color };

    group.stops.forEach((stop, i) => {
      const L = layouts[i];
      const gap = stop.travelNote && i < group.stops.length - 1 ? 9 : 5;
      ensure(L.h + (stop.travelNote && i < group.stops.length - 1 ? 7 : 1), continued);

      const top = y;
      const photo = photoByCard.get(stop.card.id);

      // time
      if (stop.time) {
        font('bold', 7.5, MUTED);
        doc.text(stop.time, X_TIME, top + 6.2, { align: 'right' });
      }

      // connector to the next stop (only when it lands on the same page)
      const next = layouts[i + 1];
      const nextOnSamePage = next && top + L.h + gap + next.h + 1 <= BOTTOM_LIMIT;
      if (nextOnSamePage) {
        stroke(tint(group.color, 0.55));
        doc.setLineWidth(0.9);
        doc.line(X_DOT, top + 9.4, X_DOT, top + L.h + gap + 0.8);
      }

      // numbered dot
      fill(group.color);
      doc.circle(X_DOT, top + 5, 4.4, 'F');
      stroke('#FFFFFF');
      doc.setLineWidth(0.7);
      doc.circle(X_DOT, top + 5, 4.4, 'S');
      font('bold', String(stop.n).length > 2 ? 7.5 : 10, '#FFFFFF');
      doc.text(String(stop.n), X_DOT, top + 6.5, { align: 'center' });

      if (photo) doc.addImage(photo, 'JPEG', PAGE_W - MARGIN - PHOTO_W, top, PHOTO_W, PHOTO_H);
      drawStopDetails(stop, L, top);

      y = top + L.h;
      if (stop.travelNote && i < group.stops.length - 1) {
        font('italic', 8, FAINT);
        doc.text(stop.travelNote, X_TEXT, y + 5.4);
      }
      y += gap;
    });
  }

  // -- two-column grid of saved ideas -------------------------------------
  function drawIdeasGrid(group: DayGroup) {
    const colGap = 6;
    const cardW = (CONTENT_W - colGap) / 2;
    const cardH = 27;
    const continued = { title: group.title, color: group.color };

    for (let i = 0; i < group.stops.length; i += 2) {
      ensure(cardH + 4, continued);
      [group.stops[i], group.stops[i + 1]].forEach((stop, col) => {
        if (!stop) return;
        const x = MARGIN + col * (cardW + colGap);
        const photo = photoByCard.get(stop.card.id);

        fill(SOFT);
        stroke(RULE);
        doc.setLineWidth(0.25);
        doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, 'FD');

        const tx = x + (photo ? 30 : 5);
        const tw = cardW - (photo ? 30 : 5) - 4;
        if (photo) doc.addImage(photo, 'JPEG', x + 2.5, y + 2.5, 25, cardH - 5);

        // number
        fill(stop.color);
        doc.circle(tx + 2.6, y + 5.2, 2.6, 'F');
        font('bold', 7.5, '#FFFFFF');
        doc.text(String(stop.n), tx + 2.6, y + 6.2, { align: 'center' });

        font('bold', 9.5, INK);
        const nameLines = wrap(stop.name, tw - 8, 2);
        doc.text(nameLines, tx + 7, y + 5.8);
        doc.link(tx + 7, y + 2, tw - 8, nameLines.length * 4.2, { url: stop.mapsUrl });

        let ty = y + 5.8 + (nameLines.length - 1) * 4.2 + 4.6;
        let px = tx;
        px += pill(stop.typeLabel.toUpperCase(), px, ty, stop.color, tint(stop.color, 0.86)) + 2;
        if (stop.rating) {
          font('bold', 8, BODY);
          doc.text(`${stop.rating.toFixed(1)} / 5`, px, ty);
        }
        ty += 4.2;
        if (stop.address) {
          font('normal', 7.5, MUTED);
          doc.text(wrap(stop.address, tw, 2), tx, ty);
        }
      });
      y += cardH + 4;
    }
  }

  // Practical sections (notes, shopping, watch list) share pages instead of one near-empty page each
  let firstPractical = true;
  const startSection = (needed: number) => {
    if (firstPractical || y + needed > BOTTOM_LIMIT) {
      newPage();
      firstPractical = false;
    } else {
      y += 12;
    }
  };

  // === NOTES ===============================================================
  const noteTexts = notes
    .map((c) => {
      const p = readPayload(c);
      return { title: safeText(p.title) || 'Note', content: safeText(p.content) };
    })
    .filter((n) => n.content);
  if (noteTexts.length > 0) {
    startSection(70);
    sectionHeader('Your thoughts', 'Notes');
    noteTexts.forEach((note) => {
      font('normal', 9.5, BODY);
      const lines: string[] = doc.splitTextToSize(note.content, CONTENT_W - 8);
      const h = 9 + lines.length * 4.4;
      ensure(h + 4, { title: 'Notes', color: BRAND });
      fill(SOFT);
      stroke(RULE);
      doc.setLineWidth(0.25);
      doc.roundedRect(MARGIN, y, CONTENT_W, h, 2.5, 2.5, 'FD');
      font('bold', 10, INK);
      doc.text(note.title, MARGIN + 4, y + 6);
      font('normal', 9.5, BODY);
      doc.text(lines, MARGIN + 4, y + 11.5);
      y += h + 4;
    });
  }

  // === SHOPPING LIST =======================================================
  const shoppingItems = cards
    .filter((c) => c.type === 'product')
    .map((c) => {
      const p = readPayload(c);
      return {
        name: safeText(p.name),
        price: typeof p.price === 'number' && p.price > 0 ? p.price : undefined,
        rating: typeof p.rating === 'number' && p.rating > 0 ? p.rating : undefined,
        url: typeof p.affiliateUrl === 'string' && p.affiliateUrl.startsWith('http') ? p.affiliateUrl : undefined,
      };
    })
    .filter((item) => item.name);
  if (shoppingItems.length > 0) {
    startSection(80);
    sectionHeader('Before you go', 'Shopping list', BRAND, 'Tick items off as you pack or buy them.');
    shoppingItems.forEach((item) => {
      font('bold', 10, INK);
      const nameLines = wrap(item.name, CONTENT_W - 52, 2);
      const h = nameLines.length * 5 + 9;
      ensure(h + 3, { title: 'Shopping list', color: BRAND });

      stroke(FAINT);
      doc.setLineWidth(0.4);
      doc.roundedRect(MARGIN, y + 1, 4.6, 4.6, 1, 1, 'S'); // tick box
      font('bold', 10, INK);
      doc.text(nameLines, MARGIN + 9, y + 4.8);
      const meta = [item.price ? `$${item.price.toFixed(2)}` : '', item.rating ? `Rated ${item.rating.toFixed(1)} / 5` : '']
        .filter(Boolean)
        .join('   |   ');
      font('normal', 8.5, MUTED);
      if (meta) doc.text(meta, MARGIN + 9, y + 4.8 + nameLines.length * 5);
      if (item.url) {
        font('bold', 8.5, LINK);
        const label = 'View on Amazon';
        doc.textWithLink(label, PAGE_W - MARGIN - doc.getTextWidth(label), y + 4.8, { url: item.url });
      }
      stroke(RULE);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, y + h - 0.5, PAGE_W - MARGIN, y + h - 0.5);
      y += h + 3;
    });

    y += 2;
    font('italic', 7.5, FAINT);
    doc.text(
      wrap(
        'Some links are affiliate links: if you buy through them, Tripply may earn a commission at no extra cost to you. As an Amazon Associate we earn from qualifying purchases. Prices may have changed.',
        CONTENT_W,
        3
      ),
      MARGIN,
      y + 2
    );
  }

  // === WATCH LIST ==========================================================
  if (videos.size > 0) {
    startSection(90);
    sectionHeader('Where this plan came from', 'Watch list', BRAND, 'The videos behind your places. Tap a place or scan the code to watch from the right moment.');

    Array.from(videos.entries()).forEach(([videoId, entry], i) => {
      const qrData = videoQrs[i];
      font('bold', 10.5, INK);
      const titleLines = wrap(safeText(entry.source.videoTitle) || 'Video', CONTENT_W - 36, 2);
      const h = Math.max(26, 8 + titleLines.length * 5 + (entry.source.channel ? 5 : 0) + entry.places.length * 4.8 + 3);
      ensure(h + 4, { title: 'Watch list', color: BRAND });

      fill(SOFT);
      stroke(RULE);
      doc.setLineWidth(0.25);
      doc.roundedRect(MARGIN, y, CONTENT_W, h, 2.5, 2.5, 'FD');
      if (qrData) doc.addImage(qrData, 'PNG', PAGE_W - MARGIN - 23, y + 4, 19, 19);

      font('bold', 10.5, INK);
      doc.text(titleLines, MARGIN + 5, y + 8);
      let ly = y + 8 + (titleLines.length - 1) * 5 + 5;
      if (entry.source.channel) {
        font('normal', 8.5, MUTED);
        doc.text(`by ${safeText(entry.source.channel)}`, MARGIN + 5, ly);
        ly += 5;
      }
      font('normal', 8.5, LINK);
      entry.places.forEach((place) => {
        const stamp = place.startSec !== undefined ? `  -  ${formatTimestamp(place.startSec)}` : '';
        const url = `https://www.youtube.com/watch?v=${videoId}${place.startSec ? `&t=${Math.floor(place.startSec)}s` : ''}`;
        doc.textWithLink(`${safeText(place.name)}${stamp}`, MARGIN + 5, ly, { url });
        ly += 4.8;
      });
      y += h + 4;
    });
  }

  // === FOOTER ON EVERY PAGE (except the cover) ==============================
  const pageCount = doc.getNumberOfPages();
  const prepared = formatDate(new Date());
  const tripName = safeText(trip.title) || 'My Trip';
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    stroke(RULE);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, FOOTER_Y - 4.5, PAGE_W - MARGIN, FOOTER_Y - 4.5);
    font('bold', 7.5, MUTED);
    doc.text(tripName, MARGIN, FOOTER_Y);
    const nameW = doc.getTextWidth(tripName);
    font('normal', 7.5, FAINT);
    doc.text(`   |   Tripply Trip Guide   |   prepared ${prepared}`, MARGIN + nameW, FOOTER_Y);
    font('bold', 7.5, MUTED);
    doc.text(`${i} / ${pageCount}`, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' });
  }

  return doc;
}

export async function exportTripGuide(trip: Trip, cards: Card[]): Promise<void> {
  const doc = await generateTripGuide(trip, cards);
  // "Lisbon Trip" -> "Lisbon_Trip_Guide" (not "Lisbon_Trip_Trip_Guide")
  const base = (safeText(trip.title) || 'Trip')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_?Trip$/i, '');
  doc.save(`${base || 'My'}_Trip_Guide.pdf`);
}
