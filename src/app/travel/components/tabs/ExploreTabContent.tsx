'use client';

import { useState } from 'react';
import { Hotel, UtensilsCrossed, MapPin, Loader2, Plane, Search } from 'lucide-react';
import { useTravel } from '../../context/TravelContext';
import { HeroSearch } from '../HeroSearch';
import { CitySummary } from '../CitySummary';
import { CityHighlights } from '../CityHighlights';
import { CityCollections } from '../CityCollections';
import { QuickFilterChips } from '../QuickFilterChips';
import { CategorySection } from '../CategorySection';
import { AIAssistantSection } from '../AIAssistantSection';
import { PlaceSearchModal } from '@/components/search/PlaceSearchModal';
import { SavePlaceHint } from '@/components/onboarding/SavePlaceHint';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/adsense/config';
import type { PlaceResult, TravelPlace } from '@/lib/travel/types';

export function ExploreTabContent() {
  const { state, dispatch, selectPlace, savePlace } = useTravel();
  const { city, categorizedPlaces, quickFilter, places, aiSession, cityLoading, placesLoading } = state;
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);

  // Show loading when city is being loaded
  if (cityLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200 animate-pulse">
          <Plane className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Loading destination...
          </h2>
          <p className="text-gray-500">Preparing your adventure</p>
        </div>
        <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Show search if no city selected
  if (!city) {
    return <HeroSearch />;
  }

  // Handle collection click - scroll to section or apply filter
  const handleCollectionClick = (collectionId: string, filter?: string) => {
    if (filter) {
      dispatch({ type: 'SET_QUICK_FILTER', payload: filter as any });
      const section = document.getElementById(`section-${filter}`);
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <CitySummary />

      {/* Popular Places Carousel */}
      {(places.length > 0 || placesLoading) && (
        <CityHighlights
          cityName={city.name}
          places={places}
          onPlaceClick={selectPlace}
          isLoading={placesLoading}
        />
      )}

      {/* Curated Collections */}
      <CityCollections
        cityName={city.name}
        country={city.country}
        onCollectionClick={handleCollectionClick}
        onPlaceClick={selectPlace}
      />

      {/* Quick Filter Chips */}
      <QuickFilterChips
        activeFilter={quickFilter}
        onFilterChange={(filter) => {
          dispatch({ type: 'SET_QUICK_FILTER', payload: filter });

          // Smooth scroll to section if specific category selected
          if (filter !== 'all') {
            const section = document.getElementById(`section-${filter}`);
            section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      />

      {/* Vertical Sections */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Activities Section - FIRST */}
        {(quickFilter === 'all' || quickFilter === 'activities') && (
          <CategorySection
            category="activities"
            title="Activities"
            subtitle="Things to do"
            icon={MapPin}
            places={categorizedPlaces.activities}
            onPlaceClick={selectPlace}
            onViewAll={() => {
              dispatch({ type: 'SET_QUICK_FILTER', payload: 'activities' });
            }}
          />
        )}

        {/* Ad between Activities and Restaurants */}
        {quickFilter === 'all' && (
          <div className="py-6 flex justify-center">
            <AdSlot
              slot={AD_SLOTS.CITY_EXPLORE_GRID_NATIVE}
              format="rectangle"
              layout="in-feed"
              priority="normal"
            />
          </div>
        )}

        {/* Restaurants Section - SECOND */}
        {(quickFilter === 'all' || quickFilter === 'restaurants') && (
          <CategorySection
            category="restaurants"
            title="Restaurants"
            subtitle="Where to eat"
            icon={UtensilsCrossed}
            places={categorizedPlaces.restaurants}
            onPlaceClick={selectPlace}
            onViewAll={() => {
              dispatch({ type: 'SET_QUICK_FILTER', payload: 'restaurants' });
            }}
          />
        )}

        {/* Hotels Section - THIRD */}
        {(quickFilter === 'all' || quickFilter === 'hotels') && (
          <CategorySection
            category="hotels"
            title="Hotels"
            subtitle="Places to stay"
            icon={Hotel}
            places={categorizedPlaces.hotels}
            onPlaceClick={selectPlace}
            onViewAll={() => {
              dispatch({ type: 'SET_QUICK_FILTER', payload: 'hotels' });
            }}
          />
        )}
      </div>

      {/* AI Assistant Section */}
      <AIAssistantSection
        city={city}
        places={places}
        session={aiSession}
      />

      {/* Save Place Hint - First-time user guidance */}
      <SavePlaceHint />

      {/* Floating Search Button - Top Right */}
      <button
        onClick={() => setShowPlaceSearch(true)}
        className="fixed top-20 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border-2 border-purple-200 text-purple-600 font-medium shadow-lg hover:shadow-xl hover:border-purple-300 hover:scale-105 transition-all"
      >
        <Search className="w-4 h-4" />
        <span>Find Place</span>
      </button>

      {/* Place Search Modal */}
      <PlaceSearchModal
        isOpen={showPlaceSearch}
        onClose={() => setShowPlaceSearch(false)}
        cityCoordinates={city.coordinates}
        cityName={city.name}
        onAddToBoard={(place, cardType) => {
          // Convert PlaceResult to TravelPlace format and select it
          const travelPlace: TravelPlace = {
            id: place.place_id || `search-${Date.now()}`,
            name: place.name,
            imageUrl: place.photos?.[0] || '',
            categories: place.types || [],
            rating: place.rating || 0,
            reviewCount: place.review_count || 0,
            popularityScore: place.rating || 0,
            description: place.editorial_summary || '',
            coordinates: place.coordinates || city.coordinates,
            address: place.address,
            priceLevel: place.price_level,
          };

          // Save the place
          savePlace(travelPlace.id);

          // Open the detail drawer for this place
          selectPlace(travelPlace);

          // Close the search modal
          setShowPlaceSearch(false);
        }}
      />
    </>
  );
}
