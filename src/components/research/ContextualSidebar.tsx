'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Globe,
  DollarSign,
  Clock,
  MapPin,
  X,
  ChevronRight,
  Star,
  ExternalLink,
  Bookmark,
  Navigation,
  Languages,
  Wifi,
  CreditCard,
} from 'lucide-react';
import { useDestinationTheme } from './DestinationThemeProvider';
import { cn } from '@/lib/utils';
import type { PlaceCard } from '@/types';

type SidebarMode = 'overview' | 'place' | 'context';

interface ContextualSidebarProps {
  destination: string;
  selectedPlace?: PlaceCard | null;
  onClose?: () => void;
  className?: string;
}

// Destination info database
const DESTINATION_INFO: Record<string, {
  quickInfo: { timezone: string; currency: string; language: string; plugType: string };
  tips: string[];
}> = {
  'las vegas': {
    quickInfo: { timezone: 'PST (UTC-8)', currency: 'USD ($)', language: 'English', plugType: 'Type A/B' },
    tips: ['Tip 15-20% at restaurants and bars', 'Stay hydrated in the desert heat', 'Free parking at most off-strip casinos', 'Shows often have discount day-of tickets'],
  },
  'tokyo': {
    quickInfo: { timezone: 'JST (UTC+9)', currency: 'JPY (¥)', language: 'Japanese', plugType: 'Type A/B' },
    tips: ['Most restaurants don\'t accept tips', 'Carry cash - many places don\'t take cards', 'Bow when greeting people', 'Remove shoes before entering homes'],
  },
  'paris': {
    quickInfo: { timezone: 'CET (UTC+1)', currency: 'EUR (€)', language: 'French', plugType: 'Type C/E' },
    tips: ['Greet with "Bonjour" when entering shops', 'Metro is the fastest way to get around', 'Many places close on Sundays', 'Tipping is included but extra appreciated'],
  },
  'london': {
    quickInfo: { timezone: 'GMT (UTC+0)', currency: 'GBP (£)', language: 'English', plugType: 'Type G' },
    tips: ['Stand on the right on escalators', 'Contactless payment is everywhere', 'Many museums are free', 'Pub etiquette: order at the bar'],
  },
  'new york': {
    quickInfo: { timezone: 'EST (UTC-5)', currency: 'USD ($)', language: 'English', plugType: 'Type A/B' },
    tips: ['Tip 18-20% at restaurants', 'Subway runs 24/7', 'Walk fast or move aside', 'Street food is surprisingly good'],
  },
  'bali': {
    quickInfo: { timezone: 'WITA (UTC+8)', currency: 'IDR (Rp)', language: 'Indonesian', plugType: 'Type C/F' },
    tips: ['Negotiate prices at markets', 'Respect temple dress codes', 'Avoid tap water', 'Traffic can be intense - allow extra time'],
  },
  'dubai': {
    quickInfo: { timezone: 'GST (UTC+4)', currency: 'AED (د.إ)', language: 'Arabic/English', plugType: 'Type G' },
    tips: ['Dress modestly in public areas', 'Metro is clean and efficient', 'Alcohol only in licensed venues', 'Ramadan hours vary significantly'],
  },
  'barcelona': {
    quickInfo: { timezone: 'CET (UTC+1)', currency: 'EUR (€)', language: 'Spanish/Catalan', plugType: 'Type C/F' },
    tips: ['Watch for pickpockets on Las Ramblas', 'Lunch is 2-4pm, dinner after 9pm', 'Book Sagrada Familia in advance', 'Siesta time is real - shops may close'],
  },
  'default': {
    quickInfo: { timezone: 'Local time', currency: 'Local currency', language: 'Local language', plugType: 'Check before travel' },
    tips: ['Research local customs before visiting', 'Keep copies of important documents', 'Stay aware of your surroundings', 'Learn basic local phrases'],
  },
};

// Get destination info with fallback
const getDestinationInfo = (destination: string) => {
  const normalized = destination.toLowerCase().trim();

  // Try to find matching destination
  for (const [key, info] of Object.entries(DESTINATION_INFO)) {
    if (key === 'default') continue;
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        weather: {
          current: 22,
          condition: 'sunny',
          forecast: [
            { day: 'Mon', high: 24, low: 18, condition: 'sunny' },
            { day: 'Tue', high: 23, low: 17, condition: 'cloudy' },
            { day: 'Wed', high: 20, low: 15, condition: 'rainy' },
          ],
        },
        quickInfo: info.quickInfo,
        tips: info.tips,
      };
    }
  }

  // Default fallback
  return {
    weather: {
      current: 22,
      condition: 'sunny',
      forecast: [
        { day: 'Mon', high: 24, low: 18, condition: 'sunny' },
        { day: 'Tue', high: 23, low: 17, condition: 'cloudy' },
        { day: 'Wed', high: 20, low: 15, condition: 'rainy' },
      ],
    },
    quickInfo: DESTINATION_INFO['default'].quickInfo,
    tips: DESTINATION_INFO['default'].tips,
  };
};

