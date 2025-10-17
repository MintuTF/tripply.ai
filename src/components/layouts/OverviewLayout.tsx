'use client';

import { Layout } from '@/types';
import { cn } from '@/lib/utils';
import { MapPin, Users, DollarSign, Calendar, CloudSun, TrendingUp } from 'lucide-react';

interface OverviewLayoutProps {
  data: any;
  layout: Layout;
  onLayoutChange?: (intent: string) => void;
}

/**
 * OverviewLayout - Destination overview with quick facts and insights
 * Shows when user asks "Is [city] worth visiting?" or "Tell me about [place]"
 */
export function OverviewLayout({ data, layout }: OverviewLayoutProps) {
  const destination = data.destination || {};
  const facts = data.facts || [];
  const weather = data.weather || {};
  const topPicks = data.topPicks || [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Summary Banner */}
      <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                {destination.name || 'Destination Overview'}
              </h1>
              {destination.country && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{destination.country}</span>
                </div>
              )}
              {destination.tagline && (
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {destination.tagline}
                </p>
              )}
            </div>
            {destination.image_url && (
              <img
                src={destination.image_url}
                alt={destination.name}
                className="h-32 w-48 rounded-lg object-cover shadow-md"
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Quick Facts Grid */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Quick Facts</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Best Time to Visit */}
              <FactCard
                icon={<Calendar className="h-5 w-5" />}
                title="Best Time to Visit"
                value={destination.best_season || 'Spring/Fall'}
                description="Ideal weather & fewer crowds"
              />

              {/* Average Budget */}
              <FactCard
                icon={<DollarSign className="h-5 w-5" />}
                title="Daily Budget"
                value={destination.daily_budget || '$100-150'}
                description="Mid-range traveler estimate"
              />

              {/* Crowd Level */}
              <FactCard
                icon={<Users className="h-5 w-5" />}
                title="Tourist Level"
                value={destination.crowd_level || 'Moderate'}
                description="Peak season activity"
              />

              {/* Weather */}
              <FactCard
                icon={<CloudSun className="h-5 w-5" />}
                title="Current Weather"
                value={weather.current || 'Loading...'}
                description={weather.description || ''}
              />
            </div>
          </section>

          {/* Why Visit */}
          {destination.highlights && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Why Visit?</h2>
              <div className="rounded-xl border bg-card p-6">
                <ul className="space-y-3">
                  {destination.highlights.map((highlight: string, i: number) => (
                    <li key={i} className="flex gap-3">
                      <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                      <span className="text-muted-foreground">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Top Picks Carousel */}
          {topPicks.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Top Picks</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {topPicks.map((pick: any, i: number) => (
                  <TopPickCard key={i} pick={pick} />
                ))}
              </div>
            </section>
          )}

          {/* Practical Tips */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Good to Know</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {facts.length > 0 ? (
                facts.map((fact: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg border bg-card p-4"
                  >
                    <h3 className="mb-1 font-medium">{fact.title}</h3>
                    <p className="text-sm text-muted-foreground">{fact.value}</p>
                  </div>
                ))
              ) : (
                <>
                  <TipCard
                    title="Language"
                    tip="English widely spoken in tourist areas"
                  />
                  <TipCard
                    title="Currency"
                    tip="Credit cards accepted almost everywhere"
                  />
                  <TipCard
                    title="Safety"
                    tip="Very safe for tourists, use common sense"
                  />
                  <TipCard
                    title="Getting Around"
                    tip="Public transport is efficient and affordable"
                  />
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function FactCard({
  icon,
  title,
  value,
  description
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center gap-2 text-blue-500">
        {icon}
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="mb-1 text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function TopPickCard({ pick }: { pick: any }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      {pick.image_url && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={pick.image_url}
            alt={pick.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-semibold text-white">{pick.name}</h3>
          </div>
        </div>
      )}
      <div className="p-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {pick.description || pick.category}
        </p>
      </div>
    </div>
  );
}

function TipCard({ title, tip }: { title: string; tip: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-1 font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{tip}</p>
    </div>
  );
}
