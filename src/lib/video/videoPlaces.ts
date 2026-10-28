import OpenAI from 'openai';
import { getSubtitles } from 'youtube-caption-extractor';
import type { TravelPlace } from '@/lib/travel/types';
import type { VideoPlaceMatch, VideoPlacesResult, VideoPlace, VideoNote } from '@/types/video';
import { readInsightsCache, writeInsightsCache } from './insightsCache';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
// Captions are noisy ('alpham' = Alfama): a stronger model than chat decodes local names far better, and it runs once per video
const MODEL = process.env.OPENAI_PLACES_MODEL || 'gpt-4o';

const MAX_TRANSCRIPT_CHARS = 36000;
const MAX_PLACES = 15;
const EXTRACT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// A result without captions may only be a temporary failure to fetch them: do not keep it for long
const EXTRACT_NO_CAPTIONS_TTL_MS = 60 * 60 * 1000;
const RESOLVE_TTL_MS = 6 * 60 * 60 * 1000;

interface ExtractedPlace {
  name: string;
  type: VideoPlace['type'];
  startSec: number;
  note: string;
}
interface Extraction {
  summary: string;
  takeaways: VideoNote[];
  tips: VideoNote[];
  avoid: VideoNote[];
  places: ExtractedPlace[];
  hasTranscript: boolean;
  truncated: boolean;
}

// What the video says is cached long (one AI call per video, ever); Google place data only for hours
const extractCache = new Map<string, { data: Extraction; at: number; ttl: number }>();
const extractInflight = new Map<string, Promise<Extraction>>();
const resolveCache = new Map<string, { resolved: ResolvedPlace; at: number }>();

interface ResolvedPlace {
  place: TravelPlace | null;
  level: 'exact' | 'check';
}

const CARD_TYPE: Record<VideoPlace['type'], VideoPlaceMatch['cardType']> = {
  restaurant: 'food',
  hotel: 'hotel',
  attraction: 'spot',
  landmark: 'spot',
  other: 'spot',
};

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Caption lines grouped into ~20s blocks, each prefixed with its start second: "[T=95] text" */
async function buildTranscript(videoId: string): Promise<{ text: string; truncated: boolean } | null> {
  let subtitles: Array<{ start: string; text: string }> = [];
  try {
    subtitles = await getSubtitles({ videoID: videoId, lang: 'en' });
  } catch (e) {
    console.log(`[VideoPlaces] No captions for ${videoId}: ${(e as Error).message}`);
    return null;
  }
  if (!subtitles || subtitles.length === 0) return null;

  const lines: string[] = [];
  let blockStart = -1;
  let block: string[] = [];
  const flush = () => {
    if (block.length) lines.push(`[T=${Math.max(0, Math.floor(blockStart))}] ${block.join(' ')}`);
    block = [];
  };
  for (const s of subtitles) {
    const t = parseFloat(s.start);
    const text = (s.text || '').replace(/\s+/g, ' ').trim();
    if (!text || /^\[.*\]$/.test(text)) continue; // [Music], [Applause]
    if (blockStart < 0 || (Number.isFinite(t) && t - blockStart >= 20)) {
      flush();
      blockStart = Number.isFinite(t) ? t : blockStart < 0 ? 0 : blockStart;
    }
    block.push(text);
  }
  flush();

  let text = lines.join('\n');
  let truncated = false;
  if (text.length > MAX_TRANSCRIPT_CHARS) {
    text = text.slice(0, MAX_TRANSCRIPT_CHARS);
    truncated = true;
  }
  return text.length > 200 ? { text, truncated } : null;
}

/** Creator-written chapters in the description ("0:45 Belem Tower") */
function parseChapters(description: string): string[] {
  const out: string[] = [];
  for (const line of description.split('\n')) {
    const m = line.match(/^\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s*[-–—:)]?\s*(.{2,80})$/);
    if (!m) continue;
    const sec = (m[1] ? parseInt(m[1], 10) * 3600 : 0) + parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
    out.push(`[T=${sec}] ${m[4].trim()}`);
  }
  return out.length >= 3 ? out : [];
}