const WeatherIcon = ({ condition }: { condition: string }) => {
  switch (condition) {
    case 'sunny':
      return <Sun className="h-5 w-5 text-amber-500" />;
    case 'cloudy':
      return <Cloud className="h-5 w-5 text-gray-400" />;
    case 'rainy':
      return <CloudRain className="h-5 w-5 text-blue-400" />;
    default:
      return <Sun className="h-5 w-5 text-amber-500" />;
  }
};

export function ContextualSidebar({
  destination,
  selectedPlace,
  onClose,
  className,
}: ContextualSidebarProps) {
  const { theme } = useDestinationTheme();
  const [mode, setMode] = useState<SidebarMode>(
    selectedPlace ? 'place' : 'overview'
  );

  const destInfo = getDestinationInfo(destination);

  // Switch mode when place selection changes
  if (selectedPlace && mode !== 'place') {
    setMode('place');
  }

  return (
    <div
      className={cn(
        'w-80 bg-card rounded-2xl border border-border/50 overflow-hidden',
        'shadow-lg',
        className
      )}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-border/50 flex items-center justify-between"
        style={{ backgroundColor: `${theme.primary}08` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.primary }}
          />
          <span className="text-sm font-medium text-foreground">
            {mode === 'place' ? 'Place Details' : 'Destination Guide'}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="h-[calc(100%-52px)] overflow-y-auto">
        <AnimatePresence mode="wait">
          {mode === 'overview' && (
            <OverviewContent
              key="overview"
              destination={destination}
              destInfo={destInfo}
              theme={theme}
            />
          )}
          {mode === 'place' && selectedPlace && (
            <PlaceContent
              key="place"
              place={selectedPlace}
              theme={theme}
              onBack={() => setMode('overview')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Overview Mode Content
function OverviewContent({
  destination,
  destInfo,
  theme,
}: {
  destination: string;
  destInfo: ReturnType<typeof getDestinationInfo>;
  theme: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="p-4 space-y-5"
    >
      {/* Weather Section */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Weather
        </h3>
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <WeatherIcon condition={destInfo.weather.condition} />
              <div>
                <div className="text-2xl font-semibold">
                  {destInfo.weather.current}°C
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {destInfo.weather.condition}
                </div>
              </div>
            </div>
            <Thermometer className="h-8 w-8 text-muted-foreground/30" />
          </div>

          {/* 3-day forecast */}
          <div className="flex gap-2">
            {destInfo.weather.forecast.map((day) => (
              <div
                key={day.day}
                className="flex-1 text-center p-2 rounded-lg bg-background/50"
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {day.day}
                </div>
                <WeatherIcon condition={day.condition} />
                <div className="text-xs mt-1">
                  <span className="font-medium">{day.high}°</span>
                  <span className="text-muted-foreground">/{day.low}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Info
        </h3>
        <div className="space-y-2">
          {[
            { icon: Clock, label: 'Timezone', value: destInfo.quickInfo.timezone },
            { icon: DollarSign, label: 'Currency', value: destInfo.quickInfo.currency },
            { icon: Languages, label: 'Language', value: destInfo.quickInfo.language },
            { icon: Wifi, label: 'Plug Type', value: destInfo.quickInfo.plugType },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <item.icon
                className="h-4 w-4"
                style={{ color: theme.primary }}
              />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="text-sm font-medium">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Good to Know */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Good to Know
        </h3>
        <div className="space-y-2">
          {destInfo.tips.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg bg-muted/30"
            >
              <ChevronRight
                className="h-4 w-4 mt-0.5 flex-shrink-0"
                style={{ color: theme.primary }}
              />
              <span className="text-sm text-foreground/80">{tip}</span>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

// Place Details Mode Content
function PlaceContent({
  place,
  theme,
  onBack,
}: {
  place: PlaceCard;
  theme: any;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image */}
      {place.photos?.[0] && (
        <div className="relative h-48">
          <img
            src={place.photos[0]}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-3 left-3 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>

          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-lg font-bold text-white">{place.name}</h2>
            {place.address && (
              <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {place.address}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Rating & Price */}
        <div className="flex items-center gap-4">
          {place.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{place.rating.toFixed(1)}</span>
              {place.review_count && (
                <span className="text-sm text-muted-foreground">
                  ({place.review_count} reviews)
                </span>
              )}
            </div>
          )}
          {place.price_level && (
            <span className="text-green-600 font-medium">
              {'$'.repeat(place.price_level)}
            </span>
          )}
        </div>

        {/* Why suggested */}
        {place.description && (
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${theme.primary}10` }}
          >
            <p className="text-sm text-foreground/80">{place.description}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className="flex items-center justify-center gap-2 p-3 rounded-xl text-white font-medium transition-colors"
            style={{ backgroundColor: theme.primary }}
          >
            <Bookmark className="h-4 w-4" />
            Save
          </button>
          <button
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
          >
            <Navigation className="h-4 w-4" />
            Directions
          </button>
        </div>

        {/* Website link */}
        {place.url && (
          <a
            href={place.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Website
          </a>
        )}

        {/* Opening hours */}
        {place.opening_hours && (
          <div className="pt-3 border-t border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Opening Hours
            </h4>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-green-600 font-medium">Open now</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
