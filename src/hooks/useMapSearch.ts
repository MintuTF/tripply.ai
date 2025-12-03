import { useState, useMemo, useEffect } from 'react';
import { Card, CardType } from '@/types';
import { FilterState, HotelFilters, RestaurantFilters, SpotFilters, ActivityFilters, AllFilters } from '@/components/map/HorizontalFilters';

export interface MapSearchState {
  searchQuery: string;
  typeFilter: CardType | 'all';
  filters: FilterState;
}

// Initialize filters based on category
function getInitialFilters(type: CardType | 'all'): FilterState {
  switch (type) {
    case 'hotel':
      return {
        priceRange: [0, 500],
        rating: null,
        amenities: [],
        sortBy: 'relevance',
      } as HotelFilters;
    case 'food':
      return {
        priceLevel: null,
        cuisineTypes: [],
        dietaryOptions: [],
        rating: null,
        sortBy: 'relevance',
      } as RestaurantFilters;
    case 'spot':
      return {
        types: [],
        priceRange: [0, 100],
        rating: null,
        sortBy: 'relevance',
      } as SpotFilters;
    case 'activity':
      return {
        types: [],
        duration: null,
        priceRange: [0, 200],
        rating: null,
        sortBy: 'relevance',
      } as ActivityFilters;
    default:
      return {
        priceRange: [0, 500],
        rating: null,
        sortBy: 'relevance',
      } as AllFilters;
  }
}

