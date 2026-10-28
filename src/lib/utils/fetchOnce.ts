const inflight = new Map<string, Promise<unknown>>();
const results = new Map<string, { value: unknown; at: number }>();

/**
 * GET JSON with page-level de-duplication: identical URLs requested while one is in flight, or
 * within `ttlMs` of finishing, share a single network request. Several components often ask for
 * the same data on mount, and each duplicate would otherwise reach a paid backend.
 */
export function fetchJsonOnce<T>(url: string, ttlMs = 5 * 60 * 1000): Promise<T> {
  const cached = results.get(url);
  if (cached && Date.now() - cached.at < ttlMs) {
    return Promise.resolve(cached.value as T);
  }

  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;

  const request = fetch(url)
    .then(async (res) => {
      const value = await res.json();
      if (res.ok) results.set(url, { value, at: Date.now() });
      return value as T;
    })
    .finally(() => inflight.delete(url));

  inflight.set(url, request);
  return request;
}
