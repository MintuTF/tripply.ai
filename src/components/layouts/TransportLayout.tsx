'use client';

import { Layout } from '@/types';
import { Plane, Train, Bus, TrendingUp } from 'lucide-react';

interface TransportLayoutProps {
  data: any;
  layout: Layout;
  onLayoutChange?: (intent: string) => void;
}

/**
 * TransportLayout - Flight/train options with pricing trends
 * Shows when user asks about getting to a destination
 */
export function TransportLayout({ data, layout }: TransportLayoutProps) {
  const routes = data.routes || [];
  const from = data.from || 'Your location';
  const to = data.to || data.destination;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-bold">
          {from} → {to}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {routes.length} transport options available
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Route Cards */}
          {routes.length > 0 ? (
            routes.map((route: any, i: number) => (
              <RouteCard key={i} route={route} />
            ))
          ) : (
            <div className="space-y-4">
              {/* Default placeholder routes */}
              <RouteCard
                route={{
                  mode: 'flight',
                  duration: '2h 30m',
                  price: 150,
                  provider: 'Multiple airlines',
                  details: 'Direct flights available',
                }}
              />
              <RouteCard
                route={{
                  mode: 'train',
                  duration: '5h 15m',
                  price: 85,
                  provider: 'Rail Europe',
                  details: 'Scenic route through countryside',
                }}
              />
              <RouteCard
                route={{
                  mode: 'bus',
                  duration: '6h 45m',
                  price: 45,
                  provider: 'FlixBus',
                  details: 'Budget-friendly option',
                }}
              />
            </div>
          )}

          {/* Tips */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Booking Tips
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Book 2-3 months in advance for best prices</li>
              <li>• Tuesday and Wednesday are typically cheaper</li>
              <li>• Consider nearby airports for more options</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteCard({ route }: { route: any }) {
  const icons = {
    flight: Plane,
    train: Train,
    bus: Bus,
  };

  const Icon = icons[route.mode as keyof typeof icons] || Plane;

  return (
    <div className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
            <Icon className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h3 className="mb-1 font-semibold capitalize">{route.mode}</h3>
            <p className="text-sm text-muted-foreground">{route.provider}</p>
            <p className="mt-2 text-sm">{route.details}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">${route.price}</div>
          <div className="text-sm text-muted-foreground">{route.duration}</div>
        </div>
      </div>
      <button className="mt-4 w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600">
        View Options
      </button>
    </div>
  );
}
