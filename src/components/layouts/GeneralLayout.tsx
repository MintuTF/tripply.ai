'use client';

import { Layout } from '@/types';
import { MessageSquare, Sparkles, Hotel, Map, Calendar, Plane, CloudSun } from 'lucide-react';

interface GeneralLayoutProps {
  data: any;
  layout?: Layout;
  onLayoutChange?: (intent: string) => void;
}

/**
 * GeneralLayout - Default layout for general questions
 * Shows AI responses with suggested layout switches
 */
export function GeneralLayout({ data, layout, onLayoutChange }: GeneralLayoutProps) {
  const answer = data.answer || data.response || '';
  const suggestions = data.suggestions || [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h1 className="text-xl font-semibold">AI Assistant</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Answer Blocks */}
          {answer && (
            <div className="rounded-xl border bg-card p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {answer.split('\n').map((paragraph: string, i: number) => (
                  <p key={i} className="mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          {suggestions.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Suggested actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {suggestions.map((suggestion: any, i: number) => (
                  <SuggestionCard
                    key={i}
                    suggestion={suggestion}
                    onLayoutChange={onLayoutChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Default Suggested Layouts */}
          {suggestions.length === 0 && !answer && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">What would you like to do?</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <LayoutSuggestion
                  icon={<Hotel className="h-5 w-5" />}
                  title="Find Accommodations"
                  description="Search hotels, hostels, and vacation rentals"
                  intent="stays"
                  onLayoutChange={onLayoutChange}
                />
                <LayoutSuggestion
                  icon={<Calendar className="h-5 w-5" />}
                  title="Plan Itinerary"
                  description="Create a day-by-day travel schedule"
                  intent="itinerary"
                  onLayoutChange={onLayoutChange}
                />
                <LayoutSuggestion
                  icon={<Map className="h-5 w-5" />}
                  title="Explore Nearby"
                  description="Discover places around your location"
                  intent="nearby"
                  onLayoutChange={onLayoutChange}
                />
                <LayoutSuggestion
                  icon={<Plane className="h-5 w-5" />}
                  title="Check Transport"
                  description="Find flights, trains, and buses"
                  intent="transport"
                  onLayoutChange={onLayoutChange}
                />
                <LayoutSuggestion
                  icon={<CloudSun className="h-5 w-5" />}
                  title="Get Briefing"
                  description="Weather, packing, and safety info"
                  intent="briefing"
                  onLayoutChange={onLayoutChange}
                />
                <LayoutSuggestion
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Destination Overview"
                  description="Learn about a city or region"
                  intent="overview"
                  onLayoutChange={onLayoutChange}
                />
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Ask me anything about your trip, and I'll help you plan, research, and organize your
              travel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onLayoutChange,
}: {
  suggestion: any;
  onLayoutChange?: (intent: string) => void;
}) {
  return (
    <button
      onClick={() => onLayoutChange?.(suggestion.intent)}
      className="rounded-lg border bg-card p-4 text-left transition-all hover:border-blue-500 hover:shadow-md"
    >
      <h3 className="mb-1 font-semibold">{suggestion.title}</h3>
      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
    </button>
  );
}

function LayoutSuggestion({
  icon,
  title,
  description,
  intent,
  onLayoutChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  intent: string;
  onLayoutChange?: (intent: string) => void;
}) {
  return (
    <button
      onClick={() => onLayoutChange?.(intent)}
      className="group flex gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:border-blue-500 hover:shadow-md"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white dark:bg-blue-900/20">
        {icon}
      </div>
      <div>
        <h3 className="mb-1 font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
