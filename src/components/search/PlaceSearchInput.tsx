'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, MapPin, Utensils, Hotel, Compass, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutocomplete } from '@/hooks/useAutocomplete';

interface PlacePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

interface PlaceSearchInputProps {
  cityCoordinates?: { lat: number; lng: number };
  onSelectPlace: (prediction: PlacePrediction) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

// Get icon based on place types
function getPlaceIcon(types: string[]) {
  if (types.some(t => t.includes('restaurant') || t.includes('food') || t.includes('cafe') || t.includes('bar'))) {
    return <Utensils className="w-4 h-4 text-pink-500" />;
  }
  if (types.some(t => t.includes('lodging') || t.includes('hotel'))) {
    return <Hotel className="w-4 h-4 text-purple-500" />;
  }
  if (types.some(t => t.includes('tourist') || t.includes('museum') || t.includes('park') || t.includes('point_of_interest'))) {
    return <Compass className="w-4 h-4 text-blue-500" />;
  }
  return <MapPin className="w-4 h-4 text-gray-500" />;
}

export function PlaceSearchInput({
  cityCoordinates,
  onSelectPlace,
  placeholder = 'Search for a place...',
  className,
  autoFocus = false,
}: PlaceSearchInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use cached autocomplete hook with location bias
  const locationString = cityCoordinates
    ? `${cityCoordinates.lat},${cityCoordinates.lng}`
    : undefined;

  const { predictions, isLoading } = useAutocomplete({
    input: query,
    types: 'establishment', // Search for places, not cities
    enabled: query.length >= 2,
    location: locationString,
    radius: cityCoordinates ? 50000 : undefined, // 50km radius
  });

  // Open dropdown when predictions arrive
  useEffect(() => {
    if (predictions.length > 0 && query.length >= 2) {
      setIsOpen(true);
    }
  }, [predictions, query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < predictions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : predictions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < predictions.length) {
          handleSelect(predictions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle place selection
  const handleSelect = (prediction: PlacePrediction) => {
    setQuery(prediction.main_text);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelectPlace(prediction);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear input
  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-purple-100 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
        />
        {isLoading ? (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500 animate-spin" />
        ) : query.length > 0 ? (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        ) : null}
      </div>

      {/* Predictions Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-purple-100 overflow-hidden z-50 max-h-[300px] overflow-y-auto"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelect(prediction)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                highlightedIndex === index
                  ? 'bg-purple-50'
                  : 'hover:bg-gray-50'
              )}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                {getPlaceIcon(prediction.types)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {prediction.main_text}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {prediction.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && predictions.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-purple-100 p-4 z-50">
          <p className="text-center text-gray-500">No places found</p>
        </div>
      )}
    </div>
  );
}
