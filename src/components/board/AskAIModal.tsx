'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Loader2, MapPin, Star, Hotel, Utensils, Map, MessageSquare, Check, Trash2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaceCard, Card } from '@/types';
import { useAskAI, placeCardToBoardCard } from './useAskAI';

interface AskAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  destination?: string;
  dates?: { start: string; end: string };
  budget?: number;
  onAddCards: (cards: Omit<Card, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  existingCards?: Card[];
}

/**
 * Map PlaceCard type to Card type for duplicate detection
 */
function mapPlaceCardTypeToCardType(placeType: PlaceCard['type']): Card['type'] {
  switch (placeType) {
    case 'hotel':
      return 'hotel';
    case 'restaurant':
      return 'food';
    case 'location':
    case 'activity':
    default:
      return 'spot';
  }
}

const categoryIcons: Record<string, React.ReactNode> = {
  hotel: <Hotel className="h-4 w-4" />,
  restaurant: <Utensils className="h-4 w-4" />,
  location: <Map className="h-4 w-4" />,
  activity: <MapPin className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  hotel: 'Hotels',
  restaurant: 'Restaurants',
  location: 'Things to Do',
  activity: 'Activities',
};

export function AskAIModal({
  isOpen,
  onClose,
  tripId,
  destination,
  dates,
  budget,
  onAddCards,
  existingCards = []
}: AskAIModalProps) {
  const [query, setQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [removedCardIds, setRemovedCardIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Loading steps configuration
  const loadingSteps = [
    { label: 'Analyzing your request', duration: 2000 },
    { label: 'Finding places', duration: 3000 },
    { label: 'Getting details & photos', duration: 4000 },
    { label: 'Preparing recommendations', duration: 5000 },
  ];

  const { isLoading, streamingCards, planText, error, askAI, clearResults } = useAskAI({
    tripId,
    destination,
    dates,
    budget,
  });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Clear results when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      clearResults();
      setLoadingStep(0);
      setRemovedCardIds(new Set());
    }
  }, [isOpen, clearResults]);

  // Filter out removed cards
  const visibleCards = streamingCards.filter(card => !removedCardIds.has(card.id));

  // Handle removing a card from the list
  const handleRemoveCard = (cardId: string) => {
    setRemovedCardIds(prev => new Set([...prev, cardId]));
  };

  // Animate through loading steps
  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }

    // Progress through steps while loading
    const intervals: NodeJS.Timeout[] = [];
    let cumulativeTime = 0;

    loadingSteps.forEach((step, index) => {
      if (index === 0) return; // First step is immediate
      cumulativeTime += loadingSteps[index - 1].duration;
      const timeout = setTimeout(() => {
        setLoadingStep(index);
      }, cumulativeTime);
      intervals.push(timeout);
    });

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;
    await askAI(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAddAll = async () => {
    if (visibleCards.length === 0 || isAdding) return;

    setIsAdding(true);
    try {
      // Filter out duplicates - cards with same name and type that already exist
      const newCards = visibleCards.filter(aiCard => {
        const cardType = mapPlaceCardTypeToCardType(aiCard.type);
        return !existingCards.some(existing => {
          const existingName = (existing.payload_json as { name?: string })?.name;
          return existingName?.toLowerCase() === aiCard.name.toLowerCase() &&
                 existing.type === cardType;
        });
      });

      if (newCards.length === 0) {
        // All cards already exist
        onClose();
        return;
      }

      const boardCards = newCards.map(pc => placeCardToBoardCard(pc, tripId));
      await onAddCards(boardCards);
      onClose();
    } catch (err) {
      console.error('Failed to add cards:', err);
    } finally {
      setIsAdding(false);
    }
  };

  // Group visible cards by type
  const groupedCards = visibleCards.reduce((acc, card) => {
    const type = card.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(card);
    return acc;
  }, {} as Record<string, PlaceCard[]>);

  const sampleQueries = [
    'Hotels with pools in Las Vegas',
    'Best sushi restaurants in Tokyo',
    'Things to do in Barcelona',
    'Family-friendly activities in Orlando',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[85vh] bg-card rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Ask AI for Recommendations</h2>
                  <p className="text-sm text-muted-foreground">Find hotels, restaurants, and activities</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Input Section */}
              <form onSubmit={handleSubmit} className="mb-6">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What are you looking for? e.g., Hotels in Las Vegas with a pool"
                    className={cn(
                      'w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background',
                      'resize-none min-h-[80px] max-h-[120px]',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                      'placeholder:text-muted-foreground'
                    )}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className={cn(
                      'absolute right-3 bottom-3 p-2 rounded-lg',
                      'gradient-primary text-white',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'hover:shadow-lg transition-all'
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </form>

              {/* Sample Queries - show when no results */}
              {streamingCards.length === 0 && !isLoading && !error && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {sampleQueries.map((sample) => (
                      <button
                        key={sample}
                        onClick={() => {
                          setQuery(sample);
                          inputRef.current?.focus();
                        }}
                        className="px-3 py-1.5 text-sm rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State with Steps */}
              {isLoading && streamingCards.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  {/* Spinner */}
                  <div className="relative mb-6">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>

                  {/* Steps indicator */}
                  <div className="w-full max-w-xs space-y-3">
                    {loadingSteps.map((step, index) => {
                      const isCompleted = index < loadingStep;
                      const isCurrent = index === loadingStep;

                      return (
                        <motion.div
                          key={step.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300',
                            isCurrent && 'bg-primary/10',
                            isCompleted && 'opacity-60'
                          )}
                        >
                          {/* Step indicator */}
                          <div
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300',
                              isCompleted && 'bg-primary text-white',
                              isCurrent && 'bg-primary/20 text-primary',
                              !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                            )}
                          >
                            {isCompleted ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : isCurrent ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <span className="text-xs font-medium">{index + 1}</span>
                            )}
                          </div>

                          {/* Step label */}
                          <span
                            className={cn(
                              'text-sm transition-all duration-300',
                              isCurrent && 'font-medium text-primary',
                              isCompleted && 'text-muted-foreground line-through',
                              !isCompleted && !isCurrent && 'text-muted-foreground'
                            )}
                          >
                            {step.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              {/* Results */}
              {streamingCards.length > 0 && (
                <div className="space-y-6">
                  {/* AI's Plan Text / Summary */}
                  {planText && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-primary mb-1">AI Recommendation</h4>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{planText}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">
                      Found {visibleCards.length} recommendations
                      {removedCardIds.size > 0 && (
                        <span className="text-muted-foreground font-normal"> ({removedCardIds.size} removed)</span>
                      )}
                    </h3>
                    {isLoading && (
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading more...
                      </span>
                    )}
                  </div>

                  {/* Grouped Results */}
                  {Object.entries(groupedCards).map(([type, cards]) => (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-primary">{categoryIcons[type]}</span>
                        <h4 className="font-medium text-sm">
                          {categoryLabels[type] || type} ({cards.length})
                        </h4>
                      </div>
                      <div className="grid gap-3">
                        {cards.map((card) => (
                          <PlaceCardPreview
                            key={card.id}
                            card={card}
                            onRemove={() => handleRemoveCard(card.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Add All Button */}
            {visibleCards.length > 0 && (
              <div className="px-6 py-4 border-t border-border bg-accent/30">
                <button
                  onClick={handleAddAll}
                  disabled={isAdding || isLoading}
                  className={cn(
                    'w-full py-3 px-4 rounded-xl font-medium',
                    'gradient-primary text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'hover:shadow-lg transition-all',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Adding to Considering...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Add {visibleCards.length === 1 ? '' : 'All '}{visibleCards.length} to Considering
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Preview card component for results with expandable details
 */
function PlaceCardPreview({ card, onRemove }: { card: PlaceCard; onRemove: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border border-border bg-background hover:border-primary/30 transition-colors group relative cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 border border-border opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all z-10"
        title="Remove from list"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Collapsed View - Preview */}
      <div className="flex gap-3 p-3">
        {/* Image */}
        {card.photos && card.photos.length > 0 ? (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-accent">
            <img
              src={card.photos[0]}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-accent flex items-center justify-center">
            {categoryIcons[card.type] || <MapPin className="h-6 w-6 text-muted-foreground" />}
          </div>
        )}

        {/* Basic Info */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2">
            <h5 className="font-medium text-sm truncate">{card.name}</h5>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          {card.address && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {card.address}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {card.rating && (
              <span className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {card.rating.toFixed(1)}
              </span>
            )}
            {card.price_level && (
              <span className="text-xs text-muted-foreground">
                {'$'.repeat(card.price_level)}
              </span>
            )}
            {card.cuisine_type && (
              <span className="text-xs text-muted-foreground">
                {card.cuisine_type}
              </span>
            )}
          </div>
          {!isExpanded && card.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {card.description}
            </p>
          )}
        </div>
      </div>

      {/* Expanded View - Full Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 border-t border-border/50 mt-1">
              {/* Photo Gallery (if multiple photos) */}
              {card.photos && card.photos.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {card.photos.slice(0, 5).map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`${card.name} ${idx + 1}`}
                      className="w-24 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ))}
                </div>
              )}

              {/* Full Description */}
              {card.description && (
                <div className="mt-3">
                  <h6 className="text-xs font-medium text-muted-foreground mb-1">Description</h6>
                  <p className="text-sm text-foreground/80">{card.description}</p>
                </div>
              )}

              {/* Opening Hours */}
              {card.opening_hours && (
                <div className="mt-3">
                  <h6 className="text-xs font-medium text-muted-foreground mb-1">Hours</h6>
                  <p className="text-xs text-foreground/70">{card.opening_hours}</p>
                </div>
              )}

              {/* URL Link */}
              {card.url && (
                <div className="mt-3">
                  <a
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on Google Maps
                  </a>
                </div>
              )}

              {/* Duration for activities */}
              {card.type === 'activity' && card.duration && (
                <div className="mt-3">
                  <h6 className="text-xs font-medium text-muted-foreground mb-1">Duration</h6>
                  <p className="text-xs text-foreground/70">{card.duration}</p>
                </div>
              )}

              {/* Price info for hotels */}
              {card.type === 'hotel' && card.price_range && (
                <div className="mt-3">
                  <h6 className="text-xs font-medium text-muted-foreground mb-1">Price Range</h6>
                  <p className="text-xs text-foreground/70">${card.price_range[0]} - ${card.price_range[1]} per night</p>
                </div>
              )}

              {/* Amenities for Hotels */}
              {card.type === 'hotel' && card.amenities && card.amenities.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-xs font-medium text-muted-foreground mb-1">Amenities</h6>
                  <div className="flex flex-wrap gap-1">
                    {card.amenities.slice(0, 8).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-accent rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                    {card.amenities.length > 8 && (
                      <span className="text-xs text-muted-foreground">+{card.amenities.length - 8} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
