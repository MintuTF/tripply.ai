'use client';

import { useState } from 'react';
import { CardType } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardLabelsProps {
  cardType: CardType;
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
}

// Label presets by card type
export const LABEL_PRESETS: Record<CardType, { category: string; labels: { id: string; label: string; color: string }[] }[]> = {
  food: [
    {
      category: 'Meal Type',
      labels: [
        { id: 'breakfast', label: 'Breakfast', color: 'bg-amber-500' },
        { id: 'brunch', label: 'Brunch', color: 'bg-orange-400' },
        { id: 'lunch', label: 'Lunch', color: 'bg-yellow-500' },
        { id: 'dinner', label: 'Dinner', color: 'bg-purple-500' },
        { id: 'late-night', label: 'Late Night', color: 'bg-indigo-500' },
      ],
    },
    {
      category: 'Style',
      labels: [
        { id: 'fine-dining', label: 'Fine Dining', color: 'bg-rose-500' },
        { id: 'casual', label: 'Casual', color: 'bg-teal-500' },
        { id: 'cafe', label: 'Cafe', color: 'bg-amber-600' },
        { id: 'street-food', label: 'Street Food', color: 'bg-orange-500' },
        { id: 'fast-food', label: 'Fast Food', color: 'bg-red-500' },
      ],
    },
    {
      category: 'Special',
      labels: [
        { id: 'must-try', label: 'Must Try', color: 'bg-pink-500' },
        { id: 'local-favorite', label: 'Local Favorite', color: 'bg-emerald-500' },
        { id: 'tourist-spot', label: 'Tourist Spot', color: 'bg-blue-500' },
        { id: 'hidden-gem', label: 'Hidden Gem', color: 'bg-violet-500' },
      ],
    },
  ],
  hotel: [
    {
      category: 'Budget',
      labels: [
        { id: 'budget', label: 'Budget', color: 'bg-green-500' },
        { id: 'mid-range', label: 'Mid-Range', color: 'bg-blue-500' },
        { id: 'luxury', label: 'Luxury', color: 'bg-purple-500' },
        { id: 'boutique', label: 'Boutique', color: 'bg-pink-500' },
      ],
    },
    {
      category: 'Vibe',
      labels: [
        { id: 'business', label: 'Business', color: 'bg-slate-500' },
        { id: 'family-friendly', label: 'Family-Friendly', color: 'bg-cyan-500' },
        { id: 'romantic', label: 'Romantic', color: 'bg-rose-500' },
        { id: 'party', label: 'Party', color: 'bg-orange-500' },
      ],
    },
    {
      category: 'Location',
      labels: [
        { id: 'near-airport', label: 'Near Airport', color: 'bg-sky-500' },
        { id: 'city-center', label: 'City Center', color: 'bg-indigo-500' },
        { id: 'beachfront', label: 'Beachfront', color: 'bg-teal-500' },
        { id: 'quiet-area', label: 'Quiet Area', color: 'bg-emerald-500' },
      ],
    },
  ],
  spot: [
    {
      category: 'Time',
      labels: [
        { id: 'morning', label: 'Morning', color: 'bg-amber-400' },
        { id: 'afternoon', label: 'Afternoon', color: 'bg-orange-500' },
        { id: 'evening', label: 'Evening', color: 'bg-purple-500' },
        { id: 'full-day', label: 'Full Day', color: 'bg-blue-500' },
      ],
    },
    {
      category: 'Type',
      labels: [
        { id: 'indoor', label: 'Indoor', color: 'bg-slate-500' },
        { id: 'outdoor', label: 'Outdoor', color: 'bg-green-500' },
        { id: 'weather-dependent', label: 'Weather Dependent', color: 'bg-sky-500' },
      ],
    },
    {
      category: 'Audience',
      labels: [
        { id: 'kid-friendly', label: 'Kid-Friendly', color: 'bg-pink-500' },
        { id: 'adults-only', label: 'Adults Only', color: 'bg-rose-600' },
        { id: 'group-activity', label: 'Group Activity', color: 'bg-violet-500' },
      ],
    },
  ],
  activity: [
    {
      category: 'Time',
      labels: [
        { id: 'morning', label: 'Morning', color: 'bg-amber-400' },
        { id: 'afternoon', label: 'Afternoon', color: 'bg-orange-500' },
        { id: 'evening', label: 'Evening', color: 'bg-purple-500' },
        { id: 'full-day', label: 'Full Day', color: 'bg-blue-500' },
      ],
    },
    {
      category: 'Type',
      labels: [
        { id: 'adventure', label: 'Adventure', color: 'bg-red-500' },
        { id: 'relaxation', label: 'Relaxation', color: 'bg-teal-500' },
        { id: 'cultural', label: 'Cultural', color: 'bg-amber-600' },
        { id: 'nature', label: 'Nature', color: 'bg-green-500' },
      ],
    },
    {
      category: 'Audience',
      labels: [
        { id: 'kid-friendly', label: 'Kid-Friendly', color: 'bg-pink-500' },
        { id: 'adults-only', label: 'Adults Only', color: 'bg-rose-600' },
        { id: 'group-activity', label: 'Group Activity', color: 'bg-violet-500' },
      ],
    },
  ],
  note: [
    {
      category: 'Type',
      labels: [
        { id: 'reminder', label: 'Reminder', color: 'bg-yellow-500' },
        { id: 'tip', label: 'Tip', color: 'bg-green-500' },
        { id: 'warning', label: 'Warning', color: 'bg-red-500' },
        { id: 'idea', label: 'Idea', color: 'bg-purple-500' },
      ],
    },
  ],
};

