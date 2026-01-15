'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star, Navigation, Heart, Loader2, Compass } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import type { TravelPlace } from '@/lib/travel/types';
import { cn } from '@/lib/utils';

interface NearbyPlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  centerPlace: TravelPlace | null;
  onSelectPlace: (place: TravelPlace) => void;
}

export function NearbyPlacesModal({
  isOpen,
  onClose,
  centerPlace,
  onSelectPlace,
}: NearbyPlacesModalProps) {
  const { savePlace, unsavePlace, isPlaceSaved } = useTravel();
  const [nearbyPlaces, setNearbyPlaces] = useState<TravelPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: null, label: 'All', icon: Compass },
    { id: 'restaurant', label: 'Food', icon: null },
    { id: 'attraction', label: 'Attractions', icon: null },
    { id: 'park', label: 'Parks', icon: null },
    { id: 'museum', label: 'Museums', icon: null },
  ];

  useEffect(() => {
    if (isOpen && centerPlace?.coordinates) {
      fetchNearbyPlaces();
    }
  }, [isOpen, centerPlace?.id]);

  const fetchNearbyPlaces = async () => {
    if (!centerPlace?.coordinates) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/travel/places?lat=${centerPlace.coordinates.lat}&lng=${centerPlace.coordinates.lng}&radius=2000`
      );
      if (response.ok) {
        const data = await response.json();
        const places = (data.places || []).filter(
          (p: TravelPlace) => p.id !== centerPlace.id
        );
        setNearbyPlaces(places);
      }
    } catch (error) {
      console.error('Failed to fetch nearby places:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaces = selectedCategory
    ? nearbyPlaces.filter((p) =>
        p.categories.some((c) =>
          c.toLowerCase().includes(selectedCategory.toLowerCase())
        )
      )
    : nearbyPlaces;

  const handleSaveToggle = (place: TravelPlace, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaceSaved(place.id)) {
      unsavePlace(place.id);
    } else {
      savePlace(place.id);
    }
  };

  const calculateDistance = (place: TravelPlace): string => {
    if (!centerPlace?.coordinates || !place.coordinates) return '';

    const R = 6371;
    const dLat = ((place.coordinates.lat - centerPlace.coordinates.lat) * Math.PI) / 180;
    const dLon = ((place.coordinates.lng - centerPlace.coordinates.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((centerPlace.coordinates.lat * Math.PI) / 180) *
        Math.cos((place.coordinates.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
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
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Places Near {centerPlace?.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Discover what's around this location
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 p-4 overflow-x-auto border-b border-gray-100">
              {categories.map((cat) => (
                <button
                  key={cat.id || 'all'}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    selectedCategory === cat.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Places List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                  <p className="text-gray-500">Finding nearby places...</p>
                </div>
              ) : filteredPlaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <MapPin className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">No places found nearby</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredPlaces.map((place) => {
                    const saved = isPlaceSaved(place.id);
                    const distance = calculateDistance(place);

                    return (
                      <motion.div
                        key={place.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => onSelectPlace(place)}
                        className="flex gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors group"
                      >
                        {/* Image */}
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={place.imageUrl || '/placeholder-place.jpg'}
                            alt={place.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400';
                            }}
                          />
                          {distance && (
                            <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 rounded text-xs text-white">
                              {distance}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {place.name}
                            </h3>
                            <button
                              onClick={(e) => handleSaveToggle(place, e)}
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                                saved
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-white text-gray-400 hover:text-pink-500'
                              )}
                            >
                              <Heart
                                className={cn('w-4 h-4', saved && 'fill-current')}
                              />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span className="text-sm font-medium">
                                {place.rating.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <span className="text-sm text-gray-500 truncate">
                              {place.categories.slice(0, 2).join(', ')}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {place.description || 'A great place to explore nearby.'}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-center text-gray-500">
                Showing {filteredPlaces.length} places within 2km
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
