'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Car, ChevronDown, ChevronUp, Eye, EyeOff, Footprints, GripVertical, MapPinOff, MoreVertical, Plus, Route as RouteIcon, Sparkles, X } from 'lucide-react';
import { formatMinutes } from '@/lib/travel/routeTools';
import { dayColor, formatClock, resolveDrop, type Layout, type PlanStop } from './model';

export interface Leg {
  km: number;
  minutes: number;
  mode: 'walk' | 'drive';
  /** True when estimated from straight-line distance rather than a street route */
  estimated: boolean;
}

interface DayPlanListProps {
  stops: Record<string, PlanStop>;
  layout: Layout;
  days: number[]; // day numbers to show, 0 (unscheduled) last
  dayDates: Record<number, string>;
  focusDay: number | 'all';
  selectedId: string | null;
  hoverId: string | null;
  legs: Record<string, Leg | undefined>;
  dayStats: Record<number, { km: number; minutes: number } | undefined>;
  reasons: Record<string, string>;
  readOnly: boolean;
  canAddDay: boolean;
  onFocusDay: (day: number | 'all') => void;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onMove: (id: string, toDay: number, toIndex: number) => void;
  onNudge: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  onOptimizeDay: (day: number) => void;
  onAddDay: () => void;
}

const dayTitle = (day: number) => (day === 0 ? 'Not scheduled yet' : `Day ${day}`);

