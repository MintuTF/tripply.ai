'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Clock, Star, MapPin, X, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResearch } from './ResearchContext';
import { cn } from '@/lib/utils';
import type { PlaceCard } from '@/types';

function TripBoardCard({ card, onConfirm, onRemove, showConfirm }: {
  card: PlaceCard;
  onConfirm?: () => void;
  onRemove: () => void;
  showConfirm: boolean;
}) {
  const priceLabel = card.price_level ? '$'.repeat(card.price_level) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-all hover-lift"
    >
      {/* Image with gradient overlay */}
      {card.photos?.[0] && (
        <div className="relative h-32 bg-muted overflow-hidden">
          <img
            src={card.photos[0]}
            alt={card.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Floating badges */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            {card.rating && (
              <div className="flex items-center gap-1 px-2 py-0.5 glassmorphism rounded-full text-white text-xs font-medium">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{card.rating.toFixed(1)}</span>
              </div>
            )}
            {priceLabel && (
              <div className="px-2 py-0.5 glassmorphism rounded-full text-white text-xs font-medium">
                {priceLabel}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-3">
        <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
          {card.name}
        </h4>

        {card.address && (
          <p className="flex items-center gap-1 mt-1 text-xs text-muted-foreground truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{card.address}</span>
          </p>
        )}

        <div className="flex gap-2 mt-3">
          {showConfirm && onConfirm && (
            <motion.button
              onClick={onConfirm}
              whileTap={{ scale: 0.95 }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold
                         bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg
                         shadow-sm hover:shadow-md transition-all"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Confirm
            </motion.button>
          )}
          <motion.button
            onClick={onRemove}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition-all",
              "border border-destructive/30 text-destructive hover:bg-destructive/10",
              !showConfirm && "flex-1"
            )}
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function InlineTripBoard() {
  const { shortlistCards, confirmedCards, confirmCard, removeFromBoard } = useResearch();
  const [shortlistOpen, setShortlistOpen] = useState(true);
  const [confirmedOpen, setConfirmedOpen] = useState(true);

  if (shortlistCards.length === 0 && confirmedCards.length === 0) {
    return null;
  }

  return (
    <section className="py-8 border-t border-border/50">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Your Trip Board</h3>
          <p className="text-sm text-muted-foreground">
            {shortlistCards.length + confirmedCards.length} places saved
          </p>
        </div>
      </div>

      {/* Considering Section */}
      {shortlistCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => setShortlistOpen(!shortlistOpen)}
            className="flex items-center gap-3 w-full py-3 px-4 hover:bg-accent/30 rounded-xl transition-colors"
          >
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-semibold">Considering</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
                {shortlistCards.length}
              </span>
            </div>
            <motion.div
              animate={{ rotate: shortlistOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {shortlistOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4 px-1">
                  {shortlistCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TripBoardCard
                        card={card}
                        onConfirm={() => confirmCard(card)}
                        onRemove={() => removeFromBoard(card.id)}
                        showConfirm={true}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Confirmed Section */}
      {confirmedCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => setConfirmedOpen(!confirmedOpen)}
            className="flex items-center gap-3 w-full py-3 px-4 hover:bg-accent/30 rounded-xl transition-colors"
          >
            <div className="p-1.5 rounded-lg bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-semibold">Confirmed</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                {confirmedCards.length}
              </span>
            </div>
            <motion.div
              animate={{ rotate: confirmedOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {confirmedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4 px-1">
                  {confirmedCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TripBoardCard
                        card={card}
                        onRemove={() => removeFromBoard(card.id)}
                        showConfirm={false}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
