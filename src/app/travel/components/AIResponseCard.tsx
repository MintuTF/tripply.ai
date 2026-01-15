'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Check,
  MapPin,
  Clock,
  Plus,
  Map
} from 'lucide-react';
import type { AIStructuredResponse, AIRecommendation, TravelPlace } from '@/lib/travel/types';
import { cn } from '@/lib/utils';

interface AIResponseCardProps {
  response: AIStructuredResponse;
  places: TravelPlace[];
  onPlaceClick?: (placeId: string) => void;
  onShowOnMap?: (placeId: string) => void;
  onFollowUp?: (question: string) => void;
  isCollapsed?: boolean;
}

function RecommendationItem({
  item,
  place,
  index,
  onPlaceClick,
  onShowOnMap
}: {
  item: AIRecommendation;
  place?: TravelPlace;
  index: number;
  onPlaceClick?: (placeId: string) => void;
  onShowOnMap?: (placeId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-purple-50 hover:shadow-md hover:border-purple-100 transition-all"
    >
      {/* Header with number badge */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">{index + 1}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{item.headline}</h4>
          {item.placeName && (
            <p className="text-sm text-purple-600">{item.placeName}</p>
          )}
        </div>
        {place?.imageUrl && (
          <img
            src={place.imageUrl}
            alt={item.placeName || item.headline}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}
      </div>

      {/* Why it fits */}
      <div className="space-y-2 mb-3">
        {item.whyItFits.map((reason, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">{reason}</span>
          </div>
        ))}
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
        {item.duration && (
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{item.duration}</span>
          </div>
        )}
        {item.bestTime && (
          <div className="flex items-center gap-1">
            <span>Best: {item.bestTime}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onShowOnMap?.(item.placeId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition-colors"
        >
          <Map className="w-3.5 h-3.5" />
          <span>Map</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          <span>Add to Trip</span>
        </button>
      </div>
    </motion.div>
  );
}

export function AIResponseCard({
  response,
  places,
  onPlaceClick,
  onShowOnMap,
  onFollowUp,
  isCollapsed = false
}: AIResponseCardProps) {
  const [expanded, setExpanded] = useState(!isCollapsed);

  const getPlaceById = (placeId: string) =>
    places.find(p => p.id === placeId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl overflow-hidden"
    >
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-semibold text-gray-900">{response.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{response.summary}</p>
        </div>
        <div className="flex-shrink-0 ml-4">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Recommendations grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {response.items.map((item, index) => (
                  <RecommendationItem
                    key={item.placeId}
                    item={item}
                    place={getPlaceById(item.placeId)}
                    index={index}
                    onPlaceClick={onPlaceClick}
                    onShowOnMap={onShowOnMap}
                  />
                ))}
              </div>

              {/* Follow-up suggestions */}
              {response.followUpSuggestions.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Continue the conversation:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {response.followUpSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => onFollowUp?.(suggestion)}
                        className="px-3 py-1.5 rounded-full border border-purple-200 text-purple-700 text-sm hover:bg-white transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
