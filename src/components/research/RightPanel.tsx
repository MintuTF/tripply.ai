'use client';

import { useState, useEffect } from 'react';
import { X, Star, MapPin, Clock, ExternalLink, ChevronDown, Loader2, Check, AlertTriangle, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Trip, PlaceCard } from '@/types';

type RightPanelMode = 'destination' | 'item';

interface RightPanelProps {
  mode: RightPanelMode;
  trip: Trip;
  selectedCard?: PlaceCard | null;
  className?: string;
  asBottomSheet?: boolean;
  onClose?: () => void;
}

interface InsightSection {
  title: string;
  icon: React.ReactNode;
  items: string[];
  color: string;
}

function InsightBullet({ text, delay }: { text: string; delay: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-start gap-2 text-sm text-muted-foreground"
    >
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
      <span>{text}</span>
    </motion.li>
  );
}

function InsightSectionCard({ section, isExpanded, onToggle }: {
  section: InsightSection;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors"
      >
        <div className={cn('p-2 rounded-lg', section.color)}>
          {section.icon}
        </div>
        <span className="flex-1 text-left font-medium text-sm">{section.title}</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="px-4 pb-4 space-y-2">
              {section.items.map((item, idx) => (
                <InsightBullet key={idx} text={item} delay={idx * 0.1} />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DestinationMode({ trip }: { trip: Trip }) {
  const [expandedSection, setExpandedSection] = useState<string | null>('things-to-do');
  const [isLoading, setIsLoading] = useState(true);
  const destination = trip.destination?.name || 'your destination';

  // Simulated insights - in production these would stream from API
  const sections: InsightSection[] = [
    {
      title: "Things To Do",
      icon: <Sparkles className="h-4 w-4 text-violet-600" />,
      color: "bg-violet-100 dark:bg-violet-900/30",
      items: [
        `Visit the historic old town and wander through cobblestone streets`,
        `Try the local street food at the central market`,
        `Take a sunset boat tour along the waterfront`,
        `Explore the art district and visit local galleries`,
      ],
    },
    {
      title: "Things To Avoid",
      icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
      color: "bg-amber-100 dark:bg-amber-900/30",
      items: [
        `Avoid tourist trap restaurants near major attractions`,
        `Don't exchange currency at airport kiosks`,
        `Skip the overpriced city bus tours`,
        `Avoid walking alone in dimly lit areas at night`,
      ],
    },
    {
      title: "Don't Miss",
      icon: <Heart className="h-4 w-4 text-rose-600" />,
      color: "bg-rose-100 dark:bg-rose-900/30",
      items: [
        `The sunrise view from the hilltop temple`,
        `Authentic local breakfast at family-run cafes`,
        `The hidden garden behind the main cathedral`,
        `Live music at the jazz clubs on weekends`,
      ],
    },
  ];

  useEffect(() => {
    // Simulate loading insights
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center pb-4 border-b border-border/50">
        <h2 className="text-lg font-bold">{destination}</h2>
        <p className="text-sm text-muted-foreground mt-1">Know Before You Go</p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">Loading insights...</p>
        </div>
      ) : (
        /* Insight Sections */
        <div className="space-y-3">
          {sections.map((section) => (
            <InsightSectionCard
              key={section.title}
              section={section}
              isExpanded={expandedSection === section.title.toLowerCase().replace(/\s+/g, '-')}
              onToggle={() => setExpandedSection(
                expandedSection === section.title.toLowerCase().replace(/\s+/g, '-')
                  ? null
                  : section.title.toLowerCase().replace(/\s+/g, '-')
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemMode({ card, onClose }: { card: PlaceCard; onClose?: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const priceLabel = card.price_level ? '$'.repeat(card.price_level) : null;

  // Simulated place insights
  const tips = [
    "Best time to visit is early morning to avoid crowds",
    "Ask for the daily special - it's usually not on the menu",
    "The rooftop has amazing views but gets busy after 5pm",
  ];

  const relatedPlaces = [
    { name: "Similar spot nearby", rating: 4.5 },
    { name: "Local favorite alternative", rating: 4.7 },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [card.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Hero Image */}
      {card.photos?.[0] && (
        <div className="relative h-48 flex-shrink-0">
          <img
            src={card.photos[0]}
            alt={card.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Close button for bottom sheet */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Info overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-xl font-bold text-white mb-1">{card.name}</h2>
            <div className="flex items-center gap-3 text-white/90 text-sm">
              {card.rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {card.rating.toFixed(1)}
                </span>
              )}
              {priceLabel && <span>{priceLabel}</span>}
              {card.type && (
                <span className="capitalize">{card.type}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Address */}
        {card.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{card.address}</span>
          </div>
        )}

        {/* Opening Hours */}
        {card.opening_hours && (
          <div className="flex items-start gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{card.opening_hours}</span>
          </div>
        )}

        {/* Description */}
        {card.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {card.description}
          </p>
        )}

        {/* Divider */}
        <hr className="border-border/50" />

        {/* Local Tips */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Local Tips
          </h3>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading tips...</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {tips.map((tip, idx) => (
                <InsightBullet key={idx} text={tip} delay={idx * 0.1} />
              ))}
            </ul>
          )}
        </div>

        {/* Related Recommendations */}
        <div>
          <h3 className="font-semibold text-sm mb-3">You Might Also Like</h3>
          <div className="space-y-2">
            {relatedPlaces.map((place, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium">{place.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {place.rating}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* External Link */}
        {card.url && (
          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View on Google Maps
          </a>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 p-4 border-t border-border/50 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:shadow-glow transition-all"
        >
          Add to Trip
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="py-3 px-4 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Heart className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}

export function RightPanel({
  mode,
  trip,
  selectedCard,
  className,
  asBottomSheet,
  onClose,
}: RightPanelProps) {
  // Bottom sheet variant
  if (asBottomSheet) {
    return (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {mode === 'item' && selectedCard ? (
          <ItemMode card={selectedCard} onClose={onClose} />
        ) : (
          <div className="overflow-y-auto">
            <DestinationMode trip={trip} />
          </div>
        )}
      </motion.div>
    );
  }

  // Desktop sidebar variant
  return (
    <aside className={cn(
      'w-[380px] flex-shrink-0 bg-card border-l border-border/50 flex flex-col overflow-hidden',
      className
    )}>
      {mode === 'item' && selectedCard ? (
        <ItemMode card={selectedCard} />
      ) : (
        <div className="overflow-y-auto">
          <DestinationMode trip={trip} />
        </div>
      )}
    </aside>
  );
}
