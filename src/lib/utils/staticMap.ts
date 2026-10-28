export interface MapPoint {
  lat: number;
  lng: number;
  /** Text inside the pin (usually the stop number) */
  label: string;
  color: string;
  /** Short place name drawn next to the pin when `labels` is on */
  name?: string;
  /** Smaller pin without a number (used on overview maps) */
  dot?: boolean;
}

export interface MapRoute {
  /** The path to draw: street geometry, or just the stops in order as a fallback */
  line: { lat: number; lng: number }[];
  color: string;
}

export interface StaticMapOptions {
  points: MapPoint[];
  routes?: MapRoute[];
  /** Layout size in CSS px. The image is rendered at `scale` times this for a sharp print */
  width: number;
  height: number;
  scale?: number;
  /** Draw short place names next to the pins */
  labels?: boolean;
  /** Direction arrows along the routes */
  arrows?: boolean;
  /** Route stroke width in layout px (default 6.5) */
  lineWidth?: number;
}

const TILE_SIZE = 256;
const MAX_FIT_ZOOM = 16;

// OpenStreetMap's public tiles are fine for occasional PDF exports. For heavy production use, point this
// at a tile provider you have an account with (e.g. Mapbox, MapTiler) via NEXT_PUBLIC_MAP_TILE_URL.
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION || '© OpenStreetMap contributors';

type LatLng = { lat: number; lng: number };

function project(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

// Tiles are shared by every map in an export (days in one city overlap a lot), so fetch each only once
const tileCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadTile(url: string): Promise<HTMLImageElement | null> {
  const cached = tileCache.get(url);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 8000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  }).then((img) => {
    if (!img) tileCache.delete(url); // let a later export retry a failed tile
    return img;
  });
  tileCache.set(url, promise);
  return promise;
}

function fitZoom(coords: LatLng[], width: number, height: number, padX: number, padY: number): number {
  if (coords.length < 2) return MAX_FIT_ZOOM;
  for (let zoom = MAX_FIT_ZOOM; zoom >= 1; zoom--) {
    const projected = coords.map((c) => project(c.lat, c.lng, zoom));
    const xs = projected.map((p) => p.x);
    const ys = projected.map((p) => p.y);
    if (
      Math.max(...xs) - Math.min(...xs) <= width - 2 * padX &&
      Math.max(...ys) - Math.min(...ys) <= height - 2 * padY
    ) {
      return zoom;
    }
  }
  return 1;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type Box = { x: number; y: number; w: number; h: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 3 && ctx.measureText(`${t}...`).width > maxWidth) t = t.slice(0, -1);
  return `${t.trim()}...`;
}

/**
 * Render a clean, print-ready map to a JPEG data URL: muted street map, bold route lines that follow the
 * given path, direction arrows, numbered pins and (optionally) place-name labels.
 * Runs in the browser. Returns null if no map could be produced, so callers can skip the map gracefully.
 */
