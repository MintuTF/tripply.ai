'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, MapPin, Play, Plus, Star, Loader2, AlertCircle, RotateCw } from 'lucide-react';
import { useTravel } from '@/app/travel/context/TravelContext';
import { generateSlugFromDestination } from '@/lib/travel/url-utils';
import type { VideoPlaceMatch, VideoPlacesResult } from '@/types/video';

interface VideoPlacesPanelProps {
  videoId: string;
  title: string;
  channel?: string;
  city: string;
  result: VideoPlacesResult | null;
  status: 'loading' | 'done' | 'error';
  onRetry: () => void;
  /** Jump the player to this second */
  onSeek: (sec: number) => void;
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

export function VideoPlacesPanel({ videoId, title, channel, city, result, status, onRetry, onSeek }: VideoPlacesPanelProps) {
  const { state, addVideoPlaces } = useTravel();

  const onBoard = useMemo(() => new Set(state.draftCards.map((c) => c.placeData.id)), [state.draftCards]);

  const toItem = useCallback(
    (m: VideoPlaceMatch) => ({
      cardType: m.cardType,
      place: {
        ...m.place!,
        description: m.place!.description || m.note,
        source: { videoId, videoTitle: title, channel, startSec: m.startSec },
      },
    }),
    [videoId, title, channel]
  );

  const matched = (result?.places || []).filter((m) => m.place);
  const confident = matched.filter((m) => m.matchLevel !== 'check' && !onBoard.has(m.place!.id));
  const addedCount = matched.filter((m) => onBoard.has(m.place!.id)).length;
  const boardHref = city ? `/travel/${generateSlugFromDestination(city)}/board` : '/travel';

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-purple-100/50 dark:shadow-purple-900/20 overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-pink-500" />
            Places in this video
            {status === 'done' && result && result.places.length > 0 && (
              <span className="text-xs font-normal text-gray-500">{result.places.length}</span>
            )}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tap a time to watch that moment. Add a place to your Board.</p>
        </div>
        {confident.length > 1 && (
          <button
            onClick={() => addVideoPlaces(confident.map(toItem))}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add all {confident.length}
          </button>
        )}
      </div>

      {status === 'loading' && (
        <div className="px-5 pb-5" role="status">
          <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
            Reading the video and finding its places… this can take about 10 seconds.
          </p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 py-3 border-t border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="w-14 h-14 rounded-lg bg-purple-100 dark:bg-purple-900/30" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 rounded bg-purple-100 dark:bg-purple-900/30" />
                <div className="h-3 w-3/4 rounded bg-purple-100 dark:bg-purple-900/30" />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="px-5 pb-5">
          <p className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            We couldn&apos;t read this video right now.
          </p>
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 text-sm"
          >
            <RotateCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      )}

      {status === 'done' && result && (
        <>
          {!result.hasTranscript && (
            <p className="mx-5 mb-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
              This video has no captions, so we could only read its title and description. Some places may be missing.
            </p>
          )}
          {result.truncated && (
            <p className="mx-5 mb-2 text-xs text-gray-500">This is a long video, so places near the end may be missing.</p>
          )}

          {result.places.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-300">
              This video doesn&apos;t name specific places we could find. Try a video that lists spots, like &ldquo;3 days in {city || 'the city'}&rdquo;.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {result.places.map((m) => {
                const place = m.place;
                const isAdded = !!place && onBoard.has(place.id);
                return (
                  <li key={`${m.name}-${m.startSec}`} className="flex gap-3 px-5 py-3">
                    <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                      {place?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={place.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <MapPin className="w-5 h-5 text-purple-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{m.name}</p>
                        <button
                          onClick={() => onSeek(m.startSec)}
                          className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                          aria-label={`Watch ${m.name} at ${formatTime(m.startSec)}`}
                        >
                          <Play className="w-3 h-3" />
                          {formatTime(m.startSec)}
                        </button>
                      </div>

                      {m.note && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{m.note}</p>}

                      {place ? (
                        <>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            {place.rating > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {place.rating.toFixed(1)}
                              </span>
                            )}
                            {m.matchLevel === 'check' && (
                              <span className="text-amber-700 dark:text-amber-300">Is this it? Found as &ldquo;{place.name}&rdquo;</span>
                            )}
                          </div>
                          <button
                            onClick={() => addVideoPlaces([toItem(m)])}
                            disabled={isAdded}
                            className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              isAdded
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            {isAdded ? 'On your Board' : 'Add to Board'}
                          </button>
                        </>
                      ) : (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.name} ${city}`.trim())}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-300 hover:underline"
                        >
                          Not found on the map. Search it <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {addedCount > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3 bg-green-50/60 dark:bg-green-900/10">
              <p className="text-sm text-green-800 dark:text-green-200">
                {addedCount} {addedCount === 1 ? 'place' : 'places'} on your Board
              </p>
              <Link href={boardHref} className="text-sm font-medium text-purple-700 dark:text-purple-300 hover:underline">
                Open my Board →
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
