'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sun, Calendar, DollarSign, ChevronLeft, Cloud, Loader2 } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import {
  getCountryFlag,
  getBestTimeToVisit,
  getPriceLevel,
  getWeatherEmoji,
  extractCountryCode
} from '@/lib/travel/cityMetadata';

interface WeatherData {
  temp: number;
  condition: string;
}

export function CitySummary() {
  const { state, dispatch } = useTravel();
  const { city } = state;
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Fetch weather when city changes
  useEffect(() => {
    if (city?.coordinates) {
      fetchWeather();
    }
  }, [city?.coordinates.lat, city?.coordinates.lng]);

  const fetchWeather = async () => {
    if (!city?.coordinates) return;

    setWeatherLoading(true);
    try {
      const response = await fetch(
        `/api/travel/weather?lat=${city.coordinates.lat}&lng=${city.coordinates.lng}`
      );
      if (response.ok) {
        const data = await response.json();
        setWeather(data.weather);
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  if (!city) return null;

  const handleBack = () => {
    dispatch({ type: 'RESET' });
  };

  // Get metadata
  const countryCode = city.countryCode || extractCountryCode(city.country);
  const flag = countryCode ? getCountryFlag(countryCode) : '';
  const bestTime = getBestTimeToVisit(city.name);
  const priceLevel = city.priceLevel || getPriceLevel(city.name);
  const weatherEmoji = weather ? getWeatherEmoji(weather.condition) : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={city.imageUrl || '/placeholder-city.jpg'}
          alt={city.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-white/80 hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">New Search</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          {/* City Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {flag && <span className="text-xl">{flag}</span>}
              <MapPin className="w-5 h-5 text-pink-400" />
              <span className="text-white/80 text-sm font-medium">
                {city.country}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {city.name}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {/* Weather Badge */}
              {weatherLoading ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading weather...</span>
                </div>
              ) : weather ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm">
                  <span>{weatherEmoji}</span>
                  <span>{weather.temp}°C • {weather.condition}</span>
                </div>
              ) : city.weather ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm">
                  <Sun className="w-4 h-4" />
                  <span>{city.weather.temp}°C • {city.weather.condition}</span>
                </div>
              ) : null}

              {/* Best Time Badge */}
              {(bestTime || city.bestSeason) && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Best: {bestTime?.season || city.bestSeason}</span>
                </div>
              )}

              {/* Price Level Badge */}
              {priceLevel && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>{priceLevel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="text-center px-6 py-3 rounded-xl bg-white/20 backdrop-blur-md">
              <p className="text-2xl font-bold text-white">
                {state.places.length}
              </p>
              <p className="text-sm text-white/80">Places</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
