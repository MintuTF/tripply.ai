export type LatLng = { lat: number; lng: number };

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface RoadRoute {
  /** Street geometry to draw */
  line: LatLng[];
  km: number;
  minutes: number;
  mode: 'walk' | 'drive';
  /** One entry per hop between consecutive stops */
  legs: { km: number; minutes: number }[];
}

// Free public OpenStreetMap routing. Fine for light use; set NEXT_PUBLIC_ROUTING_URL to your own provider at scale.
const ROUTING_BASE = process.env.NEXT_PUBLIC_ROUTING_URL || 'https://routing.openstreetmap.de';

const routeCache = new Map<string, Promise<RoadRoute | null>>();

/** Street route through the points in order. Resolves to null when offline/blocked so callers can draw straight lines. */
export function fetchRoadRoute(coords: LatLng[]): Promise<RoadRoute | null> {
  if (coords.length < 2) return Promise.resolve(null);
  const pts = coords.slice(0, 25);
  const key = pts.map((c) => `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`).join('|');
  const cached = routeCache.get(key);
  if (cached) return cached;

  const promise = (async (): Promise<RoadRoute | null> => {
    const longestLeg = Math.max(...pts.slice(1).map((c, i) => haversineKm(pts[i], c)));
    const mode: RoadRoute['mode'] = longestLeg > 3 ? 'drive' : 'walk';
    const path = mode === 'walk' ? 'routed-foot/route/v1/foot' : 'routed-car/route/v1/driving';
    const url = `${ROUTING_BASE}/${path}/${pts.map((c) => `${c.lng},${c.lat}`).join(';')}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      const data = await res.json();
      const route = data?.code === 'Ok' ? data.routes?.[0] : null;
      if (!route?.geometry?.coordinates?.length) return null;
      return {
        line: (route.geometry.coordinates as [number, number][]).map(([lng, lat]) => ({ lat, lng })),
        km: route.distance / 1000,
        minutes: route.duration / 60,
        mode,
        legs: (route.legs || []).map((l: { distance: number; duration: number }) => ({ km: l.distance / 1000, minutes: l.duration / 60 })),
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })().then((r) => {
    if (!r) routeCache.delete(key); // retry later if it failed
    return r;
  });

  routeCache.set(key, promise);
  return promise;
}

/** Rough hop estimate when no street route is available: straight line x 1.3, walking pace (driving for long hops) */
export function estimateLeg(a: LatLng, b: LatLng): { km: number; minutes: number; mode: 'walk' | 'drive' } {
  const km = haversineKm(a, b) * 1.3;
  const mode = km > 2.5 ? 'drive' : 'walk';
  const kmh = mode === 'walk' ? 4.8 : 28;
  return { km, minutes: (km / kmh) * 60, mode };
}

/**
 * Shortest open path through the points: nearest-neighbour from the start, then 2-opt improvement.
 * Returns the new order as indices into `points`. The first point stays first when `keepFirst` is true.
 */
export function optimizeOrder(points: LatLng[], keepFirst = true): number[] {
  const n = points.length;
  if (n <= 2) return points.map((_, i) => i);
  const d = (i: number, j: number) => haversineKm(points[i], points[j]);

  // Start from the first point (or the point farthest from the centre, so the path begins at an edge)
  let start = 0;
  if (!keepFirst) {
    const cx = points.reduce((s, p) => s + p.lat, 0) / n;
    const cy = points.reduce((s, p) => s + p.lng, 0) / n;
    start = points.reduce((best, p, i) => (haversineKm({ lat: cx, lng: cy }, p) > haversineKm({ lat: cx, lng: cy }, points[best]) ? i : best), 0);
  }

  const order = [start];
  const left = new Set(points.map((_, i) => i).filter((i) => i !== start));
  while (left.size) {
    const last = order[order.length - 1];
    let next = -1;
    let best = Infinity;
    left.forEach((i) => {
      const dist = d(last, i);
      if (dist < best) {
        best = dist;
        next = i;
      }
    });
    order.push(next);
    left.delete(next);
  }

  // 2-opt on the open path (position 0 fixed)
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 50) {
    improved = false;
    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const before = d(order[i - 1], order[i]) + (j + 1 < n ? d(order[j], order[j + 1]) : 0);
        const after = d(order[i - 1], order[j]) + (j + 1 < n ? d(order[i], order[j + 1]) : 0);
        if (after + 1e-9 < before) {
          const reversed = order.slice(i, j + 1).reverse();
          order.splice(i, j - i + 1, ...reversed);
          improved = true;
        }
      }
    }
  }
  return order;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}
