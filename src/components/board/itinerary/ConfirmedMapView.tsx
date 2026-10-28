'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, ChevronDown, ChevronUp, MapPinOff, Sparkles, Undo2, X } from 'lucide-react';
import type { Card, Trip } from '@/types';
import { estimateLeg, fetchRoadRoute, optimizeOrder, type RoadRoute } from '@/lib/travel/routeTools';
import { AIPlanPanel } from './AIPlanPanel';
import { DayPlanList, type Leg } from './DayPlanList';
import {
  applyMove,
  buildLayout,
  dayColor,
  formatClock,
  highestDay,
  isConfirmed,
  isPlace,
  layoutFromPlan,
  toStop,
  type AIPlan,
  type Layout,
  type PlanStop,
} from './model';

const ItineraryMap = dynamic(() => import('./ItineraryMap').then((m) => m.ItineraryMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-gray-100" />,
});

interface ConfirmedMapViewProps {
  cards: Card[];
  trip: Trip;
  onCardUpdate?: (cardId: string, updates: Partial<Card>) => void | Promise<void>;
  onOpenCard?: (card: Card) => void;
}

interface Snapshot {
  id: string;
  day?: number | null;
  order?: number;
  time_slot?: string | null;
  labels?: string[];
}

const COLUMN_LABELS = ['considering', 'shortlist', 'confirmed', 'dismissed', 'booked'];

function tripDayCount(dates?: { start: string; end: string }): number {
  if (!dates?.start || !dates?.end) return 0;
  const diff = new Date(dates.end).getTime() - new Date(dates.start).getTime();
  return Number.isFinite(diff) ? Math.max(1, Math.ceil(diff / 86400000) + 1) : 0;
}

