'use client';

import { X, Star, MapPin, Check, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResearch } from './ResearchContext';
import { cn } from '@/lib/utils';
import type { PlaceCard } from '@/types';

interface SavedItemsDrawerProps {
  onClose: () => void;
  asBottomSheet?: boolean;
}

function SavedCard({
  card,
  status,
  onConfirm,
  onRemove,
  onSelect,
}: {
  card: PlaceCard;
  status: 'shortlist' | 'confirmed';
  onConfirm?: () => void;
  onRemove: () => void;
  onSelect: () => void;
}) {
  const priceLabel = card.price_level ? '$'.repeat(card.price_level) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="group flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:shadow-md transition-all cursor-pointer"
      onClick={onSelect}
    >
      {/* Image */}
      {card.photos?.[0] && (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={card.photos[0]}
            alt={card.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm truncate">{card.name}</h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {card.rating && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {card.rating.toFixed(1)}
            </span>
          )}
          {priceLabel && <span>{priceLabel}</span>}
          {card.type && <span className="capitalize">{card.type}</span>}
        </div>
        {card.address && (
          <p className="flex items-center gap-1 mt-1 text-xs text-muted-foreground truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{card.address}</span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {status === 'shortlist' && onConfirm && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
          >
            <Check className="h-4 w-4" />
          </motion.button>
        )}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function DrawerContent({ onClose }: { onClose: () => void }) {
  const {
    shortlistCards,
    confirmedCards,
    confirmCard,
    removeFromBoard,
    setSelectedPlace,
    openDetailPanel,
  } = useResearch();

  const handleSelectCard = (card: PlaceCard) => {
    setSelectedPlace(card.id);
    openDetailPanel(card);
    onClose();
  };

  const isEmpty = shortlistCards.length === 0 && confirmedCards.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h2 className="font-semibold">Saved Places</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8" />
            </div>
            <p className="font-medium">No saved places yet</p>
            <p className="text-sm mt-1">
              Save places from suggestions to build your trip
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Considering Section */}
            {shortlistCards.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <h3 className="font-medium text-sm">Considering</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
                    {shortlistCards.length}
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {shortlistCards.map((card) => (
                      <SavedCard
                        key={card.id}
                        card={card}
                        status="shortlist"
                        onConfirm={() => confirmCard(card)}
                        onRemove={() => removeFromBoard(card.id)}
                        onSelect={() => handleSelectCard(card)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Confirmed Section */}
            {confirmedCards.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <h3 className="font-medium text-sm">Confirmed</h3>
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                    {confirmedCards.length}
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {confirmedCards.map((card) => (
                      <SavedCard
                        key={card.id}
                        card={card}
                        status="confirmed"
                        onRemove={() => removeFromBoard(card.id)}
                        onSelect={() => handleSelectCard(card)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SavedItemsDrawer({ onClose, asBottomSheet }: SavedItemsDrawerProps) {
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
        <DrawerContent onClose={onClose} />
      </motion.div>
    );
  }

  // Desktop drawer variant
  return (
    <motion.div
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed left-[60px] top-0 bottom-0 w-[350px] z-50 bg-card border-r border-border/50 shadow-2xl"
    >
      <DrawerContent onClose={onClose} />
    </motion.div>
  );
}
