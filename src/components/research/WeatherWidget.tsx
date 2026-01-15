'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  ChevronDown,
  ChevronUp,
  Thermometer,
  CloudSun,
  CloudFog,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    humidity: number;
    apparentTemperature: number;
  };
  daily: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
    precipitationProbability: number;
  }>;
}

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
  destination: string;
  className?: string;
}

// Weather code to icon/description mapping (WMO Weather interpretation codes)
const weatherCodes: Record<number, { icon: React.ElementType; label: string; activity: string }> = {
  0: { icon: Sun, label: 'Clear sky', activity: 'outdoor activities' },
  1: { icon: CloudSun, label: 'Mainly clear', activity: 'outdoor activities' },
  2: { icon: CloudSun, label: 'Partly cloudy', activity: 'sightseeing' },
  3: { icon: Cloud, label: 'Overcast', activity: 'museums & galleries' },
  45: { icon: CloudFog, label: 'Foggy', activity: 'cozy cafes' },
  48: { icon: CloudFog, label: 'Fog', activity: 'indoor attractions' },
  51: { icon: CloudRain, label: 'Light drizzle', activity: 'shopping' },
  53: { icon: CloudRain, label: 'Drizzle', activity: 'indoor activities' },
  55: { icon: CloudRain, label: 'Heavy drizzle', activity: 'spa & wellness' },
  61: { icon: CloudRain, label: 'Light rain', activity: 'museums' },
  63: { icon: CloudRain, label: 'Rain', activity: 'indoor dining' },
  65: { icon: CloudRain, label: 'Heavy rain', activity: 'stay cozy indoors' },
  71: { icon: CloudSnow, label: 'Light snow', activity: 'winter sports' },
  73: { icon: CloudSnow, label: 'Snow', activity: 'snow activities' },
  75: { icon: CloudSnow, label: 'Heavy snow', activity: 'warm indoor spots' },
  77: { icon: CloudSnow, label: 'Snow grains', activity: 'hot drinks & views' },
  80: { icon: CloudRain, label: 'Rain showers', activity: 'quick visits' },
  81: { icon: CloudRain, label: 'Showers', activity: 'covered markets' },
  82: { icon: CloudRain, label: 'Heavy showers', activity: 'stay sheltered' },
  85: { icon: CloudSnow, label: 'Snow showers', activity: 'après-ski' },
  86: { icon: CloudSnow, label: 'Heavy snow', activity: 'cozy retreats' },
  95: { icon: CloudRain, label: 'Thunderstorm', activity: 'stay safe indoors' },
  96: { icon: CloudRain, label: 'Thunderstorm', activity: 'wait it out' },
  99: { icon: CloudRain, label: 'Severe storm', activity: 'stay indoors' },
};

const getWeatherInfo = (code: number) => {
  return weatherCodes[code] || weatherCodes[0];
};

const getDayName = (dateStr: string, index: number) => {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

export function WeatherWidget({ latitude, longitude, destination, className }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`
        );

        if (!response.ok) throw new Error('Weather data unavailable');

        const data = await response.json();

        setWeather({
          current: {
            temperature: Math.round(data.current.temperature_2m),
            weatherCode: data.current.weather_code,
            windSpeed: Math.round(data.current.wind_speed_10m),
            humidity: data.current.relative_humidity_2m,
            apparentTemperature: Math.round(data.current.apparent_temperature),
          },
          daily: data.daily.time.map((date: string, i: number) => ({
            date,
            maxTemp: Math.round(data.daily.temperature_2m_max[i]),
            minTemp: Math.round(data.daily.temperature_2m_min[i]),
            weatherCode: data.daily.weather_code[i],
            precipitationProbability: data.daily.precipitation_probability_max[i],
          })),
        });
      } catch (err) {
        setError('Could not load weather');
      } finally {
        setIsLoading(false);
      }
    };

    if (latitude && longitude) {
      fetchWeather();
    }
  }, [latitude, longitude]);

  const convertTemp = (temp: number) => {
    if (unit === 'F') return Math.round((temp * 9) / 5 + 32);
    return temp;
  };

  if (isLoading) {
    return (
      <div className={cn('p-4 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30', className)}>
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-sm text-muted-foreground">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={cn('p-4 rounded-xl bg-muted/30', className)}>
        <p className="text-sm text-muted-foreground text-center">{error || 'Weather unavailable'}</p>
      </div>
    );
  }

  const currentWeather = getWeatherInfo(weather.current.weatherCode);
  const CurrentIcon = currentWeather.icon;

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden transition-all duration-300',
        'bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50',
        'dark:from-blue-950/40 dark:via-sky-950/30 dark:to-cyan-950/40',
        'border border-blue-100/50 dark:border-blue-800/30',
        className
      )}
    >
      {/* Current Weather Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-xl bg-white/60 dark:bg-white/10 shadow-sm">
                <CurrentIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              {weather.current.weatherCode >= 61 && weather.current.weatherCode <= 82 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-foreground">
                  {convertTemp(weather.current.temperature)}°{unit}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUnit(unit === 'C' ? 'F' : 'C');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  / °{unit === 'C' ? 'F' : 'C'}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">{currentWeather.label}</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Thermometer className="h-3.5 w-3.5" />
            <span>Feels {convertTemp(weather.current.apparentTemperature)}°</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind className="h-3.5 w-3.5" />
            <span>{weather.current.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="h-3.5 w-3.5" />
            <span>{weather.current.humidity}%</span>
          </div>
        </div>
      </button>

      {/* Expanded forecast */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* 5-day forecast */}
              <div className="pt-3 border-t border-blue-200/50 dark:border-blue-800/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">5-DAY FORECAST</p>
                <div className="space-y-2">
                  {weather.daily.map((day, index) => {
                    const dayWeather = getWeatherInfo(day.weatherCode);
                    const DayIcon = dayWeather.icon;
                    return (
                      <div
                        key={day.date}
                        className="flex items-center justify-between py-1.5"
                      >
                        <span className="text-sm font-medium text-foreground w-20">
                          {getDayName(day.date, index)}
                        </span>
                        <div className="flex items-center gap-2 flex-1 justify-center">
                          <DayIcon className="h-4 w-4 text-blue-500" />
                          {day.precipitationProbability > 30 && (
                            <span className="text-xs text-blue-500">
                              {day.precipitationProbability}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="font-medium text-foreground">
                            {convertTemp(day.maxTemp)}°
                          </span>
                          <span className="text-muted-foreground">
                            {convertTemp(day.minTemp)}°
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity suggestion */}
              <div className="p-3 rounded-lg bg-white/50 dark:bg-white/5">
                <p className="text-xs font-medium text-muted-foreground mb-1">PERFECT FOR</p>
                <p className="text-sm text-foreground">
                  Great weather for {currentWeather.activity} in {destination}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