export function ConfirmedMapView({ cards, trip, onCardUpdate, onOpenCard }: ConfirmedMapViewProps) {
  const [focusDay, setFocusDay] = useState<number | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [extraDays, setExtraDays] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<AIPlan | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [undo, setUndo] = useState<{ label: string; snapshot: Snapshot[] } | null>(null);
  const [roadData, setRoadData] = useState<Record<number, { sig: string; route: RoadRoute | null }>>({});
  const roadRef = useRef(roadData);
  roadRef.current = roadData;

  // ---- data ---------------------------------------------------------------
  const confirmedCards = useMemo(() => cards.filter(isConfirmed), [cards]);
  const otherPlaceCount = useMemo(() => cards.filter((c) => isPlace(c) && !isConfirmed(c)).length, [cards]);
  const stopList = useMemo(() => confirmedCards.map(toStop), [confirmedCards]);
  const stopsById = useMemo(() => Object.fromEntries(stopList.map((s) => [s.id, s])) as Record<string, PlanStop>, [stopList]);
  const layout = useMemo(() => buildLayout(stopList), [stopList]);

  // While an AI plan is previewed, the list and map show it (read-only) instead of the saved order
  const previewLayout = useMemo(() => (previewPlan ? layoutFromPlan(previewPlan) : null), [previewPlan]);
  const effectiveLayout: Layout = previewLayout || layout;
  const effectiveStops = useMemo(() => {
    if (!previewPlan) return stopsById;
    const next: Record<string, PlanStop> = { ...stopsById };
    previewPlan.days.forEach((d) =>
      d.stops.forEach((s, i) => {
        if (next[s.id]) next[s.id] = { ...next[s.id], day: d.day, order: i, time: s.time };
      })
    );
    return next;
  }, [previewPlan, stopsById]);
  const effectiveReasons = useMemo(() => {
    if (!previewPlan) return reasons;
    return Object.fromEntries(previewPlan.days.flatMap((d) => d.stops.map((s) => [s.id, s.reason]))) as Record<string, string>;
  }, [previewPlan, reasons]);

  const datedDays = tripDayCount(trip.dates);
  const dayCount = Math.max(datedDays || 1, highestDay(effectiveLayout), extraDays);
  const days = useMemo(() => [...Array.from({ length: dayCount }, (_, i) => i + 1), 0], [dayCount]);

  const dayDates = useMemo(() => {
    const out: Record<number, string> = {};
    const start = trip.dates?.start ? new Date(`${trip.dates.start.slice(0, 10)}T00:00:00`) : null;
    if (start && !Number.isNaN(start.getTime())) {
      for (let d = 1; d <= dayCount; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + d - 1);
        out[d] = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
    }
    return out;
  }, [trip.dates, dayCount]);

  // ---- street routes (drawn straight first, replaced by the street route when it arrives) ------------
  const daySigs = useMemo(
    () =>
      days
        .filter((d) => d > 0)
        .map((d) => {
          const coords = (effectiveLayout[d] || []).map((id) => effectiveStops[id]?.coords).filter(Boolean) as { lat: number; lng: number }[];
          return { day: d, coords, sig: coords.map((c) => `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`).join('|') };
        }),
    [days, effectiveLayout, effectiveStops]
  );
  const routeKey = daySigs.map((s) => `${s.day}:${s.sig}`).join(';');

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      daySigs.forEach(async ({ day, coords, sig }) => {
        if (coords.length < 2 || roadRef.current[day]?.sig === sig) return;
        const route = await fetchRoadRoute(coords);
        if (!cancelled) setRoadData((prev) => ({ ...prev, [day]: { sig, route } }));
      });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  const roads = useMemo(() => {
    const out: Record<number, RoadRoute | null | undefined> = {};
    daySigs.forEach(({ day, sig }) => {
      out[day] = roadData[day]?.sig === sig ? roadData[day].route : undefined;
    });
    return out;
  }, [daySigs, roadData]);

  // Travel between consecutive stops, and the totals per day
  const { legs, dayStats } = useMemo(() => {
    const legs: Record<string, Leg | undefined> = {};
    const dayStats: Record<number, { km: number; minutes: number } | undefined> = {};
    days
      .filter((d) => d > 0)
      .forEach((d) => {
        const located = (effectiveLayout[d] || []).filter((id) => effectiveStops[id]?.coords);
        const road = roads[d];
        const usable = road && road.legs.length === located.length - 1;
        let km = 0;
        let minutes = 0;
        located.slice(0, -1).forEach((id, i) => {
          const a = effectiveStops[id].coords!;
          const b = effectiveStops[located[i + 1]].coords!;
          const leg: Leg = usable
            ? { km: road!.legs[i].km, minutes: road!.legs[i].minutes, mode: road!.mode, estimated: false }
            : { ...estimateLeg(a, b), estimated: true };
          legs[id] = leg;
          km += leg.km;
          minutes += leg.minutes;
        });
        dayStats[d] = { km, minutes };
      });
    return { legs, dayStats };
  }, [days, effectiveLayout, effectiveStops, roads]);

  // ---- editing ------------------------------------------------------------
  const update = useCallback((id: string, updates: Partial<Card>) => onCardUpdate?.(id, updates), [onCardUpdate]);

  const commit = useCallback(
    (next: Layout, opts: { label: string; movedId?: string; times?: Record<string, string | undefined> }) => {
      const snapshot: Snapshot[] = stopList.map((s) => ({ id: s.id, day: s.card.day ?? null, order: s.card.order, time_slot: s.card.time_slot ?? null }));
      Object.keys(next)
        .map(Number)
        .forEach((day) => {
          next[day].forEach((id, i) => {
            const s = stopsById[id];
            if (!s) return;
            const updates: Record<string, unknown> = {};
            if ((s.card.day || 0) !== day) updates.day = day === 0 ? null : day;
            if ((s.card.order ?? -1) !== i) updates.order = i;
            if (opts.times) {
              const t = opts.times[id];
              if ((t || null) !== (s.card.time_slot || null)) updates.time_slot = t ?? null;
            } else if (id === opts.movedId && s.card.time_slot) {
              updates.time_slot = null; // the old time no longer matches its new place in the day
            }
            if (Object.keys(updates).length) update(id, updates as Partial<Card>);
          });
        });
      setUndo({ label: opts.label, snapshot });
    },
    [stopList, stopsById, update]
  );

  const moveStop = useCallback(
    (id: string, toDay: number, toIndex: number) => {
      commit(applyMove(layout, id, toDay, toIndex), { label: toDay === (stopsById[id]?.day || 0) ? 'Order updated' : toDay === 0 ? 'Moved to not scheduled' : `Moved to Day ${toDay}`, movedId: id });
      setReasons((r) => Object.fromEntries(Object.entries(r).filter(([key]) => key !== id)));
    },
    [commit, layout, stopsById]
  );

  const nudge = useCallback(
    (id: string, dir: -1 | 1) => {
      const day = stopsById[id]?.day || 0;
      const ids = layout[day] || [];
      const i = ids.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ids.length) return;
      moveStop(id, day, j);
    },
    [layout, moveStop, stopsById]
  );

  const removeStop = useCallback(
    (id: string) => {
      const s = stopsById[id];
      if (!s) return;
      const snapshot: Snapshot[] = [{ id, day: s.card.day ?? null, order: s.card.order, time_slot: s.card.time_slot ?? null, labels: s.card.labels || [] }];
      update(id, { labels: [...(s.card.labels || []).filter((l) => !COLUMN_LABELS.includes(l)), 'shortlist'], day: null as unknown as undefined } as Partial<Card>);
      setSelectedId(null);
      setUndo({ label: `Removed ${s.name}`, snapshot });
    },
    [stopsById, update]
  );

  const optimizeDay = useCallback(
    (day: number) => {
      const ids = layout[day] || [];
      const located = ids.filter((id) => stopsById[id]?.coords);
      if (located.length < 3) return;
      const order = optimizeOrder(located.map((id) => stopsById[id].coords!), true);
      const ordered = order.map((i) => located[i]);
      const rest = ids.filter((id) => !ordered.includes(id));
      commit({ ...layout, [day]: [...ordered, ...rest] }, { label: `Day ${day} reordered for the shortest route` });
    },
    [commit, layout, stopsById]
  );

  const applyPlan = useCallback(
    (plan: AIPlan) => {
      const times: Record<string, string | undefined> = {};
      plan.days.forEach((d) => d.stops.forEach((s) => (times[s.id] = s.time)));
      commit({ ...layout, ...layoutFromPlan(plan) }, { label: 'AI plan applied', times });
      setReasons(Object.fromEntries(plan.days.flatMap((d) => d.stops.filter((s) => s.reason).map((s) => [s.id, s.reason]))));
      setPreviewPlan(null);
      setAiOpen(false);
      setFocusDay('all');
    },
    [commit, layout]
  );

  const undoLast = () => {
    if (!undo) return;
    undo.snapshot.forEach((s) => {
      const updates: Record<string, unknown> = { day: s.day ?? null, order: s.order, time_slot: s.time_slot ?? null };
      if (s.labels) updates.labels = s.labels;
      update(s.id, updates as Partial<Card>);
    });
    setUndo(null);
  };

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 10000);
    return () => clearTimeout(t);
  }, [undo]);

  const confirmAll = () => {
    cards
      .filter((c) => isPlace(c) && !isConfirmed(c))
      .forEach((c) => update(c.id, { labels: [...(c.labels || []).filter((l) => !COLUMN_LABELS.includes(l)), 'confirmed'] }));
  };

  // ---- map popup ----------------------------------------------------------
  const renderPopup = (stop: PlanStop) => {
    const s = effectiveStops[stop.id] || stop;
    const day = s.day;
    const idx = (effectiveLayout[day] || []).indexOf(s.id);
    const count = (effectiveLayout[day] || []).length;
    const readOnly = !!previewPlan;
    return (
      <div className="w-64">
        {s.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.imageUrl} alt="" className="h-24 w-full object-cover" />
        )}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-gray-900">{s.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {[day > 0 ? `Day ${day} · stop ${idx + 1}` : 'Not scheduled', formatClock(s.time), s.rating ? `${s.rating.toFixed(1)} rated` : ''].filter(Boolean).join('  ·  ')}
              </p>
            </div>
            <button type="button" onClick={() => setSelectedId(null)} aria-label="Close" className="-mr-1 -mt-1 rounded p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          {effectiveReasons[s.id] && <p className="mt-2 rounded-lg bg-purple-50 p-2 text-xs leading-snug text-purple-900">{effectiveReasons[s.id]}</p>}

          {!readOnly && (
            <>
              <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Move to</p>
              <div className="flex flex-wrap gap-1">
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    disabled={d === day}
                    onClick={() => moveStop(s.id, d, 9999)}
                    className="rounded-full border px-2 py-0.5 text-[11px] font-medium disabled:cursor-default"
                    style={d === day ? { background: dayColor(d), color: '#fff', borderColor: dayColor(d) } : { color: dayColor(d), borderColor: `${dayColor(d)}66` }}
                  >
                    {d === 0 ? 'Unscheduled' : `Day ${d}`}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={idx <= 0}
                  onClick={() => nudge(s.id, -1)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronUp className="h-3.5 w-3.5" /> Earlier
                </button>
                <button
                  type="button"
                  disabled={idx < 0 || idx >= count - 1}
                  onClick={() => nudge(s.id, 1)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronDown className="h-3.5 w-3.5" /> Later
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <button type="button" onClick={() => onOpenCard?.(s.card)} className="text-xs font-medium text-purple-700 hover:underline">
                  Details
                </button>
                <button type="button" onClick={() => removeStop(s.id)} className="text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ---- render -------------------------------------------------------------
  const located = stopList.filter((s) => s.coords).length;
  const counts = (d: number) => (effectiveLayout[d] || []).length;

  const aside = aiOpen ? (
    <AIPlanPanel
      stops={stopList}
      stopsById={stopsById}
      destination={trip.destination?.name}
      startDate={trip.dates?.start}
      initialDays={datedDays || highestDay(layout) || Math.min(7, Math.max(1, Math.ceil(stopList.length / 5)))}
      plan={previewPlan}
      onPlan={setPreviewPlan}
      onApply={applyPlan}
      onClose={() => {
        setAiOpen(false);
        setPreviewPlan(null);
      }}
    />
  ) : (
    <div className="flex h-full flex-col">
      <header className="space-y-3 border-b border-gray-100 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Your itinerary</h2>
            <p className="text-xs text-gray-500">
              {stopList.length} confirmed {stopList.length === 1 ? 'place' : 'places'}
              {datedDays || highestDay(layout) > 0 ? ` · ${dayCount} ${dayCount === 1 ? 'day' : 'days'}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            disabled={stopList.length === 0}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> Plan with AI
          </button>
        </div>

        {stopList.length > 0 && (
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="group" aria-label="Show on map">
            <Chip active={focusDay === 'all'} onClick={() => setFocusDay('all')} label="All days" />
            {days.map((d) =>
              d === 0 && counts(0) === 0 ? null : (
                <Chip key={d} active={focusDay === d} color={dayColor(d)} onClick={() => setFocusDay(focusDay === d ? 'all' : d)} label={d === 0 ? 'Unscheduled' : `Day ${d}`} count={counts(d)} />
              )
            )}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {stopList.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No confirmed places yet</h3>
            <p className="mt-1.5 text-sm text-gray-500">Confirm the places you will visit, then arrange them here, day by day, on the map.</p>
            {otherPlaceCount > 0 && (
              <button type="button" onClick={confirmAll} className="mt-5 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700">
                Confirm all {otherPlaceCount} saved {otherPlaceCount === 1 ? 'place' : 'places'}
              </button>
            )}
          </div>
        ) : (
          <DayPlanList
            stops={effectiveStops}
            layout={effectiveLayout}
            days={days}
            dayDates={dayDates}
            focusDay={focusDay}
            selectedId={selectedId}
            hoverId={hoverId}
            legs={legs}
            dayStats={dayStats}
            reasons={effectiveReasons}
            readOnly={!!previewPlan}
            canAddDay={!datedDays}
            onFocusDay={setFocusDay}
            onSelect={setSelectedId}
            onHover={setHoverId}
            onMove={moveStop}
            onNudge={nudge}
            onRemove={removeStop}
            onOptimizeDay={optimizeDay}
            onAddDay={() => setExtraDays(dayCount + 1)}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50 lg:flex-row">
      <aside className="order-2 flex min-h-0 flex-1 flex-col bg-white lg:order-1 lg:w-[400px] lg:flex-none lg:border-r lg:border-gray-200 xl:w-[440px]">{aside}</aside>

      <div className="relative order-1 h-[42vh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
        <ItineraryMap
          stops={effectiveStops}
          layout={effectiveLayout}
          days={days}
          focusDay={focusDay}
          selectedId={selectedId}
          hoverId={hoverId}
          roads={roads}
          onSelect={setSelectedId}
          renderPopup={renderPopup}
        />

        {previewPlan && (
          <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900/90 py-1.5 pl-4 pr-1.5 text-sm text-white shadow-lg backdrop-blur">
            <Sparkles className="h-4 w-4 text-purple-300" />
            <span>Previewing the AI plan</span>
            <button type="button" onClick={() => applyPlan(previewPlan)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-900 hover:bg-purple-100">
              Apply
            </button>
          </div>
        )}

        {stopList.length > 0 && located === 0 && (
          <div className="absolute inset-x-6 top-1/2 z-10 -translate-y-1/2 rounded-2xl bg-white/95 p-5 text-center shadow-lg">
            <MapPinOff className="mx-auto mb-2 h-6 w-6 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">None of these places have a map location yet.</p>
          </div>
        )}

        {undo && (
          <div role="status" className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-gray-900/95 py-2 pl-4 pr-2 text-sm text-white shadow-xl">
            <span className="max-w-[240px] truncate">{undo.label}</span>
            <button type="button" onClick={undoLast} className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25">
              <Undo2 className="h-3.5 w-3.5" /> Undo
            </button>
            <button type="button" onClick={() => setUndo(null)} aria-label="Dismiss" className="rounded-full p-1 text-white/60 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick, color, count }: { label: string; active: boolean; onClick: () => void; color?: string; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
      {label}
      {typeof count === 'number' && <span className={active ? 'text-white/70' : 'text-gray-400'}>{count}</span>}
    </button>
  );
}
