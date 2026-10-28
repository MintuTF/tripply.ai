'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, Minus, Plus, RotateCw, Send, Sparkles } from 'lucide-react';
import { dayColor, formatClock, type AIPlan, type PlanStop } from './model';

type Pace = 'relaxed' | 'balanced' | 'packed';

interface AIPlanPanelProps {
  stops: PlanStop[];
  stopsById: Record<string, PlanStop>;
  destination?: string;
  startDate?: string;
  initialDays: number;
  /** The plan currently being previewed on the map (null = none) */
  plan: AIPlan | null;
  onPlan: (plan: AIPlan | null) => void;
  onApply: (plan: AIPlan) => void;
  onClose: () => void;
}

const PACES: { id: Pace; label: string; hint: string }[] = [
  { id: 'relaxed', label: 'Relaxed', hint: '3-4 stops a day' },
  { id: 'balanced', label: 'Balanced', hint: '4-6 stops a day' },
  { id: 'packed', label: 'Packed', hint: '6-8 stops a day' },
];

const QUICK_FEEDBACK = ['Less walking', 'Start days later', 'More food stops', 'Keep days lighter', 'Sunset at a viewpoint'];

export function AIPlanPanel({ stops, stopsById, destination, startDate, initialDays, plan, onPlan, onApply, onClose }: AIPlanPanelProps) {
  const [days, setDays] = useState(Math.max(1, initialDays));
  const [pace, setPace] = useState<Pace>('balanced');
  const [preferences, setPreferences] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [versions, setVersions] = useState<AIPlan[]>([]);
  const [cursor, setCursor] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useCallback(
    async (opts: { feedback?: string; previous?: AIPlan }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('loading');
      setError('');
      try {
        const res = await fetch('/api/board/plan-itinerary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            destination,
            days,
            startDate,
            pace,
            preferences: preferences.trim() || undefined,
            feedback: opts.feedback,
            previous: opts.previous?.days.map((d) => ({ day: d.day, stops: d.stops.map((s) => ({ id: s.id, time: s.time })) })),
            places: stops.map((s) => ({
              id: s.id,
              name: s.name,
              type: s.type,
              lat: s.coords?.lat,
              lng: s.coords?.lng,
              rating: s.rating,
              hours: s.hours,
              note: s.note,
              currentDay: s.day || undefined,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Something went wrong');
        const next = data as AIPlan;
        // A new answer replaces anything after the version being viewed, like an undo history
        const list = [...versions.slice(0, versions.length ? cursor + 1 : 0), next];
        setVersions(list);
        setCursor(list.length - 1);
        onPlan(next);
        setFeedback('');
        setStatus('idle');
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError((e as Error).message || 'Something went wrong');
        setStatus('error');
      }
    },
    [destination, days, startDate, pace, preferences, stops, versions, cursor, onPlan]
  );

  const showVersion = (i: number) => {
    setCursor(i);
    onPlan(versions[i]);
  };

  // --------------------------------------------------------------------------
  // Step 1: options
  // --------------------------------------------------------------------------
  if (!plan && status !== 'loading') {
    return (
      <div className="flex h-full flex-col">
        <PanelHeader onClose={onClose} title="Plan with AI" subtitle="Get the best order for your confirmed places" />
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <p className="rounded-xl bg-purple-50 p-3 text-sm text-purple-900">
            The AI groups nearby places into the same day, orders each day without backtracking, and fits meal times and opening hours. You see why for every stop and can change anything before applying.
          </p>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">How many days?</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDays((d) => Math.max(1, d - 1))}
                aria-label="Fewer days"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-24 text-center text-lg font-bold text-gray-900">
                {days} {days === 1 ? 'day' : 'days'}
              </span>
              <button
                type="button"
                onClick={() => setDays((d) => Math.min(14, d + 1))}
                aria-label="More days"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-500">{stops.length} places to fit</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">Pace</label>
            <div className="grid grid-cols-3 gap-2">
              {PACES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPace(p.id)}
                  aria-pressed={pace === p.id}
                  className={`rounded-xl border p-2.5 text-left transition-colors ${pace === p.id ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="block text-sm font-semibold text-gray-900">{p.label}</span>
                  <span className="block text-[11px] text-gray-500">{p.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="plan-prefs" className="mb-2 block text-sm font-semibold text-gray-900">
              Anything to keep in mind? <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="plan-prefs"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="e.g. we prefer late mornings, love sunsets, traveling with a toddler"
              className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {error && <ErrorNote message={error} />}
        </div>
        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={() => generate({})}
            disabled={stops.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> Build my best itinerary
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Loading
  // --------------------------------------------------------------------------
  if (status === 'loading') {
    return (
      <div className="flex h-full flex-col">
        <PanelHeader onClose={onClose} title="Planning…" subtitle="Usually takes 5-10 seconds" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <div>
            <p className="font-semibold text-gray-900">Finding the best order</p>
            <p className="mt-1 text-sm text-gray-500">Grouping nearby places, matching meal times and opening hours.</p>
          </div>
          <button type="button" onClick={() => { abortRef.current?.abort(); setStatus('idle'); }} className="text-sm font-medium text-gray-500 hover:text-gray-800">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Step 2: the proposal
  // --------------------------------------------------------------------------
  const current = plan!;
  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        onClose={onClose}
        title="Your AI itinerary"
        subtitle="Preview only. Nothing changes until you apply it."
        extra={
          versions.length > 1 ? (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <button type="button" disabled={cursor === 0} onClick={() => showVersion(cursor - 1)} aria-label="Previous version" className="rounded p-1 hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              Version {cursor + 1} of {versions.length}
              <button type="button" disabled={cursor === versions.length - 1} onClick={() => showVersion(cursor + 1)} aria-label="Next version" className="rounded p-1 hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null
        }
      />

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {current.summary && (
          <div className="rounded-xl bg-purple-50 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-700">
              <Sparkles className="h-3.5 w-3.5" /> Why this plan
            </p>
            <p className="text-sm leading-relaxed text-purple-950">{current.summary}</p>
          </div>
        )}

        {current.warnings.length > 0 && (
          <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
            {current.warnings.map((w, i) => (
              <p key={i} className="flex items-start gap-2 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> {w}
              </p>
            ))}
          </div>
        )}

        {current.days.map((d) => (
          <section key={d.day}>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
              <span className="h-3 w-3 rounded-full" style={{ background: dayColor(d.day) }} />
              Day {d.day}
              {d.theme && <span className="font-medium text-gray-500">· {d.theme}</span>}
            </h3>
            <ol className="space-y-2">
              {d.stops.map((s, i) => {
                const stop = stopsById[s.id];
                if (!stop) return null;
                return (
                  <li key={s.id} className="flex gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: dayColor(d.day) }}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {stop.name}
                        {s.time && <span className="ml-2 text-xs font-normal text-gray-500">{formatClock(s.time)}</span>}
                      </p>
                      {s.reason && <p className="mt-0.5 text-[13px] leading-snug text-gray-600">{s.reason}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}

        {error && <ErrorNote message={error} />}
      </div>

      <div className="space-y-3 border-t border-gray-100 p-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-gray-700">Not quite right? Tell the AI what to change</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_FEEDBACK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => generate({ feedback: q, previous: current })}
                className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (feedback.trim()) generate({ feedback: feedback.trim(), previous: current });
            }}
            className="flex gap-2"
          >
            <input
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. move the dinner earlier on day 2"
              maxLength={400}
              aria-label="Feedback for the AI"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
            <button type="submit" disabled={!feedback.trim()} aria-label="Send feedback" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => generate({ previous: current, feedback: 'Give me a different arrangement with a fresh approach.' })}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCw className="h-4 w-4" /> Try another
          </button>
          <button
            type="button"
            onClick={() => onApply(current)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg"
          >
            <Check className="h-4 w-4" /> Apply this plan
          </button>
        </div>
      </div>
    </div>
  );
}

function PanelHeader({ title, subtitle, onClose, extra }: { title: string; subtitle: string; onClose: () => void; extra?: React.ReactNode }) {
  return (
    <header className="flex items-start gap-2 border-b border-gray-100 px-4 py-3">
      <button type="button" onClick={onClose} aria-label="Back to my itinerary" className="-ml-1.5 mt-0.5 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-gray-900">
          <Sparkles className="h-4 w-4 text-purple-600" /> {title}
        </h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      {extra}
    </header>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {message}
    </p>
  );
}