async function extractPlaces(params: {
  videoId: string;
  title: string;
  description: string;
  city: string;
}): Promise<Extraction> {
  const { videoId, title, description, city } = params;
  const cacheKey = videoId;
  const cached = extractCache.get(cacheKey);
  if (cached && Date.now() - cached.at < cached.ttl) return cached.data;
  const pending = extractInflight.get(cacheKey);
  if (pending) return pending;

  const run = (async (): Promise<Extraction> => {
    // Shared database cache first: one AI call per video for everyone
    const stored = await readInsightsCache<Extraction>(videoId);
    if (stored && Array.isArray(stored.places) && typeof stored.summary === 'string') {
      extractCache.set(cacheKey, { data: stored, at: Date.now(), ttl: stored.hasTranscript ? EXTRACT_TTL_MS : EXTRACT_NO_CAPTIONS_TTL_MS });
      return stored;
    }

    const transcript = await buildTranscript(videoId);
    const chapters = parseChapters(description);
    const hasTranscript = !!transcript;

    const material = [
      `Video title: ${title}`,
      `Description (first part): ${description.slice(0, 1500) || 'none'}`,
      chapters.length ? `Creator chapters:\n${chapters.join('\n')}` : '',
      hasTranscript ? `Transcript (each line starts with its start second):\n${transcript!.text}` : 'No transcript available.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You turn a travel video${city ? ` about ${city}` : ''} into a useful brief for someone planning a trip. Everything must come from what the video says in the transcript, chapters or description. Never add facts, places or advice from your own knowledge.

Return JSON:
{
  "summary": "",
  "takeaways": [{"text":"","startSec":0}],
  "tips": [{"text":"","startSec":0}],
  "avoid": [{"text":"","startSec":0}],
  "places": [{"name":"","type":"restaurant|attraction|hotel|landmark|other","startSec":0,"note":""}]
}

summary: 2-3 plain sentences on what THIS video covers (what kind of trip, how many days or which areas, the main stops). No filler like "explores various points of interest". Ignore promo text, links and "subscribe" lines in the description.
takeaways: 3-6 of the most important specific things the video says (a price, an opening time, a route, a best time of day, a recommendation and why). Each one a single clear sentence with the concrete detail.
tips: 2-6 practical things a traveler needs: booking or reservations, money and prices, transport and how to get there, best timing, what to bring or wear. Only what the video states.
avoid: warnings, tourist traps, mistakes or things to skip that the video mentions. Empty array if it gives none.
startSec: the second from the nearest [T=..] marker at or just before the moment it is said. Use 0 if there is no transcript.
If the video does not give enough to fill a list, return fewer items or an empty array. Never pad with generic advice ("explore local culture", "bring comfortable shoes") unless the video says it.

places rules:
- Include ONLY specific, named, visitable places (a restaurant, cafe, hotel, museum, viewpoint, market, beach, tower, neighborhood worth visiting) that are actually said in the transcript, chapters or description.
- Skip: the city, region or country itself, airports, generic words ("the beach", "a bar"), brands that are not a visit, and places the creator tells people to AVOID. A place the creator visited but found crowded or disappointing still counts.
- name: the proper name ONLY, no description. The transcript is auto-generated and often misspells local names (e.g. "Bellum Tower" for "Belém Tower", "Pora do Sol" for "Portas do Sol"). When the spoken name clearly sounds like a real, well-known place${city ? ` in ${city}` : ''} and the context confirms it, write its correct official name. If you are not sure which real place is meant, keep the spoken spelling.
- note: one short sentence (max 140 chars) of what the video says about it (why go, tip, price, time of day). If it just names the place, leave note as "".
- No duplicates. At most ${MAX_PLACES}, in the order they appear. If no specific places are named, return an empty array.`,
        },
        { role: 'user', content: material },
      ],
    });

    let parsed: { summary?: unknown; takeaways?: unknown; tips?: unknown; avoid?: unknown; places?: unknown } = {};
    try {
      parsed = JSON.parse(completion.choices[0].message.content || '{}');
    } catch {
      parsed = {};
    }

    const seen = new Set<string>();
    const places: ExtractedPlace[] = [];
    for (const raw of Array.isArray(parsed.places) ? (parsed.places as Record<string, unknown>[]) : []) {
      const name = typeof raw.name === 'string' ? raw.name.trim() : '';
      if (name.length < 2 || name.length > 80) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const type = ['restaurant', 'attraction', 'hotel', 'landmark', 'other'].includes(raw.type as string)
        ? (raw.type as VideoPlace['type'])
        : 'other';
      const startSec = typeof raw.startSec === 'number' && raw.startSec >= 0 ? Math.floor(raw.startSec) : 0;
      places.push({
        name,
        type,
        startSec,
        note: typeof raw.note === 'string' ? raw.note.trim().slice(0, 160) : '',
      });
      if (places.length >= MAX_PLACES) break;
    }

    const toNotes = (raw: unknown, max: number): VideoNote[] =>
      (Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [])
        .map((n) => ({
          text: typeof n.text === 'string' ? n.text.trim().slice(0, 240) : '',
          startSec: typeof n.startSec === 'number' && n.startSec > 0 ? Math.floor(n.startSec) : undefined,
        }))
        .filter((n) => n.text.length > 3)
        .slice(0, max);

    const data: Extraction = {
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim().slice(0, 600) : '',
      takeaways: toNotes(parsed.takeaways, 6),
      tips: toNotes(parsed.tips, 6),
      avoid: toNotes(parsed.avoid, 4),
      places,
      hasTranscript,
      truncated: transcript?.truncated ?? false,
    };
    extractCache.set(cacheKey, { data, at: Date.now(), ttl: hasTranscript ? EXTRACT_TTL_MS : EXTRACT_NO_CAPTIONS_TTL_MS });
    void writeInsightsCache(videoId, data, hasTranscript, MODEL);
    return data;
  })().finally(() => extractInflight.delete(cacheKey));

  extractInflight.set(cacheKey, run);
  return run;
}

function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(the|a|an|de|da|do|das|dos|of|and|restaurant|cafe|hotel|museum|tower)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Only accept a Google result when its name really looks like the place the video named */
function namesAgree(spoken: string, found: string): boolean {
  const a = normalize(spoken);
  const b = normalize(found);
  if (!a || !b) return false;
  if (a === b) return true;
  if (Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a))) return true;
  const ta = new Set(a.split(' '));
  const tb = new Set(b.split(' '));
  let shared = 0;
  ta.forEach((t) => tb.has(t) && shared++);
  return shared / Math.min(ta.size, tb.size) >= 0.6;
}

async function resolvePlace(name: string, city: string): Promise<ResolvedPlace> {
  const none: ResolvedPlace = { place: null, level: 'exact' };
  if (!PLACES_API_KEY) return none;
  const key = `${name.toLowerCase()}|${city.toLowerCase()}`;
  const cached = resolveCache.get(key);
  if (cached && Date.now() - cached.at < RESOLVE_TTL_MS) return cached.resolved;

  try {
    const q = new URLSearchParams({
      query: city ? `${name} ${city}` : name,
      key: PLACES_API_KEY,
    });
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${q}`);
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = data.status === 'OK' ? data.results || [] : [];

    let hit = results.slice(0, 3).find((r) => namesAgree(name, r.name || ''));
    let level: ResolvedPlace['level'] = 'exact';
    // Google often answers in English ("Church of Our Lady of Grace") for a place the video names in the local language.
    // For a specific multi-word name, offer the top result as "check this" rather than dropping a real place.
    if (!hit && results[0] && normalize(name).split(' ').filter(Boolean).length >= 2) {
      hit = results[0];
      level = 'check';
    }

    const place: TravelPlace | null = hit
      ? {
          id: hit.place_id,
          name: hit.name,
          imageUrl: hit.photos?.[0]
            ? `/api/places/photo?ref=${encodeURIComponent(hit.photos[0].photo_reference)}&maxwidth=800`
            : '',
          categories: hit.types || [],
          rating: hit.rating || 0,
          reviewCount: hit.user_ratings_total || 0,
          popularityScore: hit.rating || 0,
          description: '',
          coordinates: { lat: hit.geometry.location.lat, lng: hit.geometry.location.lng },
          address: hit.formatted_address,
          priceLevel: hit.price_level,
        }
      : null;
    const resolved: ResolvedPlace = { place, level };
    resolveCache.set(key, { resolved, at: Date.now() });
    return resolved;
  } catch (e) {
    console.error('[VideoPlaces] resolve failed:', name, e);
    return none;
  }
}

/** Places a video names, each tied to a real map place (when found) and the second it is mentioned */
export async function getVideoPlaces(params: {
  videoId: string;
  title: string;
  description: string;
  city: string;
}): Promise<VideoPlacesResult> {
  const extraction = await extractPlaces(params);

  // 4 at a time: friendly to the Places API without making the user wait for 15 serial lookups
  const matches: VideoPlaceMatch[] = new Array(extraction.places.length);
  let next = 0;
  const worker = async () => {
    while (next < extraction.places.length) {
      const i = next++;
      const p = extraction.places[i];
      const { place, level } = await resolvePlace(p.name, params.city);
      matches[i] = {
        name: p.name,
        type: p.type,
        cardType: CARD_TYPE[p.type],
        startSec: p.startSec,
        note: p.note,
        ...(place ? { place, matchLevel: level } : {}),
      };
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, extraction.places.length) }, worker));

  return {
    videoId: params.videoId,
    summary: extraction.summary,
    takeaways: extraction.takeaways,
    tips: extraction.tips,
    avoid: extraction.avoid,
    places: matches,
    hasTranscript: extraction.hasTranscript,
    truncated: extraction.truncated,
  };
}

export { formatClock };
