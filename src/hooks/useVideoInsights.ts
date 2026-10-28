'use client';

import { useCallback, useEffect, useState } from 'react';
import type { VideoPlacesResult } from '@/types/video';

/**
 * Reads a video (captions) once and returns its summary, key points, tips and named places.
 * Pass `title: undefined` to wait (e.g. until the video details have loaded).
 */
export function useVideoInsights(params: { videoId?: string; title?: string; description?: string; city?: string }) {
  const { videoId, title, description = '', city = '' } = params;
  const [result, setResult] = useState<VideoPlacesResult | null>(null);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!videoId || !title) return;
    const controller = new AbortController();
    setResult(null);
    setStatus('loading');
    (async () => {
      try {
        const res = await fetch(`/api/travel/videos/${videoId}/places`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, city }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        setResult(await res.json());
        setStatus('done');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setStatus('error');
      }
    })();
    return () => controller.abort();
  }, [videoId, title, description, city, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { result, status, retry };
}
