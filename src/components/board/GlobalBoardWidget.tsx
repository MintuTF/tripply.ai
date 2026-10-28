'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bed, Camera, LayoutDashboard, MapPin, Play, ShoppingBag, Star, Utensils, X } from 'lucide-react';
import { useTripContext } from '@/context/TripContext';
import { BOARD_CHANGED_EVENT, readBoardSnapshot, type BoardSnapshot } from '@/lib/travel/boardSnapshot';
import { generateSlugFromDestination } from '@/lib/travel/url-utils';
import type { DraftCard } from '@/lib/travel/types';

// Pages that already have their own full-screen planning UI (or are not for visitors)
const HIDDEN_PREFIXES = ['/auth', '/manage-portal', '/shared', '/itinerary', '/research', '/plan', '/packing', '/trips'];

const TYPE_META: Record<string, { label: string; icon: typeof MapPin }> = {
  hotel: { label: 'Hotels', icon: Bed },
  spot: { label: 'Things to do', icon: Camera },
  activity: { label: 'Activities', icon: Camera },
  food: { label: 'Food & drink', icon: Utensils },
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface Row {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
  rating?: number;
  day?: number;
  time?: string;
  order?: number;
  source?: DraftCard['placeData']['source'];
  price?: number;
}

export function GlobalBoardWidget() {
  const pathname = usePathname() || '/';
  const { cards: tripStoreCards } = useTripContext();
  const [snapshot, setSnapshot] = useState<BoardSnapshot>({ trip: null, cards: [] });
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => setSnapshot(readBoardSnapshot()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(BOARD_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh); // other tabs
    return () => {
      window.removeEventListener(BOARD_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  // Close when the page changes, and on Escape
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const { places, shopping } = useMemo(() => {
    const places: Row[] = snapshot.cards.map((c) => ({
      id: c.id,
      name: c.placeData.name,
      type: c.type,
      imageUrl: c.placeData.imageUrl,
      rating: c.placeData.rating,
      day: c.day,
      time: c.time_slot,
      order: c.order,
      source: c.placeData.source,
    }));
    const shopping: Row[] = (tripStoreCards || [])
      .filter((c) => c.type === 'product')
      .map((c) => {
        const p = (c.payload_json || {}) as { name?: string; imageUrl?: string; price?: number };
        return { id: c.id, name: p.name || 'Shop item', type: 'product', imageUrl: p.imageUrl, price: p.price };
      });
    return { places, shopping };
  }, [snapshot.cards, tripStoreCards]);

  const groups = useMemo(() => {
    const out: { key: string; title: string; rows: Row[] }[] = [];
    const scheduled = places.filter((r) => r.day);
    const days = Array.from(new Set(scheduled.map((r) => r.day as number))).sort((a, b) => a - b);
    for (const d of days) {
      out.push({
        key: `day-${d}`,
        title: `Day ${d}`,
        rows: scheduled
          .filter((r) => r.day === d)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      });
    }
    const ideas = places.filter((r) => !r.day);
    for (const type of ['hotel', 'spot', 'activity', 'food']) {
      const rows = ideas.filter((r) => r.type === type);
      if (rows.length) out.push({ key: type, title: days.length ? `Ideas · ${TYPE_META[type].label}` : TYPE_META[type].label, rows });
    }
    if (shopping.length) out.push({ key: 'shop', title: 'Shopping list', rows: shopping });
    return out;
  }, [places, shopping]);

  const total = places.length + shopping.length;
  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) || /\/board\/?$/.test(pathname);
  if (hidden || total === 0) return null;

  const destination = snapshot.trip?.destination || '';
  const boardHref = destination ? `/travel/${generateSlugFromDestination(destination)}/board` : '/travel';
  const title = snapshot.trip?.name || 'My Board';

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        aria-label={`Open my Board, ${total} ${total === 1 ? 'item' : 'items'}`}
        className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 pl-4 pr-3 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-400/40 hover:shadow-xl"
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>My Board</span>
        <span className="min-w-6 h-6 px-1.5 rounded-full bg-white/25 text-sm font-bold flex items-center justify-center">{total}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[70] bg-black/40"
              aria-hidden="true"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="My Board"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed right-0 top-0 z-[80] h-full w-full sm:w-[400px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
            >
              <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {places.length} {places.length === 1 ? 'place' : 'places'}
                    {shopping.length > 0 && ` · ${shopping.length} shop ${shopping.length === 1 ? 'item' : 'items'}`}
                    {destination && ` · ${destination}`}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close Board"
                  className="p-2 -m-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-3">
                {groups.map((g) => (
                  <section key={g.key} className="mb-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                      {g.title} <span className="font-normal">({g.rows.length})</span>
                    </h3>
                    <ul className="space-y-2">
                      {g.rows.map((r, rowIndex) => {
                        const Icon = r.type === 'product' ? ShoppingBag : TYPE_META[r.type]?.icon || MapPin;
                        return (
                          <li key={`${g.key}-${rowIndex}-${r.id ?? r.name}`} className="flex gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                            <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                              {r.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={r.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                              ) : (
                                <Icon className="w-5 h-5 text-purple-300" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                {r.time && <span>{r.time}</span>}
                                {r.rating ? (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    {r.rating.toFixed(1)}
                                  </span>
                                ) : null}
                                {r.price ? <span>${r.price.toFixed(2)}</span> : null}
                              </div>
                              {r.source && (
                                <Link
                                  href={`/travel/video/${r.source.videoId}${destination ? `?city=${encodeURIComponent(destination)}` : ''}`}
                                  className="mt-1 inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-300 hover:underline max-w-full"
                                >
                                  <Play className="w-3 h-3 shrink-0" />
                                  <span className="truncate">
                                    From video{r.source.startSec !== undefined ? ` at ${formatTime(r.source.startSec)}` : ''}
                                    {r.source.channel ? ` · ${r.source.channel}` : ''}
                                  </span>
                                </Link>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>

              <footer className="p-4 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href={boardHref}
                  className="block w-full text-center px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg transition-shadow"
                >
                  Open full Board to edit &amp; download PDF
                </Link>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
