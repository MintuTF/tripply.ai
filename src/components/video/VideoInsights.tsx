'use client';

import { AlertTriangle, Lightbulb, Play, Sparkles } from 'lucide-react';
import type { VideoNote, VideoPlacesResult } from '@/types/video';

type Status = 'loading' | 'done' | 'error';

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function NoteList({ notes, tone, onSeek }: { notes: VideoNote[]; tone: 'purple' | 'amber'; onSeek: (sec: number) => void }) {
  return (
    <ul className="space-y-2.5">
      {notes.map((n, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'amber' ? 'bg-amber-500' : 'bg-purple-500'}`} />
          <span className="flex-1 leading-relaxed">{n.text}</span>
          {n.startSec !== undefined && n.startSec > 0 && (
            <button
              onClick={() => onSeek(n.startSec!)}
              className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-purple-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-purple-900/40"
              aria-label={`Watch at ${formatTime(n.startSec)}`}
            >
              <Play className="h-3 w-3" />
              {formatTime(n.startSec)}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

const CARD = 'bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-purple-100/50 dark:shadow-purple-900/20';

/** What the video covers + the key points it makes */
export function VideoOverviewCard({
  result,
  status,
  onSeek,
}: {
  result: VideoPlacesResult | null;
  status: Status;
  onSeek: (sec: number) => void;
}) {
  if (status === 'loading') {
    return (
      <div className={`${CARD} space-y-3 p-5`} aria-hidden="true">
        {[100, 92, 70].map((w) => (
          <div key={w} className="h-3.5 animate-pulse rounded bg-purple-100 dark:bg-purple-900/30" style={{ width: `${w}%` }} />
        ))}
        <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700">
          {[85, 78, 90].map((w) => (
            <div key={w} className="h-3 animate-pulse rounded bg-purple-50 dark:bg-purple-900/20" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }
  if (status === 'error' || !result || (!result.summary && result.takeaways.length === 0)) return null;

  return (
    <section className={`${CARD} overflow-hidden`}>
      {result.summary && (
        <div className="p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-purple-500" />
            About this video
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{result.summary}</p>
          {!result.hasTranscript && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              No captions found, so this is based on the title and description only.
            </p>
          )}
        </div>
      )}
      {result.takeaways.length > 0 && (
        <div className="border-t border-gray-100 p-5 dark:border-gray-700">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Key points</h3>
          <NoteList notes={result.takeaways} tone="purple" onSeek={onSeek} />
        </div>
      )}
    </section>
  );
}

/** Practical advice and warnings the video gives */
export function VideoGoodToKnowCard({
  result,
  status,
  onSeek,
}: {
  result: VideoPlacesResult | null;
  status: Status;
  onSeek: (sec: number) => void;
}) {
  if (status !== 'done' || !result || (result.tips.length === 0 && result.avoid.length === 0)) return null;

  return (
    <section className={`${CARD} overflow-hidden`}>
      {result.tips.length > 0 && (
        <div className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Lightbulb className="h-4 w-4 text-purple-500" />
            Good to know before you go
          </h3>
          <NoteList notes={result.tips} tone="purple" onSeek={onSeek} />
        </div>
      )}
      {result.avoid.length > 0 && (
        <div className={`p-5 ${result.tips.length > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Watch out for
          </h3>
          <NoteList notes={result.avoid} tone="amber" onSeek={onSeek} />
        </div>
      )}
    </section>
  );
}
