'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar } from 'lucide-react';
import type { TravelPlace } from '@/lib/travel/types';

interface SavedPlacesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlaces: TravelPlace[];
  onRemove: (placeId: string) => void;
  onViewBoard: () => void;
  onBuildItinerary: () => void;
}

export function SavedPlacesPanel({
  isOpen,
  onClose,
  savedPlaces,
  onRemove,
  onViewBoard,
  onBuildItinerary
}: SavedPlacesPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}  // Desktop: slide from right
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[400px]
                       bg-white dark:bg-gray-900 shadow-2xl z-50
                       flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4
                           border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold">Your Saved Places</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {savedPlaces.length} {savedPlaces.length === 1 ? 'place' : 'places'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100
                           dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Places Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {savedPlaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center
                               h-full text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No places saved yet
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start exploring and click + to save places
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {savedPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="relative group rounded-lg overflow-hidden
                                 border border-gray-200 dark:border-gray-800
                                 hover:shadow-lg transition-shadow"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square relative">
                        <img
                          src={place.imageUrl || '/placeholder.jpg'}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Remove button */}
                        <button
                          onClick={() => onRemove(place.id)}
                          className="absolute top-2 right-2 w-6 h-6
                                   rounded-full bg-white/90 backdrop-blur-sm
                                   flex items-center justify-center
                                   opacity-0 group-hover:opacity-100
                                   transition-opacity"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      {/* Info */}
                      <div className="p-2">
                        <h3 className="font-medium text-sm line-clamp-1">
                          {place.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {place.categories?.[0] || 'Place'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800
                           space-y-2">
              <button
                onClick={onViewBoard}
                className="w-full px-4 py-3 rounded-xl border border-gray-300
                           dark:border-gray-700 hover:bg-gray-50
                           dark:hover:bg-gray-800 transition-colors
                           font-medium text-sm"
              >
                View Full Board
              </button>
              <button
                onClick={onBuildItinerary}
                disabled={savedPlaces.length === 0}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r
                           from-purple-600 to-pink-600 text-white
                           hover:opacity-90 transition-opacity
                           font-medium text-sm disabled:opacity-50
                           disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Build Itinerary
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
