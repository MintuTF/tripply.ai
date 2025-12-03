'use client';

import { useState, useEffect } from 'react';
import { Trip } from '@/types';
import { generateMockWeather, WeatherData, celsiusToFahrenheit } from '@/lib/utils/weather';
import { Cloud, Droplets, Wind, Thermometer, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherWidgetProps {
  trip: Trip;
  day?: number; // If specified, show weather for specific day
  compact?: boolean;
}

export function WeatherWidget({ trip, day, compact = false }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [useFahrenheit, setUseFahrenheit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calculate total trip days
    const startDate = new Date(trip.dates.start);
    const endDate = new Date(trip.dates.end);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Fetch weather data (using mock data for demo)
    const weatherData = generateMockWeather(trip.dates.start, totalDays);
    setWeather(weatherData);
    setLoading(false);
  }, [trip.dates.start, trip.dates.end]);

  const convertTemp = (temp: number) => {
    return useFahrenheit ? celsiusToFahrenheit(temp) : temp;
  };

  const getTempUnit = () => (useFahrenheit ? '°F' : '°C');

  // If specific day requested, show only that day
  const displayWeather = day !== undefined ? weather.slice(day - 1, day) : weather;

  if (loading) {
    return (
      <div className={cn(
        'rounded-xl border-2 border-border bg-card p-4',
        compact && 'p-3'
      )}>
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading weather...</p>
        </div>
      </div>
    );
  }

  if (compact) {
    // Compact view for single day
    const dayWeather = displayWeather[0];
    if (!dayWeather) return null;

    return (
      <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 px-3 py-2">
        <span className="text-2xl">{dayWeather.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{dayWeather.condition}</p>
          <p className="text-xs text-muted-foreground">
            {convertTemp(dayWeather.tempMin)}{getTempUnit()} - {convertTemp(dayWeather.tempMax)}{getTempUnit()}
          </p>
        </div>
      </div>
    );
  }

  // Full weather widget
  return (
    <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Weather Forecast</h3>
        </div>
        <button
          onClick={() => setUseFahrenheit(!useFahrenheit)}
          className="rounded-lg bg-background px-3 py-1.5 text-xs font-semibold border border-border hover:bg-muted transition-colors"
        >
          {useFahrenheit ? '°F' : '°C'}
        </button>
      </div>

      {/* Weather Grid */}
      <div className="p-4 space-y-3">
        {displayWeather.map((dayWeather, index) => {
          const weatherDate = new Date(dayWeather.date);
          const isExtreme = dayWeather.tempMax > 30 || dayWeather.tempMax < 5;

          return (
            <div
              key={index}
              className={cn(
                'rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md',
                isExtreme ? 'border-orange-500/30 bg-orange-500/5' : 'border-border bg-background'
              )}
            >
              <div className="flex items-center gap-4">
                {/* Date & Icon */}
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-4xl">{dayWeather.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Day {index + 1}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {weatherDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Temperature */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {convertTemp(dayWeather.temp)}{getTempUnit()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {convertTemp(dayWeather.tempMin)}{getTempUnit()} - {convertTemp(dayWeather.tempMax)}{getTempUnit()}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Droplets className="h-3.5 w-3.5" />
                  <span>{dayWeather.humidity}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="h-3.5 w-3.5" />
                  <span>{dayWeather.windSpeed} km/h</span>
                </div>
                <span className="flex-1 text-left">{dayWeather.description}</span>
              </div>

              {/* Weather Alert */}
              {isExtreme && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-orange-500/10 border border-orange-500/20 p-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    {dayWeather.tempMax > 30
                      ? 'High temperature - stay hydrated and wear sunscreen'
                      : 'Cold weather - pack warm clothing'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3 bg-muted/30">
        <p className="text-xs text-center text-muted-foreground">
          Weather data is for demo purposes. Add your OpenWeatherMap API key for live data.
        </p>
      </div>
    </div>
  );
}
