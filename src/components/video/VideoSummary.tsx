'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, ChevronDown, ChevronUp, Plus, Check, ExternalLink, Camera, Utensils, Building2, Landmark } from 'lucide-react';
import type { VideoPageAnalysis } from '@/lib/video/types';

interface VideoSummaryProps {
  analysis: VideoPageAnalysis | null;
  isLoading?: boolean;
  onAddPlace?: (placeName: string, placeType: string) => void;
  addedPlaces?: string[];
  className?: string;
  variant?: 'default' | 'card';
}

// Map place types to icons
const placeTypeIcons: Record<string, typeof Camera> = {
  attraction: Camera,
  restaurant: Utensils,
  hotel: Building2,
  landmark: Landmark,
  default: MapPin,
};

function getPlaceIcon(type: string) {
  return placeTypeIcons[type.toLowerCase()] || placeTypeIcons.default;
}

export function VideoSummary({
  analysis,
  isLoading = false,
  onAddPlace,
  addedPlaces = [],
  className = '',
  variant = 'default',
}: VideoSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Card variant - clean white card without collapse
  if (variant === 'card') {
    if (isLoading) {
      return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-purple-100/50 dark:shadow-purple-900/20 p-6 ${className}`}>
          <div className="space-y-4">
            <div className="h-4 bg-purple-100 dark:bg-purple-900/30 rounded w-full animate-pulse" />
            <div className="h-4 bg-purple-100 dark:bg-purple-900/30 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-purple-100 dark:bg-purple-900/30 rounded w-1/2 animate-pulse" />
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="h-4 bg-purple-100 dark:bg-purple-900/30 rounded w-32 animate-pulse mb-3" />
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-24 bg-purple-100 dark:bg-purple-900/30 rounded-full animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!analysis) {
      return null;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-purple-100/50 dark:shadow-purple-900/20 overflow-hidden ${className}`}
      >
        {/* Summary Section */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {analysis.summary}
          </p>
        </div>

        {/* Places Section */}
        {analysis.places && analysis.places.length > 0 && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-pink-500" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Places Mentioned
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.places.map((place, index) => {
                const isAdded = addedPlaces.includes(place.name);
                const Icon = getPlaceIcon(place.type);
                return (
                  <motion.button
                    key={index}
                    onClick={() => onAddPlace?.(place.name, place.type)}
                    disabled={isAdded}
                    whileHover={{ scale: isAdded ? 1 : 1.02 }}
                    whileTap={{ scale: isAdded ? 1 : 0.98 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all ${
                      isAdded
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{place.name}</span>
                    {isAdded ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Highlights Section (if no places) */}
        {(!analysis.places || analysis.places.length === 0) && analysis.highlights && analysis.highlights.length > 0 && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Key Highlights
              </h4>
            </div>
            <ul className="space-y-2">
              {analysis.highlights.map((highlight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    );
  }

  // Default variant - collapsible (for backwards compatibility)
  if (isLoading) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">AI Summary</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Summary text */}
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {analysis.summary}
              </p>

              {/* Highlights */}
              {analysis.highlights && analysis.highlights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Key Highlights
                  </h4>
                  <ul className="space-y-1">
                    {analysis.highlights.map((highlight, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Places mentioned */}
              {analysis.places && analysis.places.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-pink-500" />
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Places Mentioned
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.places.map((place, index) => {
                      const isAdded = addedPlaces.includes(place.name);
                      return (
                        <motion.button
                          key={index}
                          onClick={() => onAddPlace?.(place.name, place.type)}
                          disabled={isAdded}
                          whileHover={{ scale: isAdded ? 1 : 1.02 }}
                          whileTap={{ scale: isAdded ? 1 : 0.98 }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                            isAdded
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400 border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {place.name}
                          {isAdded ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
