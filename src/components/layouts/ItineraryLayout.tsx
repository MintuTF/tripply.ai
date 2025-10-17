'use client';

import { Layout } from '@/types';
import { Clock, MapPin, Navigation, Calendar } from 'lucide-react';

interface ItineraryLayoutProps {
  data: any;
  layout: Layout;
  onLayoutChange?: (intent: string) => void;
}

/**
 * ItineraryLayout - Day-by-day timeline view with activities
 * Shows when user asks to "plan my trip" or "create an itinerary"
 */
export function ItineraryLayout({ data, layout }: ItineraryLayoutProps) {
  const days = data.itinerary?.days || [];
  const tripDates = data.dates || {};

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Itinerary</h1>
            {tripDates.start && tripDates.end && (
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(tripDates.start).toLocaleDateString()} -{' '}
                {new Date(tripDates.end).toLocaleDateString()}
              </p>
            )}
          </div>
          <button className="rounded-lg border bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600">
            Export Calendar
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-6">
        {days.length > 0 ? (
          <div className="space-y-8">
            {days.map((day: any, dayIndex: number) => (
              <div key={dayIndex} className="relative">
                {/* Day Header */}
                <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 bg-background py-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white font-semibold">
                    {dayIndex + 1}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Day {dayIndex + 1}
                      {day.date && ` • ${new Date(day.date).toLocaleDateString()}`}
                    </h2>
                    {day.theme && (
                      <p className="text-sm text-muted-foreground">{day.theme}</p>
                    )}
                  </div>
                </div>

                {/* Activities */}
                <div className="ml-6 space-y-4 border-l-2 border-muted pl-6">
                  {day.activities?.map((activity: any, actIndex: number) => (
                    <div
                      key={actIndex}
                      className="group relative rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-6 h-4 w-4 rounded-full border-2 border-blue-500 bg-background" />

                      {/* Activity Content */}
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">
                              {activity.time || `${9 + actIndex * 3}:00 AM`}
                            </span>
                            {activity.duration && (
                              <span className="text-sm text-muted-foreground">
                                ({activity.duration})
                              </span>
                            )}
                          </div>

                          <h3 className="mb-1 text-lg font-semibold">
                            {activity.name || activity.title}
                          </h3>

                          {activity.location && (
                            <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{activity.location}</span>
                            </div>
                          )}

                          {activity.description && (
                            <p className="text-sm text-muted-foreground">
                              {activity.description}
                            </p>
                          )}

                          {activity.tips && (
                            <div className="mt-2 rounded-md bg-blue-50 dark:bg-blue-950/20 px-3 py-2 text-sm">
                              💡 {activity.tips}
                            </div>
                          )}
                        </div>

                        {activity.image_url && (
                          <img
                            src={activity.image_url}
                            alt={activity.name}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                      </div>

                      {/* Travel Time to Next */}
                      {activity.travel_to_next && (
                        <div className="mt-3 flex items-center gap-2 border-t pt-3 text-sm text-muted-foreground">
                          <Navigation className="h-4 w-4" />
                          <span>
                            {activity.travel_to_next.duration} to next location via{' '}
                            {activity.travel_to_next.mode}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No itinerary yet</h3>
              <p className="text-sm text-muted-foreground">
                Ask me to plan your trip and I'll create a day-by-day itinerary
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
