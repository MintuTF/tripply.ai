'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import {
  MapPin,
  Clock,
  Coins,
  Languages,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  ArrowLeft,
  Bookmark,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Destination data with images and info
const DESTINATION_DATA: Record<string, {
  tagline: string;
  description: string;
  image: string;
  country: string;
  timezone: string;
  currency: string;
  language: string;
  coordinates: { lat: number; lng: number };
}> = {
  'Tokyo': {
    tagline: 'Where tradition meets innovation',
    description: 'Experience the perfect blend of ancient temples and cutting-edge technology',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80',
    country: 'Japan',
    timezone: 'JST (UTC+9)',
    currency: 'JPY (¥)',
    language: 'Japanese',
    coordinates: { lat: 35.6762, lng: 139.6503 },
  },
  'Paris': {
    tagline: 'The City of Light awaits',
    description: 'Discover world-class art, cuisine, and timeless romance',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80',
    country: 'France',
    timezone: 'CET (UTC+1)',
    currency: 'EUR (€)',
    language: 'French',
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  'Bali': {
    tagline: 'Island of the Gods',
    description: 'Find paradise among ancient temples, rice terraces, and pristine beaches',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=80',
    country: 'Indonesia',
    timezone: 'WITA (UTC+8)',
    currency: 'IDR (Rp)',
    language: 'Indonesian',
    coordinates: { lat: -8.3405, lng: 115.0920 },
  },
  'New York': {
    tagline: 'The city that never sleeps',
    description: 'Experience the energy of iconic landmarks, world-class dining, and endless entertainment',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&q=80',
    country: 'USA',
    timezone: 'EST (UTC-5)',
    currency: 'USD ($)',
    language: 'English',
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  'London': {
    tagline: 'A world in one city',
    description: 'Explore centuries of history, royal palaces, and vibrant neighborhoods',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80',
    country: 'United Kingdom',
    timezone: 'GMT (UTC+0)',
    currency: 'GBP (£)',
    language: 'English',
    coordinates: { lat: 51.5074, lng: -0.1278 },
  },
  'Dubai': {
    tagline: 'Where dreams touch the sky',
    description: 'Discover futuristic architecture, luxury shopping, and desert adventures',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80',
    country: 'UAE',
    timezone: 'GST (UTC+4)',
    currency: 'AED (د.إ)',
    language: 'Arabic',
    coordinates: { lat: 25.2048, lng: 55.2708 },
  },
  'Sydney': {
    tagline: 'Where the outback meets the ocean',
    description: 'Experience stunning harbors, golden beaches, and vibrant culture',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1920&q=80',
    country: 'Australia',
    timezone: 'AEST (UTC+10)',
    currency: 'AUD ($)',
    language: 'English',
    coordinates: { lat: -33.8688, lng: 151.2093 },
  },
  'Rome': {
    tagline: 'The Eternal City',
    description: 'Walk through millennia of history, art, and culinary excellence',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1920&q=80',
    country: 'Italy',
    timezone: 'CET (UTC+1)',
    currency: 'EUR (€)',
    language: 'Italian',
    coordinates: { lat: 41.9028, lng: 12.4964 },
  },
};

// Default destination data
const DEFAULT_DESTINATION = {
  tagline: 'Your next adventure awaits',
  description: 'Discover amazing places, hidden gems, and local favorites',
  image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80',
  country: '',
  timezone: 'Local Time',
  currency: 'Local Currency',
  language: 'Local Language',
  coordinates: { lat: 0, lng: 0 },
};

interface WeatherData {
  temperature: number;
  condition: string;
  icon: 'sun' | 'cloud' | 'rain';
}

interface ResearchHeroProps {
  destination: string;
  onBack?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  className?: string;
}

export function ResearchHero({
  destination,
  onBack,
  onSave,
  onShare,
  className,
}: ResearchHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [destData, setDestData] = useState(
    DESTINATION_DATA[destination] || {
      ...DEFAULT_DESTINATION,
      tagline: `Explore ${destination}`,
      description: `Discover the best of ${destination} with personalized recommendations`,
    }
  );
  const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);

  // Track mount state for SSR safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch geocode data if not in hardcoded data
  useEffect(() => {
    const fetchGeocodeData = async () => {
      // Skip if we already have hardcoded data for this destination
      if (DESTINATION_DATA[destination]) {
        return;
      }

      setIsLoadingGeocode(true);
      try {
        const response = await fetch(`/api/places/geocode?address=${encodeURIComponent(destination)}`);
        if (response.ok) {
          const data = await response.json();
          const location = data.location;

          // Use Unsplash random city image as fallback
          const unsplashImage = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80`;

          setDestData({
            tagline: `Discover ${location.city || destination}`,
            description: `Explore the best of ${location.city || destination} with AI-powered recommendations`,
            image: unsplashImage,
            country: location.country || '',
            timezone: 'Local Time',
            currency: 'Local Currency',
            language: 'Local Language',
            coordinates: {
              lat: location.lat,
              lng: location.lng,
            },
          });
        }
      } catch (error) {
        console.error('Failed to fetch geocode data:', error);
      } finally {
        setIsLoadingGeocode(false);
      }
    };

    fetchGeocodeData();
  }, [destination]);

  // Parallax scroll effect
  const { scrollY } = useScroll();
  const yTransform = useTransform(scrollY, [0, 500], [0, 150]);
  const opacityTransform = useTransform(scrollY, [0, 300], [1, 0]);
  const scaleTransform = useTransform(scrollY, [0, 500], [1, 1.1]);

  // Only apply transforms after mount to avoid SSR issues
  const y = isMounted ? yTransform : 0;
  const opacity = isMounted ? opacityTransform : 1;
  const scale = isMounted ? scaleTransform : 1;

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      const coords = destData.coordinates;
      if (coords.lat === 0 && coords.lng === 0) return;

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,weather_code`
        );
        const data = await response.json();

        const weatherCode = data.current.weather_code;
        let condition = 'Clear';
        let icon: 'sun' | 'cloud' | 'rain' = 'sun';

        if (weatherCode >= 61 && weatherCode <= 82) {
          condition = 'Rainy';
          icon = 'rain';
        } else if (weatherCode >= 1 && weatherCode <= 48) {
          condition = 'Cloudy';
          icon = 'cloud';
        } else {
          condition = 'Sunny';
          icon = 'sun';
        }

        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          condition,
          icon,
        });
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      }
    };

    fetchWeather();
  }, [destData.coordinates]);

  const WeatherIcon = weather?.icon === 'sun' ? Sun : weather?.icon === 'rain' ? CloudRain : Cloud;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden',
        className
      )}
    >
      {/* Background Image with Parallax */}
      <motion.div
        className="absolute inset-0"
        style={{ y, scale }}
      >
        {/* Placeholder while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
        )}

        <img
          src={destData.image}
          alt={destination}
          onLoad={() => setImageLoaded(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-700',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </motion.div>

      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onClick={onBack}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">Back</span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={onShare}
                className="p-2.5 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={onSave}
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl hover:bg-white/20"
              >
                <Bookmark className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Save Trip</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{ opacity }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
          {/* Location Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 mb-4"
          >
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm">
              <MapPin className="h-4 w-4" />
              <span>{destData.country || destination}</span>
            </div>
          </motion.div>

          {/* Destination Name */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-3"
          >
            {destination}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl sm:text-2xl text-white/90 font-light mb-6 max-w-2xl"
          >
            {destData.tagline}
          </motion.p>

          {/* Info Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center gap-3"
          >
            {/* Weather Badge */}
            {weather && (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl text-white border border-white/10">
                <WeatherIcon className="h-5 w-5 text-amber-300" />
                <span className="font-medium">{weather.temperature}°C</span>
                <span className="text-white/70">{weather.condition}</span>
              </div>
            )}

            {/* Timezone Badge */}
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl text-white border border-white/10">
              <Clock className="h-5 w-5 text-blue-300" />
              <span>{destData.timezone}</span>
            </div>

            {/* Currency Badge */}
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl text-white border border-white/10">
              <Coins className="h-5 w-5 text-green-300" />
              <span>{destData.currency}</span>
            </div>

            {/* Language Badge - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl text-white border border-white/10">
              <Languages className="h-5 w-5 text-purple-300" />
              <span>{destData.language}</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1"
        >
          <motion.div
            className="w-1.5 h-3 bg-white/60 rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ResearchHero;
