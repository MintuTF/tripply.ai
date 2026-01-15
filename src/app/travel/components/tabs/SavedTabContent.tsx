'use client';

import { useEffect, useState, useMemo } from 'react';
import { Bookmark, Calendar, Star, MapPin, Trash2, Loader2, Heart, Hotel, UtensilsCrossed } from 'lucide-react';
import { useTravel } from '../../context/TravelContext';
import { TravelPlace } from '@/lib/travel/types';
import { cn } from '@/lib/utils';

interface SavedTabContentProps {
  onOpenItinerary?: () => void;
}

type CategoryFilter = 'all' | 'hotels' | 'restaurants' | 'activities';

const CATEGORY_KEYWORDS = {
  hotels: ['hotel', 'accommodation', 'lodging', 'resort', 'hostel', 'inn', 'motel', 'guesthouse', 'stay'],
  restaurants: ['restaurant', 'cafe', 'food', 'dining', 'bakery', 'bar', 'pub', 'bistro', 'eatery', 'kitchen'],
};

function getPlaceCategory(place: TravelPlace): 'hotels' | 'restaurants' | 'activities' {
  const categories = place.categories.map(c => c.toLowerCase());
  if (categories.some(c => CATEGORY_KEYWORDS.hotels.some(kw => c.includes(kw)))) return 'hotels';
  if (categories.some(c => CATEGORY_KEYWORDS.restaurants.some(kw => c.includes(kw)))) return 'restaurants';
  return 'activities';
}

export function SavedTabContent({ onOpenItinerary }: SavedTabContentProps) {
  const { state, selectPlace, unsavePlace, fetchSavedPlacesData } = useTravel();
  const { savedPlaceIds, savedPlacesData, savedPlacesLoading, places, city } = state;
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // Fetch saved places data when tab is active and we have saved place IDs
  useEffect(() => {
    if (savedPlaceIds.length > 0 && savedPlacesData.length === 0 && !savedPlacesLoading) {
      fetchSavedPlacesData();
    }
  }, [savedPlaceIds, savedPlacesData.length, savedPlacesLoading, fetchSavedPlacesData]);

  // Use savedPlacesData if available, otherwise fall back to filtering from places
  const savedPlaces = useMemo(() => {
    if (savedPlacesData.length > 0) {
      return savedPlacesData;
    }
    // Fallback: filter from loaded places
    return places.filter(p => savedPlaceIds.includes(p.id));
  }, [savedPlacesData, places, savedPlaceIds]);

  // Filter by category
  const filteredPlaces = useMemo(() => {
    if (categoryFilter === 'all') return savedPlaces;
    return savedPlaces.filter(place => getPlaceCategory(place) === categoryFilter);
  }, [savedPlaces, categoryFilter]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: savedPlaces.length, hotels: 0, restaurants: 0, activities: 0 };
    savedPlaces.forEach(place => {
      const cat = getPlaceCategory(place);
      counts[cat]++;
    });
    return counts;
  }, [savedPlaces]);

  if (savedPlacesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (savedPlaceIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
          <Heart className="w-10 h-10 text-pink-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">No Saved Places</h2>
        <p className="text-gray-500 text-center max-w-md">
          Save places you like while exploring to see them here! Tap the heart icon on any place to save it.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Saved Places</h2>
          <p className="text-gray-500 mt-1">
            {savedPlaceIds.length} place{savedPlaceIds.length !== 1 ? 's' : ''} saved
            {city && ` in ${city.name}`}
          </p>
        </div>
        {onOpenItinerary && savedPlaceIds.length > 0 && (
          <button
            onClick={onOpenItinerary}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-200 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Build Itinerary
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'all', label: 'All', icon: Bookmark },
          { id: 'hotels', label: 'Hotels', icon: Hotel },
          { id: 'restaurants', label: 'Restaurants', icon: UtensilsCrossed },
          { id: 'activities', label: 'Activities', icon: MapPin },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCategoryFilter(id as CategoryFilter)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
              categoryFilter === id
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-white border border-purple-100 text-gray-700 hover:bg-purple-50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className={cn(
              'ml-1 px-1.5 py-0.5 rounded-full text-xs',
              categoryFilter === id
                ? 'bg-white/20 text-white'
                : 'bg-purple-100 text-purple-600'
            )}>
              {categoryCounts[id as keyof typeof categoryCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Places Grid */}
      {filteredPlaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No places in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaces.map((place) => (
            <div
              key={place.id}
              className="group rounded-2xl bg-white border border-purple-100 overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300"
            >
              {/* Image */}
              <button
                onClick={() => selectPlace(place)}
                className="w-full"
              >
                <div className="relative h-40 bg-gradient-to-br from-purple-100 to-pink-100">
                  {place.imageUrl ? (
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-purple-300" />
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700">
                      {place.categories[0] || 'Place'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
                    {place.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {place.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-gray-700">{place.rating.toFixed(1)}</span>
                        {place.reviewCount > 0 && (
                          <span className="text-gray-400">({place.reviewCount})</span>
                        )}
                      </div>
                    )}
                    {place.priceLevel !== undefined && place.priceLevel > 0 && (
                      <span className="text-gray-400">
                        {'$'.repeat(place.priceLevel)}
                      </span>
                    )}
                  </div>
                  {place.shortDescription && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                      {place.shortDescription}
                    </p>
                  )}
                </div>
              </button>

              {/* Actions */}
              <div className="px-4 pb-4 flex items-center justify-between border-t border-purple-50 pt-3">
                <button
                  onClick={() => selectPlace(place)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => unsavePlace(place.id)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove from saved"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
