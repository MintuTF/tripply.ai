'use client';

import { Calendar, Clock, ArrowRight } from 'lucide-react';

interface TripPlanningSectionProps {
  placeName: string;
  duration?: string;
}

interface PairingSuggestionProps {
  time: string;
  suggestion: string;
}

function PairingSuggestion({ time, suggestion }: PairingSuggestionProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-16 text-sm font-semibold text-purple-700">
        {time}
      </div>
      <ArrowRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-gray-700 flex-1">{suggestion}</p>
    </div>
  );
}

export function TripPlanningSection({ placeName, duration }: TripPlanningSectionProps) {
  return (
    <section className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          How This Fits Into Your Trip
        </h2>

        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-2xl p-6 md:p-8 border border-purple-100">
          {/* Suggested Day */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">
              Suggested Timing
            </h3>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">
                Best on <strong>Day 1 or Day 2</strong> of your trip, allowing you to explore while you're fresh and energized
              </p>
            </div>
          </div>

          {/* Time Window */}
          <div className="mb-6 pb-6 border-b border-purple-200">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-700 mb-2">
                  Ideal visit: <strong>Morning (9 AM - 12 PM)</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Plan for {duration || '2-3 hours'} to fully experience {placeName}
                </p>
              </div>
            </div>
          </div>

          {/* Pairing Suggestions */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">
              What Pairs Well
            </h4>
            <div className="space-y-4">
              <PairingSuggestion
                time="Before"
                suggestion="Start your day with breakfast at a nearby cafe (15 min walk)"
              />
              <PairingSuggestion
                time="After"
                suggestion="Walk to nearby attractions or parks for afternoon relaxation (10 min walk)"
              />
              <PairingSuggestion
                time="Evening"
                suggestion="Enjoy dinner in the local district with authentic cuisine (5 min ride)"
              />
            </div>
          </div>

          {/* Helpful Tip */}
          <div className="mt-6 pt-6 border-t border-purple-200">
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <strong className="text-purple-700">Pro tip:</strong> Book this activity early in your trip to help orient yourself with the area and discover other nearby spots you'll want to visit later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
