'use client';

import { useState } from 'react';
import { useTripContext } from '@/context/TripContext';
import { TripContextSummary } from '@/types/marketplace';
import { getTripContextSummary, generateTripContextDisplayText } from '@/lib/marketplace/tripContextUtils';
import { ShoppingBag, ChevronRight, MapPin, Calendar, Users, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface TripContextBarProps {
  onEditClick?: () => void;
}

export function TripContextBar({ onEditClick }: TripContextBarProps) {
  const { trip } = useTripContext();
  const [showDetails, setShowDetails] = useState(false);

  // Get trip context summary
  const summary: TripContextSummary | null = getTripContextSummary(trip);
  const displayText = generateTripContextDisplayText(summary);
  const hasTrip = !!summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-30 bg-gradient-to-r from-sky-50 via-purple-50 to-pink-50 border-b border-purple-100/50 backdrop-blur-sm marketplace-context-bar"
      role="banner"
      aria-label="Trip context information"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Shopping icon + trip context */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-200">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>

            {/* Trip context text */}
            <div className="min-w-0 flex-1">
              {hasTrip ? (
                <>
                  <div className="text-xs font-medium text-purple-600">
                    Shopping for your trip
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">
                      {displayText}
                    </h2>
                    {summary && (
                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        aria-label={showDetails ? 'Hide trip details' : 'Show trip details'}
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-medium text-gray-500">
                    No trip selected
                  </div>
                  <div className="text-sm font-semibold text-gray-700">
                    Select a trip to get personalized recommendations
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Change button */}
          <button
            onClick={onEditClick}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-white/80 hover:bg-white border border-purple-200 hover:border-purple-300 text-purple-700 hover:text-purple-800 text-sm font-medium transition-all hover:shadow-md group marketplace-focus-visible"
            aria-label={hasTrip ? 'Change trip details' : 'Select a trip'}
          >
            <span className="hidden sm:inline">
              {hasTrip ? 'Change' : 'Select Trip'}
            </span>
            <span className="sm:hidden">
              {hasTrip ? 'Edit' : 'Select'}
            </span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Trip details pills (mobile friendly, collapsible) */}
        {hasTrip && summary && showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 flex items-center gap-2 flex-wrap"
            role="region"
            aria-label="Trip details"
          >
            {summary.destination && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 border border-purple-100 text-xs font-medium text-gray-700">
                <MapPin className="w-3 h-3 text-purple-500" aria-hidden="true" />
                <span>{summary.destination}</span>
              </div>
            )}
            {summary.duration > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 border border-purple-100 text-xs font-medium text-gray-700">
                <Calendar className="w-3 h-3 text-purple-500" aria-hidden="true" />
                <span>{summary.duration} day{summary.duration !== 1 ? 's' : ''}</span>
              </div>
            )}
            {summary.travelers && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 border border-purple-100 text-xs font-medium text-gray-700">
                <Users className="w-3 h-3 text-purple-500" aria-hidden="true" />
                <span>{summary.travelers}</span>
              </div>
            )}
            {summary.season && summary.season !== 'Year-round' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 border border-purple-100 text-xs font-medium text-gray-700">
                <span>
                  {summary.season === 'Winter' && '❄️'}
                  {summary.season === 'Spring' && '🌸'}
                  {summary.season === 'Summer' && '☀️'}
                  {summary.season === 'Fall' && '🍂'}
                </span>
                <span>{summary.season}</span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