// ---------------------------------------------------------------------------
// One row
// ---------------------------------------------------------------------------
function StopRow({
  stop,
  day,
  index,
  count,
  days,
  selected,
  hovered,
  reason,
  readOnly,
  onSelect,
  onHover,
  onNudge,
  onMoveToDay,
  onRemove,
}: {
  stop: PlanStop;
  day: number;
  index: number;
  count: number;
  days: number[];
  selected: boolean;
  hovered: boolean;
  reason?: string;
  readOnly: boolean;
  onSelect: () => void;
  onHover: (on: boolean) => void;
  onNudge: (dir: -1 | 1) => void;
  onMoveToDay: (day: number) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id, disabled: readOnly });
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const color = dayColor(day);
  const time = formatClock(stop.time);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = 208;
    setMenu({ top: Math.min(r.bottom + 4, window.innerHeight - 330), left: Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)) });
  };

  return (
    <div
      role="listitem"
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
      data-stop-id={stop.id}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div
        onClick={onSelect}
        className={`group flex cursor-pointer items-center gap-2 rounded-xl border bg-white p-2 pr-1 transition-all ${
          selected ? 'border-transparent shadow-md ring-2' : hovered ? 'border-gray-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'
        }`}
        style={selected ? { boxShadow: `0 0 0 2px ${color}, 0 4px 12px rgba(15,23,42,.1)` } : undefined}
      >
        {!readOnly && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Drag ${stop.name}`}
            className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-gray-300 hover:text-gray-500 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: color }}
          aria-hidden="true"
        >
          {day > 0 ? index + 1 : ''}
        </span>

        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {stop.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={stop.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <MapPinOff className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{stop.name}</p>
          <p className="truncate text-xs text-gray-500">
            {[time, stop.typeLabel, stop.rating ? `${stop.rating.toFixed(1)} rated` : ''].filter(Boolean).join('  ·  ')}
          </p>
          {!stop.coords && <p className="text-[11px] font-medium text-amber-600">Not on the map (no location)</p>}
          {reason && (
            <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-purple-700">
              <Sparkles className="mt-px h-3 w-3 shrink-0" />
              <span className="line-clamp-2">{reason}</span>
            </p>
          )}
        </div>

        {!readOnly && (
          <button
            ref={btnRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (menu) setMenu(null);
              else openMenu();
            }}
            aria-label={`Options for ${stop.name}`}
            aria-haspopup="menu"
            aria-expanded={!!menu}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        )}
      </div>

      {menu &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setMenu(null)} />
            <div
              role="menu"
              className="fixed z-[91] w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-xl"
              style={{ top: menu.top, left: menu.left }}
            >
              <button
                role="menuitem"
                disabled={index === 0}
                onClick={() => {
                  onNudge(-1);
                  setMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronUp className="h-4 w-4" /> Move earlier
              </button>
              <button
                role="menuitem"
                disabled={index === count - 1}
                onClick={() => {
                  onNudge(1);
                  setMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronDown className="h-4 w-4" /> Move later
              </button>
              <div className="my-1 border-t border-gray-100" />
              <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Move to</p>
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {days.map((d) => (
                  <button
                    key={d}
                    role="menuitem"
                    disabled={d === day}
                    onClick={() => {
                      onMoveToDay(d);
                      setMenu(null);
                    }}
                    className="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-default disabled:opacity-100"
                    style={
                      d === day
                        ? { background: dayColor(d), color: '#fff', borderColor: dayColor(d) }
                        : { color: dayColor(d), borderColor: `${dayColor(d)}66` }
                    }
                  >
                    {d === 0 ? 'Unscheduled' : `Day ${d}`}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100" />
              <button
                role="menuitem"
                onClick={() => {
                  onRemove();
                  setMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" /> Remove from plan
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One day
// ---------------------------------------------------------------------------
function DaySection({
  day,
  ids,
  props,
}: {
  day: number;
  ids: string[];
  props: DayPlanListProps;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day}` });
  const { stops, focusDay, dayDates, dayStats, legs, readOnly } = props;
  const color = dayColor(day);
  const stat = dayStats[day];
  const isFocused = focusDay === day;

  return (
    <section ref={setNodeRef} aria-label={dayTitle(day)} className={`rounded-2xl border bg-gray-50/70 p-2 transition-colors ${isOver ? 'border-purple-300 bg-purple-50/60' : 'border-gray-200'}`}>
      <header className="mb-2 flex items-center gap-2 px-1">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-baseline gap-2 text-sm font-bold text-gray-900">
            {dayTitle(day)}
            {dayDates[day] && <span className="text-xs font-normal text-gray-500">{dayDates[day]}</span>}
          </h3>
          <p className="text-[11px] text-gray-500">
            {ids.length} {ids.length === 1 ? 'stop' : 'stops'}
            {stat && stat.km > 0 ? `  ·  ${stat.km.toFixed(1)} km  ·  ~${formatMinutes(stat.minutes)} travelling` : ''}
          </p>
        </div>
        {day > 0 && (
          <>
            {!readOnly && ids.length > 2 && (
              <button
                type="button"
                onClick={() => props.onOptimizeDay(day)}
                title="Reorder this day for the shortest route"
                className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-gray-600 hover:bg-white hover:text-purple-700"
              >
                <RouteIcon className="h-3.5 w-3.5" /> Shortest route
              </button>
            )}
            <button
              type="button"
              onClick={() => props.onFocusDay(isFocused ? 'all' : day)}
              title={isFocused ? 'Show all days on the map' : 'Show only this day on the map'}
              aria-pressed={isFocused}
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${isFocused ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-400 hover:bg-white hover:text-gray-700'}`}
            >
              {isFocused ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </>
        )}
      </header>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div role="list">
          {ids.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 px-3 py-4 text-center text-xs text-gray-400">
              {day === 0 ? 'Everything is scheduled' : 'Drag a place here, or use the ⋮ menu → Move to'}
            </div>
          )}
          {ids.map((id, i) => {
            const stop = stops[id];
            if (!stop) return null;
            const leg = legs[id];
            return (
              <div key={id}>
                <StopRow
                  stop={stop}
                  day={day}
                  index={i}
                  count={ids.length}
                  days={props.days}
                  selected={props.selectedId === id}
                  hovered={props.hoverId === id}
                  reason={props.reasons[id]}
                  readOnly={readOnly}
                  onSelect={() => props.onSelect(props.selectedId === id ? null : id)}
                  onHover={(on) => props.onHover(on ? id : null)}
                  onNudge={(dir) => props.onNudge(id, dir)}
                  onMoveToDay={(d) => props.onMove(id, d, 9999)}
                  onRemove={() => props.onRemove(id)}
                />
                {day > 0 && i < ids.length - 1 && (
                  <div className="flex items-center gap-2 py-1 pl-7 text-[11px] text-gray-400" aria-hidden={!leg}>
                    <span className="h-4 w-px bg-gray-300" style={{ marginLeft: 3 }} />
                    {leg && (
                      <span className="inline-flex items-center gap-1">
                        {leg.mode === 'walk' ? <Footprints className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                        {leg.estimated ? '~' : ''}
                        {formatMinutes(leg.minutes)} · {leg.km.toFixed(1)} km
                      </span>
                    )}
                  </div>
                )}
                {(day === 0 || i === ids.length - 1) && <div className="h-1.5" />}
              </div>
            );
          })}
        </div>
      </SortableContext>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The list
// ---------------------------------------------------------------------------
export function DayPlanList(props: DayPlanListProps) {
  const { layout, days, stops, readOnly } = props;
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Scroll the list to the selected stop (when it was picked on the map)
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!props.selectedId) return;
    scroller.current?.querySelector(`[data-stop-id="${window.CSS.escape(props.selectedId)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [props.selectedId]);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const drop = resolveDrop(layout, String(active.id), String(over.id));
    if (drop) props.onMove(String(active.id), drop.toDay, drop.toIndex);
  };

  const active = activeId ? stops[activeId] : null;

  return (
    <div ref={scroller} className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {days.map((d) => (
          <DaySection key={d} day={d} ids={layout[d] || []} props={props} />
        ))}
        <DragOverlay>
          {active ? (
            <div className="flex items-center gap-2 rounded-xl border border-purple-300 bg-white p-2 shadow-2xl">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <div className="h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {active.imageUrl && <img src={active.imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <p className="max-w-[220px] truncate text-sm font-semibold text-gray-900">{active.name}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {props.canAddDay && !readOnly && (
        <button
          type="button"
          onClick={props.onAddDay}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
        >
          <Plus className="h-4 w-4" /> Add day
        </button>
      )}
    </div>
  );
}