export async function renderStaticMap({
  points,
  routes = [],
  width,
  height,
  scale = 2,
  labels = false,
  arrows = false,
  lineWidth = 6.5,
}: StaticMapOptions): Promise<string | null> {
  if (typeof document === 'undefined' || points.length === 0) return null;

  try {
    const s = scale;
    const coords: LatLng[] = [...points, ...routes.flatMap((r) => r.line)];

    // Choose the zoom on the layout size, then render one level deeper per doubling of `scale` for sharpness
    const padX = labels ? 90 : 56;
    const padY = labels ? 56 : 48;
    const baseZoom = fitZoom(coords, width, height, padX, padY);
    const zoom = baseZoom + Math.round(Math.log2(s));

    const projected = coords.map((c) => project(c.lat, c.lng, zoom));
    const xs = projected.map((p) => p.x);
    const ys = projected.map((p) => p.y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const W = Math.round(width * s);
    const H = Math.round(height * s);
    const left = centerX - W / 2;
    const top = centerY - H / 2;
    const toScreen = (c: LatLng) => {
      const p = project(c.lat, c.lng, zoom);
      return { x: p.x - left, y: p.y - top };
    };

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#eef0f3';
    ctx.fillRect(0, 0, W, H);

    // --- base map ---------------------------------------------------------
    const tilesPerSide = 2 ** zoom;
    const firstX = Math.floor(left / TILE_SIZE);
    const lastX = Math.floor((left + W) / TILE_SIZE);
    const firstY = Math.max(0, Math.floor(top / TILE_SIZE));
    const lastY = Math.min(tilesPerSide - 1, Math.floor((top + H) / TILE_SIZE));

    // Mute the colours so the route and pins are what the eye follows
    const canFilter = 'filter' in ctx;
    if (canFilter) (ctx as CanvasRenderingContext2D & { filter: string }).filter = 'grayscale(0.9) contrast(0.88) brightness(1.07)';

    let tilesDrawn = 0;
    const jobs: Promise<void>[] = [];
    for (let tx = firstX; tx <= lastX; tx++) {
      for (let ty = firstY; ty <= lastY; ty++) {
        const wrappedX = ((tx % tilesPerSide) + tilesPerSide) % tilesPerSide;
        const url = TILE_URL.replace('{z}', String(zoom)).replace('{x}', String(wrappedX)).replace('{y}', String(ty));
        jobs.push(
          loadTile(url).then((img) => {
            if (!img) return;
            ctx.drawImage(img, tx * TILE_SIZE - left, ty * TILE_SIZE - top, TILE_SIZE, TILE_SIZE);
            tilesDrawn++;
          })
        );
      }
    }
    await Promise.all(jobs);
    if (tilesDrawn === 0) return null;
    if (canFilter) (ctx as CanvasRenderingContext2D & { filter: string }).filter = 'none';

    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillRect(0, 0, W, H);

    // --- routes -----------------------------------------------------------
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const pinScreen = points.map(toScreen);

    routes.forEach((route) => {
      if (route.line.length < 2) return;
      const pts = route.line.map(toScreen);
      const trace = () => {
        ctx.beginPath();
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      };
      trace();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = (lineWidth + 4.5) * s;
      ctx.stroke();
      trace();
      ctx.strokeStyle = route.color;
      ctx.lineWidth = lineWidth * s;
      ctx.stroke();

      if (arrows) {
        const spacing = 130 * s;
        let travelled = spacing / 2;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1];
          const b = pts[i];
          const segLen = Math.hypot(b.x - a.x, b.y - a.y);
          if (segLen === 0) continue;
          let along = travelled;
          while (along <= segLen) {
            const t = along / segLen;
            const px = a.x + (b.x - a.x) * t;
            const py = a.y + (b.y - a.y) * t;
            const nearPin = pinScreen.some((p) => Math.hypot(p.x - px, p.y - py) < 26 * s);
            if (!nearPin) {
              const angle = Math.atan2(b.y - a.y, b.x - a.x);
              ctx.save();
              ctx.translate(px, py);
              ctx.rotate(angle);
              ctx.beginPath();
              ctx.moveTo(-3.2 * s, -3.6 * s);
              ctx.lineTo(2.4 * s, 0);
              ctx.lineTo(-3.2 * s, 3.6 * s);
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2.1 * s;
              ctx.stroke();
              ctx.restore();
            }
            along += spacing;
          }
          travelled = along - segLen;
        }
      }
    });

    // --- pins -------------------------------------------------------------
    const occupied: Box[] = [];
    // Draw in reverse so lower numbers sit on top when pins overlap
    for (let i = points.length - 1; i >= 0; i--) {
      const { x, y } = pinScreen[i];
      const pt = points[i];
      const r = (pt.dot ? 7 : 14) * s;

      ctx.save();
      ctx.shadowColor = 'rgba(15,23,42,0.35)';
      ctx.shadowBlur = 6 * s;
      ctx.shadowOffsetY = 2 * s;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = pt.color;
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.lineWidth = (pt.dot ? 2.2 : 3) * s;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      if (!pt.dot) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${(pt.label.length > 2 ? 11 : 15) * s}px Helvetica, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pt.label, x, y + 0.6 * s);
      }
      occupied.push({ x: x - r, y: y - r, w: r * 2, h: r * 2 });
    }

    // --- labels (placed so they do not cover pins or each other) ----------
    if (labels) {
      ctx.font = `600 ${11 * s}px Helvetica, Arial, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      points.forEach((pt, i) => {
        if (!pt.name || pt.dot) return;
        const { x, y } = pinScreen[i];
        const text = truncate(ctx, pt.name, 150 * s);
        const w = ctx.measureText(text).width + 14 * s;
        const h = 21 * s;
        const r = 14 * s;
        const gap = 6 * s;
        const candidates: Box[] = [
          { x: x + r + gap, y: y - h / 2, w, h },
          { x: x - r - gap - w, y: y - h / 2, w, h },
          { x: x - w / 2, y: y - r - gap - h, w, h },
          { x: x - w / 2, y: y + r + gap, w, h },
          // diagonals and shifted sides, tried when a cluster of stops crowds the four spots above
          { x: x + r * 0.6, y: y - r - gap - h, w, h },
          { x: x - r * 0.6 - w, y: y - r - gap - h, w, h },
          { x: x + r * 0.6, y: y + r + gap, w, h },
          { x: x - r * 0.6 - w, y: y + r + gap, w, h },
          { x: x + r + gap, y: y - h * 1.4, w, h },
          { x: x + r + gap, y: y + h * 0.4, w, h },
          { x: x - r - gap - w, y: y - h * 1.4, w, h },
          { x: x - r - gap - w, y: y + h * 0.4, w, h },
        ];
        const spot = candidates.find(
          (c) => c.x >= 4 * s && c.y >= 4 * s && c.x + c.w <= W - 4 * s && c.y + c.h <= H - 18 * s && !occupied.some((o) => overlaps(c, o))
        );
        if (!spot) return;
        occupied.push(spot);

        ctx.save();
        ctx.shadowColor = 'rgba(15,23,42,0.25)';
        ctx.shadowBlur = 4 * s;
        ctx.shadowOffsetY = 1 * s;
        roundRectPath(ctx, spot.x, spot.y, spot.w, spot.h, 6 * s);
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#0f172a';
        ctx.fillText(text, spot.x + 7 * s, spot.y + spot.h / 2 + 0.5 * s);
      });
    }

    // --- attribution ------------------------------------------------------
    ctx.font = `${9 * s}px Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    const attrWidth = ctx.measureText(ATTRIBUTION).width;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(W - attrWidth - 10 * s, H - 14 * s, attrWidth + 10 * s, 14 * s);
    ctx.fillStyle = '#475569';
    ctx.fillText(ATTRIBUTION, W - 5 * s, H - 2.5 * s);

    return canvas.toDataURL('image/jpeg', 0.86);
  } catch (error) {
    console.error('[StaticMap] Failed to render map:', error);
    return null;
  }
}
