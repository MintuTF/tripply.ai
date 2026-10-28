import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { haversineKm } from '@/lib/travel/routeTools';

const MODEL = process.env.OPENAI_PLAN_MODEL || 'gpt-4o';
const MAX_PLACES = 30;

interface PlaceIn {
  id: string;
  name: string;
  type: 'hotel' | 'spot' | 'food' | 'activity';
  lat?: number;
  lng?: number;
  rating?: number;
  hours?: string;
  note?: string;
  currentDay?: number;
}

interface PlanRequest {
  destination?: string;
  days: number;
  startDate?: string;
  pace?: 'relaxed' | 'balanced' | 'packed';
  preferences?: string;
  feedback?: string;
  previous?: { day: number; stops: { id: string; time?: string }[] }[];
  places: PlaceIn[];
}

export interface PlanOut {
  summary: string;
  days: { day: number; theme: string; stops: { id: string; time?: string; reason: string }[] }[];
  warnings: string[];
}

const PACE_GUIDE: Record<string, string> = {
  relaxed: '3-4 stops per day with generous breaks and a late start',
  balanced: '4-6 stops per day',
  packed: '6-8 stops per day, early starts, minimal downtime',
};

/**
 * POST /api/board/plan-itinerary
 * Arranges a traveler's confirmed places into the best day-by-day order and explains each choice.
 */
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(`plan-itinerary:${getClientIP(request)}`, { windowMs: 60 * 1000, maxRequests: 8 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429, headers: createRateLimitHeaders(limit) });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI is not configured' }, { status: 503 });
  }

  let body: PlanRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const places = (Array.isArray(body.places) ? body.places : [])
    .filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string')
    .slice(0, MAX_PLACES);
  const days = Math.min(14, Math.max(1, Math.floor(Number(body.days) || 1)));
  if (places.length === 0) return NextResponse.json({ error: 'No places to plan' }, { status: 400 });

  // Short ids keep the prompt small and stop the model from mangling long place ids
  const short = new Map(places.map((p, i) => [`p${i + 1}`, p.id]));
  const shortOf = new Map(places.map((p, i) => [p.id, `p${i + 1}`]));

  const located = places.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');
  const nearest = located.map((p) => {
    const near = located
      .filter((q) => q.id !== p.id)
      .map((q) => ({ id: shortOf.get(q.id)!, km: haversineKm({ lat: p.lat!, lng: p.lng! }, { lat: q.lat!, lng: q.lng! }) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 5)
      .map((n) => `${n.id} ${n.km.toFixed(1)}km`);
    return `${shortOf.get(p.id)}: ${near.join(', ')}`;
  });

  const startDate = typeof body.startDate === 'string' ? body.startDate.slice(0, 10) : '';
  const weekday = (day: number) => {
    const d = new Date(`${startDate}T00:00:00`);
    if (!startDate || Number.isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + day - 1);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  };
  const dayLabels = Array.from({ length: days }, (_, i) => `Day ${i + 1}${weekday(i + 1) ? ` (${weekday(i + 1)})` : ''}`).join(', ');

  const placeLines = places.map((p) =>
    [
      `${shortOf.get(p.id)} | ${p.name.slice(0, 70)} | ${p.type}`,
      typeof p.rating === 'number' && p.rating > 0 ? `rating ${p.rating}` : '',
      p.hours ? `hours: ${p.hours.slice(0, 160)}` : '',
      p.note ? `note: ${p.note.slice(0, 120)}` : '',
      p.currentDay ? `currently day ${p.currentDay}` : '',
      typeof p.lat !== 'number' ? 'no map location' : '',
    ]
      .filter(Boolean)
      .join(' | ')
  );

  const previousText = Array.isArray(body.previous)
    ? body.previous
        .map((d) => `Day ${d.day}: ${d.stops.map((s) => `${shortOf.get(s.id) || '?'}${s.time ? `@${s.time}` : ''}`).join(' > ')}`)
        .join('\n')
    : '';

  const system = `You are an expert local trip planner. Arrange the traveler's confirmed places into the best ${days}-day itinerary${body.destination ? ` for ${String(body.destination).slice(0, 60)}` : ''}.

How to decide:
1. Group by geography first: places close together share a day, so nobody crosses the city twice. Use the nearest-neighbour distances given.
2. Order each day as one smooth path with no backtracking.
3. Time things sensibly: breakfast/cafe stops in the morning, lunch about 12:00-14:00, dinner about 19:00-21:00, viewpoints at golden hour (sunrise or sunset), museums and big attractions earlier before crowds, nightlife last.
4. Respect opening hours and the weekday of each day when hours are given (for example a place closed on Mondays must not land on a Monday). If you cannot satisfy this, say so in warnings.
5. Pace: ${PACE_GUIDE[body.pace || 'balanced'] || PACE_GUIDE.balanced}. Spread the places evenly across the days.
6. A hotel is the traveler's base: put it on Day 1 as an afternoon check-in (about 15:00) and do not repeat it.
7. Places with no map location: slot them where they fit by type and note it.
${body.preferences ? `8. Traveler preferences: ${String(body.preferences).slice(0, 300)}` : ''}

There are exactly ${places.length} places. Use ONLY the place ids provided, and every one of them must appear exactly once. Do not invent places.

Return JSON: {"summary":"","days":[{"day":1,"theme":"","stops":[{"id":"p1","time":"09:30","reason":""}]}],"warnings":[""]}
- summary: 2-3 sentences on the overall logic (what you grouped and why).
- theme: a short 2-5 word title for the day (for example "Old town and viewpoints").
- time: 24h "HH:MM" start time for that stop, increasing through the day.
- reason: one sentence (max 140 chars) on why this stop sits here (location, timing, hours, crowds). Be specific, never generic.
- warnings: real problems only (closed day, very long transfer, too many places for the days). Empty array if none.
Days available: ${dayLabels}. Use every day from 1 to ${days} unless there are fewer places than days.`;

  const user = [
    `Places:\n${placeLines.join('\n')}`,
    nearest.length ? `Nearest places (straight-line km):\n${nearest.join('\n')}` : '',
    previousText ? `Your previous plan:\n${previousText}` : '',
    body.feedback ? `The traveler's feedback on that plan: ${String(body.feedback).slice(0, 400)}\nChange the plan to address it, keeping what already works.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 3500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const raw = JSON.parse(completion.choices[0].message.content || '{}') as {
      summary?: unknown;
      days?: { day?: unknown; theme?: unknown; stops?: { id?: unknown; time?: unknown; reason?: unknown }[] }[];
      warnings?: unknown;
    };

    // Validate: known ids only, each exactly once, days within range
    const used = new Set<string>();
    const outDays: PlanOut['days'] = [];
    (Array.isArray(raw.days) ? raw.days : []).forEach((d, i) => {
      const dayNo = Math.min(days, Math.max(1, Math.floor(Number(d.day) || i + 1)));
      const stops: PlanOut['days'][number]['stops'] = [];
      (Array.isArray(d.stops) ? d.stops : []).forEach((s) => {
        const real = typeof s.id === 'string' ? short.get(s.id) : undefined;
        if (!real || used.has(real)) return;
        used.add(real);
        stops.push({
          id: real,
          time: typeof s.time === 'string' && /^\d{1,2}:\d{2}$/.test(s.time) ? s.time.padStart(5, '0') : undefined,
          reason: typeof s.reason === 'string' ? s.reason.trim().slice(0, 200) : '',
        });
      });
      if (stops.length === 0) return;
      const existing = outDays.find((x) => x.day === dayNo);
      if (existing) existing.stops.push(...stops);
      else outDays.push({ day: dayNo, theme: typeof d.theme === 'string' ? d.theme.trim().slice(0, 60) : '', stops });
    });

    // The model sees short ids (p1, p2...); never let them leak into text shown to the traveler
    const nameOf = new Map(places.map((p, i) => [`p${i + 1}`, p.name]));
    const humanize = (text: string) => text.replace(/\bp(\d{1,2})\b/g, (m) => nameOf.get(m) || m);
    outDays.forEach((d) => d.stops.forEach((st) => (st.reason = humanize(st.reason))));

    // Anything the model dropped is inserted where it adds the least travel, never just dumped on a day
    const byId = new Map(places.map((p) => [p.id, p]));
    const pos = (id: string) => {
      const p = byId.get(id);
      return p && typeof p.lat === 'number' && typeof p.lng === 'number' ? { lat: p.lat, lng: p.lng } : null;
    };
    places
      .filter((p) => !used.has(p.id))
      .forEach((p) => {
        if (!outDays.length) return;
        const at = pos(p.id);
        let best: { day: (typeof outDays)[number]; index: number; cost: number } | null = null;
        if (at) {
          outDays.forEach((day) => {
            const pts = day.stops.map((st) => pos(st.id));
            for (let i = 0; i <= day.stops.length; i++) {
              const prev = i > 0 ? pts[i - 1] : null;
              const next = i < day.stops.length ? pts[i] : null;
              const added =
                prev && next
                  ? haversineKm(prev, at) + haversineKm(at, next) - haversineKm(prev, next)
                  : prev
                    ? haversineKm(prev, at)
                    : next
                      ? haversineKm(at, next)
                      : 0;
              if (!best || added < best.cost) best = { day, index: i, cost: added };
            }
          });
        }
        if (best) {
          const b = best as { day: (typeof outDays)[number]; index: number; cost: number };
          b.day.stops.splice(b.index, 0, { id: p.id, reason: 'Fits this day\'s route with the least extra travel.' });
        } else {
          const lightest = outDays.reduce((a, b) => (a.stops.length <= b.stops.length ? a : b));
          lightest.stops.push({ id: p.id, reason: 'Added so every confirmed place stays in your plan.' });
        }
        used.add(p.id);
      });
    outDays.sort((a, b) => a.day - b.day);

    if (outDays.length === 0) return NextResponse.json({ error: 'The AI could not build a plan. Please try again.' }, { status: 502 });

    const plan: PlanOut = {
      summary: typeof raw.summary === 'string' ? humanize(raw.summary.trim().slice(0, 500)) : '',
      days: outDays,
      warnings: (Array.isArray(raw.warnings) ? raw.warnings : [])
        .filter((w): w is string => typeof w === 'string' && w.trim().length > 3)
        .map((w) => humanize(w.trim().slice(0, 200)))
        .slice(0, 5),
    };
    return NextResponse.json(plan, { headers: createRateLimitHeaders(limit) });
  } catch (error) {
    console.error('[PlanItinerary] Error:', error);
    return NextResponse.json({ error: 'The AI planner is unavailable right now. Please try again.' }, { status: 502 });
  }
}
