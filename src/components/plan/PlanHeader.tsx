'use client';

import { motion } from 'framer-motion';
import { MapPin, Cloud, Clock, Banknote, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanHeaderProps {
  destination: string;
  tripDates?: { start?: string; end?: string };
  className?: string;
}

// Destination metadata for theming and context
const DESTINATION_META: Record<string, {
  emoji: string;
  tagline: string;
  gradient: string;
  weather?: string;
  timezone: string;
  currency: string;
}> = {
  'Tokyo': {
    emoji: '🗼',
    tagline: 'Where tradition meets innovation',
    gradient: 'from-rose-500/20 via-pink-500/20 to-purple-500/20',
    weather: '18°C Partly Cloudy',
    timezone: 'JST (UTC+9)',
    currency: 'JPY ¥',
  },
  'Paris': {
    emoji: '🗼',
    tagline: 'The City of Light and Romance',
    gradient: 'from-purple-500/20 via-indigo-500/20 to-blue-500/20',
    weather: '15°C Clear',
    timezone: 'CET (UTC+1)',
    currency: 'EUR €',
  },
  'New York': {
    emoji: '🗽',
    tagline: 'The City That Never Sleeps',
    gradient: 'from-blue-500/20 via-cyan-500/20 to-teal-500/20',
    weather: '12°C Sunny',
    timezone: 'EST (UTC-5)',
    currency: 'USD $',
  },
  'London': {
    emoji: '🇬🇧',
    tagline: 'Where History Meets Modernity',
    gradient: 'from-slate-500/20 via-gray-500/20 to-zinc-500/20',
    weather: '10°C Rainy',
    timezone: 'GMT (UTC+0)',
    currency: 'GBP £',
  },
  'Bali': {
    emoji: '🏝️',
    tagline: 'Island of the Gods',
    gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
    weather: '28°C Humid',
    timezone: 'WITA (UTC+8)',
    currency: 'IDR Rp',
  },
  'Dubai': {
    emoji: '🏙️',
    tagline: 'Luxury Meets the Desert',
    gradient: 'from-amber-500/20 via-orange-500/20 to-yellow-500/20',
    weather: '32°C Sunny',
    timezone: 'GST (UTC+4)',
    currency: 'AED د.إ',
  },
  'default': {
    emoji: '✈️',
    tagline: 'Your next adventure awaits',
    gradient: 'from-primary/20 via-secondary/20 to-accent/20',
    weather: undefined,
    timezone: 'Local Time',
    currency: 'Local Currency',
  },
};

// Extract city name from destination string (e.g., "Tokyo, Japan" -> "Tokyo")
function getCityName(destination: string): string {
  return destination.split(',')[0].trim();
}

// Get destination metadata with fallback to default
function getDestinationMeta(destination: string) {
  const city = getCityName(destination);
  return DESTINATION_META[city] || DESTINATION_META['default'];
}

export function PlanHeader({ destination, tripDates, className }: PlanHeaderProps) {
  const meta = getDestinationMeta(destination);
  const cityName = getCityName(destination);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50',
        'bg-gradient-to-br',
        meta.gradient,
        'backdrop-blur-xl',
        className
      )}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl" />

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Destination Title */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl" role="img" aria-label="destination">
            {meta.emoji}
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {destination}
            </h1>
            <p className="text-sm text-muted-foreground italic mt-0.5">
              {meta.tagline}
            </p>
          </div>
        </div>

        {/* Quick Facts Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Weather */}
          {meta.weather && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/30"
            >
              <Cloud className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Weather</div>
                <div className="text-sm font-medium text-foreground truncate">
                  {meta.weather}
                </div>
              </div>
            </motion.div>
          )}

          {/* Timezone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/30"
          >
            <Clock className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Timezone</div>
              <div className="text-sm font-medium text-foreground truncate">
                {meta.timezone}
              </div>
            </div>
          </motion.div>

          {/* Currency */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/30"
          >
            <Banknote className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Currency</div>
              <div className="text-sm font-medium text-foreground truncate">
                {meta.currency}
              </div>
            </div>
          </motion.div>

          {/* Trip Dates */}
          {tripDates?.start && tripDates?.end && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/30"
            >
              <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Trip Dates</div>
                <div className="text-sm font-medium text-foreground truncate">
                  {new Date(tripDates.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(tripDates.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
