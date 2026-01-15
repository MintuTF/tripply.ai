'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2, Sparkles } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import { generateCitySlug } from '@/lib/travel/url-utils';
import type { CityData } from '@/lib/travel/types';

interface CitySuggestion {
  name: string;
  country: string;
  placeId: string;
  description: string;
}

export function HeroSearch() {
  const router = useRouter();
  const { setCity } = useTravel();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(searchQuery)}&types=(cities)`
      );
      if (response.ok) {
        const data = await response.json();
        // Map API response (snake_case) to component interface (camelCase)
        const mapped = (data.predictions || []).map((p: any) => ({
          name: p.main_text || p.description?.split(',')[0] || '',
          country: p.secondary_text || '',
          placeId: p.place_id,
          description: p.description,
        }));
        setSuggestions(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  const handleSelectCity = async (suggestion: CitySuggestion) => {
    setShowSuggestions(false);
    setQuery(suggestion.name);

    // Extract country from description (e.g., "Tokyo, Japan" -> "Japan")
    const country = suggestion.country || suggestion.description.split(', ').pop() || '';

    // Generate URL slug and navigate
    const citySlug = generateCitySlug(suggestion.name, country);
    router.push(`/travel/${citySlug}/explore`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectCity(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-3xl mx-auto"
      >
        {/* Sparkle badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-100 shadow-lg mb-6"
        >
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-purple-700">
            AI-Powered Travel Planning
          </span>
        </motion.div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
          <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Where do you want
          </span>
          <br />
          <span className="text-gray-900">to explore?</span>
        </h1>

        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          Discover amazing places and get personalized recommendations
          tailored to your travel style
        </p>

        {/* Search Input */}
        <div className="relative max-w-xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-purple-400" />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a city..."
              className="w-full pl-14 pr-6 py-5 text-lg rounded-2xl bg-white border-2 border-purple-100 shadow-xl shadow-purple-100/50 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                key="suggestions-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden z-50"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.placeId || `suggestion-${index}`}
                    onClick={() => handleSelectCity(suggestion)}
                    className={`w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-purple-50 transition-colors ${
                      index === selectedIndex ? 'bg-purple-50' : ''
                    } ${index !== suggestions.length - 1 ? 'border-b border-purple-50' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{suggestion.name}</p>
                      <p className="text-sm text-gray-500">{suggestion.description}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Popular destinations */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          <span className="text-sm text-gray-500 mr-2">Popular:</span>
          {['Tokyo', 'Paris', 'New York', 'Barcelona', 'Bali'].map((city) => (
            <button
              key={city}
              onClick={() => {
                setQuery(city);
                setShowSuggestions(true);
                fetchSuggestions(city);
              }}
              className="px-4 py-2 text-sm font-medium text-purple-700 bg-white/80 backdrop-blur-sm rounded-full border border-purple-100 hover:bg-purple-50 hover:border-purple-200 transition-all"
            >
              {city}
            </button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
