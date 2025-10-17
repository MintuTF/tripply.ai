'use client';

import { Layout } from '@/types';
import { CloudSun, Package, Calendar, AlertCircle } from 'lucide-react';

interface BriefingLayoutProps {
  data: any;
  layout: Layout;
  onLayoutChange?: (intent: string) => void;
}

/**
 * BriefingLayout - Weather, packing, events, and advisories
 * Shows when user asks about weather, what to pack, or safety
 */
export function BriefingLayout({ data, layout }: BriefingLayoutProps) {
  const weather = data.weather || {};
  const packing = data.packing || [];
  const events = data.events || [];
  const advisories = data.advisories || [];
  const location = data.location || data.destination || 'your destination';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-bold">Trip Briefing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Essential info for {location}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Weather Strip */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <CloudSun className="h-5 w-5 text-blue-500" />
              Weather Forecast
            </h2>
            <div className="grid grid-cols-7 gap-3">
              {weather.forecast && weather.forecast.length > 0 ? (
                weather.forecast.map((day: any, i: number) => (
                  <WeatherDay key={i} day={day} />
                ))
              ) : (
                // Placeholder weather
                Array.from({ length: 7 }).map((_, i) => (
                  <WeatherDay
                    key={i}
                    day={{
                      date: new Date(Date.now() + i * 86400000).toLocaleDateString('en-US', {
                        weekday: 'short',
                      }),
                      high: 20 + Math.floor(Math.random() * 10),
                      low: 12 + Math.floor(Math.random() * 5),
                      icon: '☀️',
                    }}
                  />
                ))
              )}
            </div>
          </section>

          {/* Packing List */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Package className="h-5 w-5 text-purple-500" />
              What to Pack
            </h2>
            <div className="flex flex-wrap gap-2">
              {packing.length > 0 ? (
                packing.map((item: string, i: number) => (
                  <PackingChip key={i} item={item} />
                ))
              ) : (
                <>
                  <PackingChip item="Comfortable walking shoes" />
                  <PackingChip item="Light jacket" />
                  <PackingChip item="Sunscreen" />
                  <PackingChip item="Power adapter" />
                  <PackingChip item="Reusable water bottle" />
                  <PackingChip item="Travel insurance docs" />
                </>
              )}
            </div>
          </section>

          {/* Upcoming Events */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-5 w-5 text-green-500" />
              Upcoming Events
            </h2>
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event: any, i: number) => (
                  <EventCard key={i} event={event} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">
                No major events during your travel dates
              </div>
            )}
          </section>

          {/* Travel Advisories */}
          {advisories.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Travel Advisories
              </h2>
              <div className="space-y-3">
                {advisories.map((advisory: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20 p-4"
                  >
                    <h3 className="mb-1 font-medium">{advisory.title}</h3>
                    <p className="text-sm text-muted-foreground">{advisory.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function WeatherDay({ day }: { day: any }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className="mb-1 text-xs font-medium text-muted-foreground">
        {day.date}
      </div>
      <div className="mb-2 text-2xl">{day.icon || '☀️'}</div>
      <div className="text-xs">
        <div className="font-semibold">{day.high}°</div>
        <div className="text-muted-foreground">{day.low}°</div>
      </div>
    </div>
  );
}

function PackingChip({ item }: { item: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-sm">
      <input type="checkbox" className="h-3 w-3 rounded border-gray-300" />
      {item}
    </span>
  );
}

function EventCard({ event }: { event: any }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="mb-1 font-semibold">{event.name || event.title}</h3>
          <p className="text-sm text-muted-foreground">
            {event.date} • {event.venue || event.location}
          </p>
        </div>
        {event.price && (
          <div className="text-sm font-medium">${event.price}</div>
        )}
      </div>
    </div>
  );
}