export function useMapSearch(cards: Card[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CardType | 'all'>('hotel');
  const [filters, setFilters] = useState<FilterState>(getInitialFilters('hotel'));

  // Update filters when type changes
  useEffect(() => {
    setFilters(getInitialFilters(typeFilter));
  }, [typeFilter]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Helper to parse duration
  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+(?:\.\d+)?)\s*(hour|hr|h)/i);
    if (match) {
      return parseFloat(match[1]);
    }
    return 0;
  };

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let results = [...cards];

    // Text search
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase();
      results = results.filter((card) => {
        const payload = typeof card.payload_json === 'string'
          ? JSON.parse(card.payload_json)
          : card.payload_json;

        const searchableText = [
          payload.name,
          payload.title,
          payload.address,
          payload.description,
          payload.type,
          payload.cuisine_type,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      results = results.filter((card) => card.type === typeFilter);
    }

    // Category-specific filters
    if (typeFilter === 'hotel' && 'amenities' in filters) {
      const hotelFilters = filters as HotelFilters;

      // Price filter
      results = results.filter((card) => {
        const payload = typeof card.payload_json === 'string'
          ? JSON.parse(card.payload_json)
          : card.payload_json;

        // Priority: amadeus_price (real-time pricing) → price_range → cost
        const price = payload.amadeus_price || payload.cost || (payload.price_range ? payload.price_range[1] : null);
        if (price === null || price === undefined) return true;
        return price <= hotelFilters.priceRange[1];
      });

      // Rating filter
      if (hotelFilters.rating !== null) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          return payload.rating && payload.rating >= hotelFilters.rating!;
        });
      }

      // Amenities filter
      if (hotelFilters.amenities.length > 0) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          const cardAmenities = payload.amenities || [];
          return hotelFilters.amenities.some((amenity) => cardAmenities.includes(amenity));
        });
      }
    } else if (typeFilter === 'food' && 'cuisineTypes' in filters) {
      const restaurantFilters = filters as RestaurantFilters;

      // Price level filter
      if (restaurantFilters.priceLevel !== null) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          return payload.price_level && payload.price_level <= restaurantFilters.priceLevel!;
        });
      }

      // Cuisine types filter
      if (restaurantFilters.cuisineTypes.length > 0) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          return restaurantFilters.cuisineTypes.includes(payload.cuisine_type);
        });
      }

      // Dietary options filter
      if (restaurantFilters.dietaryOptions.length > 0) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          const dietaryTags = payload.dietary_tags || [];
          return restaurantFilters.dietaryOptions.some((option) => dietaryTags.includes(option));
        });
      }

      // Rating filter
      if (restaurantFilters.rating !== null) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          return payload.rating && payload.rating >= restaurantFilters.rating!;
        });
      }
    } else if (typeFilter === 'spot' && 'types' in filters && !('duration' in filters)) {
      const spotFilters = filters as SpotFilters;

      // Type filter
      if (spotFilters.types.length > 0) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          return spotFilters.types.includes(payload.type?.toLowerCase());
        });
      }

      // Price filter
      results = results.filter((card) => {
        const payload = typeof card.payload_json === 'string'
          ? JSON.parse(card.payload_json)
          : card.payload_json;

        const price = payload.cost || 0;
        if (spotFilters.priceRange[1] === 0) {
          // Free only
          return price === 0;
        }
        return price <= spotFilters.priceRange[1];
      });

      // Rating filter
      if (spotFilters.rating !== null) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          return payload.rating && payload.rating >= spotFilters.rating!;
        });
      }
    } else if (typeFilter === 'activity' && 'duration' in filters) {
      const activityFilters = filters as ActivityFilters;

      // Type filter
      if (activityFilters.types.length > 0) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          const cardType = payload.type?.toLowerCase().replace(/ /g, '_');
          return activityFilters.types.includes(cardType);
        });
      }

      // Duration filter
      if (activityFilters.duration !== null) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;

          if (!payload.duration) return false;

          const hours = parseDuration(payload.duration);
          switch (activityFilters.duration) {
            case '<2h':
              return hours < 2;
            case '2-3h':
              return hours >= 2 && hours <= 3;
            case '3h+':
              return hours > 3;
            default:
              return true;
          }
        });
      }

      // Price filter
      results = results.filter((card) => {
        const payload = typeof card.payload_json === 'string'
          ? JSON.parse(card.payload_json)
          : card.payload_json;

        const price = payload.price || payload.cost || 0;
        return price <= activityFilters.priceRange[1];
      });

      // Rating filter
      if (activityFilters.rating !== null) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;
          return payload.rating && payload.rating >= activityFilters.rating!;
        });
      }
    } else if (typeFilter === 'all' && 'priceRange' in filters && !('amenities' in filters) && !('cuisineTypes' in filters) && !('types' in filters)) {
      const allFilters = filters as AllFilters;

      // General price filter
      results = results.filter((card) => {
        const payload = typeof card.payload_json === 'string'
          ? JSON.parse(card.payload_json)
          : card.payload_json;

        // Priority: amadeus_price (real-time pricing) → cost → price → price_range
        const price =
          payload.amadeus_price ||
          payload.cost ||
          payload.price ||
          (payload.price_range ? payload.price_range[1] : null);

        if (price === null || price === undefined) return true;
        return price <= allFilters.priceRange[1];
      });

      // General rating filter
      if (allFilters.rating !== null) {
        results = results.filter((card) => {
          const payload = typeof card.payload_json === 'string'
            ? JSON.parse(card.payload_json)
            : card.payload_json;

          return payload.rating && payload.rating >= allFilters.rating!;
        });
      }
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price':
        results.sort((a, b) => {
          const aPayload = typeof a.payload_json === 'string' ? JSON.parse(a.payload_json) : a.payload_json;
          const bPayload = typeof b.payload_json === 'string' ? JSON.parse(b.payload_json) : b.payload_json;

          // Priority: amadeus_price (real-time pricing) → cost → price → price_range → default high value
          const aPrice = aPayload.amadeus_price || aPayload.cost || aPayload.price || (aPayload.price_range ? aPayload.price_range[0] : 999999);
          const bPrice = bPayload.amadeus_price || bPayload.cost || bPayload.price || (bPayload.price_range ? bPayload.price_range[0] : 999999);

          return aPrice - bPrice;
        });
        break;

      case 'rating':
        results.sort((a, b) => {
          const aPayload = typeof a.payload_json === 'string' ? JSON.parse(a.payload_json) : a.payload_json;
          const bPayload = typeof b.payload_json === 'string' ? JSON.parse(b.payload_json) : b.payload_json;

          const aRating = aPayload.rating || 0;
          const bRating = bPayload.rating || 0;

          return bRating - aRating;
        });
        break;

      case 'duration':
        if (typeFilter === 'activity') {
          results.sort((a, b) => {
            const aPayload = typeof a.payload_json === 'string' ? JSON.parse(a.payload_json) : a.payload_json;
            const bPayload = typeof b.payload_json === 'string' ? JSON.parse(b.payload_json) : b.payload_json;

            const aDuration = parseDuration(aPayload.duration || '0 hours');
            const bDuration = parseDuration(bPayload.duration || '0 hours');

            return aDuration - bDuration;
          });
        }
        break;

      case 'distance':
        // TODO: Implement distance-based sorting when user location is available
        break;

      case 'relevance':
      default:
        // Keep original order
        break;
    }

    return results;
  }, [cards, debouncedQuery, typeFilter, filters]);

  const clearFilters = () => {
    setFilters(getInitialFilters(typeFilter));
  };

  const clearAll = () => {
    setSearchQuery('');
    setTypeFilter('hotel');
    setFilters(getInitialFilters('hotel'));
  };

  const hasActiveFilters = () => {
    return filters.rating !== null;
  };

  return {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    filters,
    setFilters,
    filteredCards,
    clearFilters,
    clearAll,
    hasActiveFilters: searchQuery.trim() !== '' || typeFilter !== 'hotel' || hasActiveFilters(),
  };
}
