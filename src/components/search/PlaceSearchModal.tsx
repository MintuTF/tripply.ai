'use client';

import { useState, useEffect } from 'react';
import { X, Star, MapPin, Clock, Loader2, Plus, ExternalLink, Utensils, Hotel, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaceSearchInput } from './PlaceSearchInput';
import type { PlaceResult } from '@/types';

interface PlacePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

interface PlaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityCoordinates?: { lat: number; lng: number };
  cityName?: string;
  onAddToBoard: (place: PlaceResult, cardType: 'hotel' | 'food' | 'spot') => void;
}

// Determine card type from place types
function getCardType(types: string[]): 'hotel' | 'food' | 'spot' {
  if (types.some(t => t.includes('lodging') || t.includes('hotel'))) {
    return 'hotel';
  }
  if (types.some(t => t.includes('restaurant') || t.includes('food') || t.includes('cafe') || t.includes('bar') || t.includes('meal'))) {
    return 'food';
  }
  return 'spot';
}

// Get type label
function getTypeLabel(cardType: 'hotel' | 'food' | 'spot'): string {
  switch (cardType) {
    case 'hotel': return 'Hotel';
    case 'food': return 'Restaurant';
    case 'spot': return 'Activity';
  }
}

// Get type icon
function getTypeIcon(cardType: 'hotel' | 'food' | 'spot') {
  switch (cardType) {
    case 'hotel': return <Hotel className="w-4 h-4" />;
    case 'food': return <Utensils className="w-4 h-4" />;
    case 'spot': return <Compass className="w-4 h-4" />;
  }
}

// Price level display
function getPriceLevel(level?: number): string {
  if (!level) return '';
  return '$'.repeat(level);
}

export function PlaceSearchModal({
  isOpen,
  onClose,
  cityCoordinates,
  cityName = 'this area',
  onAddToBoard,
}: PlaceSearchModalProps) {
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPlace(null);
      setIsLoadingDetails(false);
      setIsAdding(false);
    }
  }, [isOpen]);

  // Fetch place details when a prediction is selected
  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setIsLoadingDetails(true);
    setSelectedPlace(null);

    try {
      const response = await fetch(`/api/places/details?place_id=${prediction.place_id}`);
      const data = await response.json();

      if (data.place) {
        setSelectedPlace(data.place);
      }
    } catch (error) {
      console.error('Failed to fetch place details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle adding to board
  const handleAddToBoard = async () => {
    if (!selectedPlace) return;

    setIsAdding(true);
    const cardType = getCardType(selectedPlace.types || []);

    try {
      await onAddToBoard(selectedPlace, cardType);
      onClose();
    } catch (error) {
      console.error('Failed to add place to board:', error);
    } finally {
      setIsAdding(false);
    }
  };

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Add a Place in {cityName}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Search Input */}
              <PlaceSearchInput
                cityCoordinates={cityCoordinates}
                onSelectPlace={handleSelectPrediction}
                placeholder="Search restaurants, hotels, attractions..."
                autoFocus
              />

              {/* Loading State */}
              {isLoadingDetails && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                  <p className="text-gray-500">Loading place details...</p>
                </div>
              )}

              {/* Place Preview */}
              {selectedPlace && !isLoadingDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border-2 border-purple-100 overflow-hidden"
                >
                  {/* Photo */}
                  {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={selectedPlace.photos[0]}
                        alt={selectedPlace.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Rating Badge */}
                      {selectedPlace.rating && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-semibold text-gray-800">
                            {selectedPlace.rating.toFixed(1)}
                          </span>
                          {selectedPlace.review_count && (
                            <span className="text-xs text-gray-500">
                              ({selectedPlace.review_count.toLocaleString()})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Type Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium shadow-lg">
                        {getTypeIcon(getCardType(selectedPlace.types || []))}
                        <span>{getTypeLabel(getCardType(selectedPlace.types || []))}</span>
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedPlace.name}
                    </h3>

                    {/* Address */}
                    {selectedPlace.address && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{selectedPlace.address}</span>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      {selectedPlace.price_level && (
                        <span className="font-medium text-green-600">
                          {getPriceLevel(selectedPlace.price_level)}
                        </span>
                      )}
                      {selectedPlace.opening_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{selectedPlace.opening_hours}</span>
                        </div>
                      )}
                    </div>

                    {/* Editorial Summary */}
                    {selectedPlace.editorial_summary && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {selectedPlace.editorial_summary}
                      </p>
                    )}

                    {/* Website Link */}
                    {selectedPlace.website && (
                      <a
                        href={selectedPlace.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Visit Website
                      </a>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Empty State */}
              {!selectedPlace && !isLoadingDetails && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Search for a restaurant, hotel, or attraction</p>
                  <p className="text-sm mt-1">to add it to your trip board</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedPlace && !isLoadingDetails && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={handleAddToBoard}
                  disabled={isAdding}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add to Board
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
