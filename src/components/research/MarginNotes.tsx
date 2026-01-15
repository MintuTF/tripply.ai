'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, ExternalLink } from 'lucide-react';
import { useResearch } from './ResearchContext';
import { cn } from '@/lib/utils';
import type { Trip, PlaceCard } from '@/types';

interface MarginNotesProps {
  trip: Trip;
  selectedCard: PlaceCard | null;
}

function NoteSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function TipItem({ text, index }: { text: string; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3, ease: 'easeOut' }}
      className="text-sm text-foreground/80 leading-relaxed"
    >
      {text}
    </motion.li>
  );
}

// Destination mode content
function DestinationNotes({ trip }: { trip: Trip }) {
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulated tips for now - would come from API
  useEffect(() => {
    const destinationTips = [
      'Book restaurants at least 2 weeks in advance',
      'Many museums are free on the first Sunday of each month',
      'The metro is the fastest way to get around',
      'Tipping is not expected but appreciated',
      'Shops often close between 1-3pm',
    ];

    // Simulate loading
    const timer = setTimeout(() => {
      setTips(destinationTips);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [trip.destination?.name]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-3 bg-black/[0.03] rounded w-3/4" />
        <div className="h-3 bg-black/[0.03] rounded w-1/2" />
        <div className="h-3 bg-black/[0.03] rounded w-2/3" />
      </div>
    );
  }

  return (
    <NoteSection title="Things to Know">
      <ul className="space-y-3">
        {tips.map((tip, i) => (
          <TipItem key={i} text={tip} index={i} />
        ))}
      </ul>
    </NoteSection>
  );
}

// Item mode content - when a place is selected
function ItemNotes({ card }: { card: PlaceCard }) {
  const priceLabel = card.price_level ? '$'.repeat(card.price_level) : null;

  return (
    <div className="space-y-4">
      {/* Place image */}
      {card.photos?.[0] && (
        <div className="aspect-[16/10] rounded-lg overflow-hidden">
          <img
            src={card.photos[0]}
            alt={card.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Place name and meta */}
      <div>
        <h3 className="font-semibold text-foreground">{card.name}</h3>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          {card.rating && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {card.rating.toFixed(1)}
            </span>
          )}
          {priceLabel && <span>{priceLabel}</span>}
          {card.type && <span className="capitalize">{card.type}</span>}
        </div>
      </div>

      {/* Address */}
      {card.address && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{card.address}</span>
        </div>
      )}

      {/* Opening hours */}
      {card.opening_hours && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{card.opening_hours}</span>
        </div>
      )}

      {/* Description */}
      {card.description && (
        <p className="text-sm text-foreground/80 leading-relaxed">
          {card.description}
        </p>
      )}

      {/* Link */}
      {card.url && (
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View details
        </a>
      )}
    </div>
  );
}

export function MarginNotes({ trip, selectedCard }: MarginNotesProps) {
  return (
    <aside className="hidden lg:block fixed right-8 top-24 w-72 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {selectedCard ? (
          <ItemNotes card={selectedCard} />
        ) : (
          <DestinationNotes trip={trip} />
        )}
      </motion.div>
    </aside>
  );
}
