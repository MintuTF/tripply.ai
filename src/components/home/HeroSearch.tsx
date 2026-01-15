'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, MapPin, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutocomplete } from '@/hooks/useAutocomplete';

interface HeroSearchProps {
  className?: string;
}

const HERO_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80',
    location: 'Maldives',
    gradient: 'from-cyan-500/20 to-blue-600/40',
  },
  {
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1920&q=80',
    location: 'Kyoto, Japan',
    gradient: 'from-rose-500/20 to-orange-600/40',
  },
  {
    url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1920&q=80',
    location: 'Paris, France',
    gradient: 'from-purple-500/20 to-indigo-600/40',
  },
  {
    url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1920&q=80',
    location: 'Santorini, Greece',
    gradient: 'from-blue-500/20 to-cyan-600/40',
  },
];

const TRENDING_SUGGESTIONS = [
  { name: 'Tokyo', country: 'Japan', icon: '🗼' },
  { name: 'Bali', country: 'Indonesia', icon: '🏝️' },
  { name: 'Paris', country: 'France', icon: '🗼' },
  { name: 'Iceland', country: 'Nordic', icon: '🏔️' },
];

export function HeroSearch({ className }: HeroSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Use cached autocomplete hook instead of manual fetch
  const { predictions: suggestions, isLoading } = useAutocomplete({
    input: searchValue,
    types: '(cities)',
    enabled: isFocused,
  });

  // Background image rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Navigate directly to travel page with destination
  const handleCitySelect = (cityName: string, fullName?: string) => {
    const destination = fullName || cityName;
    router.push(`/travel?destination=${encodeURIComponent(destination)}`);
    setIsFocused(false);
  };

  const handleSearch = (destination?: string, fullName?: string) => {
    const query = destination || searchValue.trim();
    if (query) {
      handleCitySelect(query, fullName || query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className={cn('relative min-h-[100vh] flex items-center justify-center overflow-hidden', className)}>
      {/* Background Images with Crossfade */}
      <AnimatePresence mode="wait">
        {HERO_IMAGES.map((image, index) => (
          index === currentImageIndex && (
            <motion.div
              key={image.url}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${image.url})` }}
              />
              <div className={cn('absolute inset-0 bg-gradient-to-b', image.gradient)} />
              <div className="absolute inset-0 bg-black/30" />
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-8"
          >
            <Sparkles className="h-4 w-4" />
            AI-Powered Trip Planning
          </motion.div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
            Where will your next
            <br />
            <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              adventure take you?
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Discover destinations, get AI recommendations, and build your perfect itinerary.
          </p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative max-w-2xl mx-auto"
          >
            <div
              className={cn(
                'relative flex items-center gap-3 bg-white/95 backdrop-blur-xl rounded-2xl',
                'border-2 transition-all duration-300',
                'shadow-2xl shadow-black/20',
                isFocused ? 'border-primary ring-4 ring-primary/20' : 'border-white/50'
              )}
            >
              <div className="pl-5">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onKeyDown={handleKeyDown}
                placeholder="Search destinations, or ask AI anything..."
                className="flex-1 py-5 pr-4 bg-transparent text-foreground placeholder:text-muted-foreground text-lg focus:outline-none"
              />
              <motion.button
                onClick={() => handleSearch()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl mr-2 font-semibold transition-colors"
              >
                <span className="hidden sm:inline">Explore</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden z-50"
                >
                  <div className="p-4">
                    {/* Loading state */}
                    {isLoading && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                      </div>
                    )}

                    {/* Autocomplete results */}
                    {!isLoading && suggestions.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                          <Search className="h-4 w-4" />
                          Search Results
                        </div>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {suggestions.map((suggestion) => (
                            <button
                              key={suggestion.place_id}
                              onClick={() => handleSearch(suggestion.main_text, suggestion.description)}
                              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-accent transition-colors text-left"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                                <MapPin className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-foreground truncate">{suggestion.main_text}</div>
                                <div className="text-sm text-muted-foreground truncate">{suggestion.secondary_text}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Trending destinations (shown when no search or no results) */}
                    {!isLoading && suggestions.length === 0 && (
                      <>
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                          <TrendingUp className="h-4 w-4" />
                          {searchValue.trim().length >= 2 ? 'No results found. Try these:' : 'Trending Destinations'}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {TRENDING_SUGGESTIONS.map((suggestion) => (
                            <button
                              key={suggestion.name}
                              onClick={() => handleSearch(suggestion.name)}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors text-left"
                            >
                              <span className="text-2xl">{suggestion.icon}</span>
                              <div>
                                <div className="font-medium text-foreground">{suggestion.name}</div>
                                <div className="text-sm text-muted-foreground">{suggestion.country}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Current Location Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 inline-flex items-center gap-2 text-white/60 text-sm"
          >
            <MapPin className="h-4 w-4" />
            Showing: {HERO_IMAGES[currentImageIndex].location}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-3 bg-white/60 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