// Helper function to get label config by ID and card type (exported for use in other components)
export function getLabelConfig(labelId: string, cardType: CardType): { id: string; label: string; color: string } | null {
  const presets = LABEL_PRESETS[cardType] || [];
  for (const category of presets) {
    const label = category.labels.find(l => l.id === labelId);
    if (label) return label;
  }
  return null;
}

export function CardLabels({ cardType, selectedLabels, onLabelsChange }: CardLabelsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const presets = LABEL_PRESETS[cardType] || [];

  // Get all available labels (type-specific only)
  const allLabels = presets.flatMap((p) => p.labels);

  const toggleLabel = (labelId: string) => {
    const isSelected = selectedLabels.includes(labelId);
    if (isSelected) {
      onLabelsChange(selectedLabels.filter((l) => l !== labelId));
    } else {
      onLabelsChange([...selectedLabels, labelId]);
    }
  };

  const getLabelConfig = (labelId: string) => {
    return allLabels.find((l) => l.id === labelId);
  };

  // Filter out status labels (considering, shortlist, booked, dismissed) from display
  const statusLabels = ['considering', 'shortlist', 'confirmed', 'dismissed'];
  const displayLabels = selectedLabels.filter((l) => !statusLabels.includes(l));

  return (
    <div className="space-y-3">
      {/* Selected Labels */}
      <div className="flex flex-wrap gap-2">
        {displayLabels.map((labelId) => {
          const config = getLabelConfig(labelId);
          if (!config) return null;
          return (
            <motion.span
              key={labelId}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white',
                config.color
              )}
            >
              {config.label}
              <button
                onClick={() => toggleLabel(labelId)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          );
        })}

        {/* Add Label Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
            'border-2 border-dashed border-muted-foreground/30 text-muted-foreground',
            'hover:border-primary hover:text-primary transition-colors'
          )}
        >
          <Plus className="h-3 w-3" />
          Add label
          <ChevronDown className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')} />
        </button>
      </div>

      {/* Label Picker */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2">
              {/* Type-specific labels */}
              {presets.map((preset) => (
                <div key={preset.category}>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                    {preset.category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {preset.labels.map((label) => {
                      const isSelected = selectedLabels.includes(label.id);
                      return (
                        <button
                          type="button"
                          key={label.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleLabel(label.id);
                          }}
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer',
                            isSelected
                              ? cn(label.color, 'text-white shadow-md')
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          )}
                        >
                          {label.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
