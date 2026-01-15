'use client';

import { motion } from 'framer-motion';
import {
  X,
  Star,
  DollarSign,
  MapPin,
  Clock,
  Heart,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaceCard } from '@/types';

interface ComparisonViewProps {
  places: PlaceCard[];
  onExit: () => void;
  onSaveCard?: (place: PlaceCard, day?: number) => void;
  onRemoveFromComparison: (placeId: string) => void;
}

export function ComparisonView({
  places,
  onExit,
  onSaveCard,
  onRemoveFromComparison,
}: ComparisonViewProps) {
  if (places.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <TrendingUp className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No places selected</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select up to 4 places to compare side-by-side
        </p>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Exit Comparison
        </button>
      </div>
    );
  }

  // Find best values for highlighting
  const bestRating = Math.max(...places.map((p) => p.rating || 0));
  const lowestPrice = Math.min(
    ...places.map((p) => p.price_per_night || p.price || p.price_level || Infinity)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Compare Places</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comparing {places.length} {places.length === 1 ? 'place' : 'places'}
          </p>
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
        >
          <X className="w-4 h-4" />
          Exit Comparison
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow-lg">
          <thead>
            <tr className="bg-muted">
              <th className="p-4 text-left font-semibold text-foreground sticky left-0 bg-muted z-10 min-w-[160px]">
                Attribute
              </th>
              {places.map((place) => (
                <th
                  key={place.id}
                  className="p-4 text-left font-semibold text-foreground min-w-[250px] relative"
                >
                  <button
                    onClick={() => onRemoveFromComparison(place.id)}
                    className="absolute top-2 right-2 p-1 hover:bg-background rounded-md transition-colors"
                    title="Remove from comparison"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Photos Row */}
            <tr className="border-t border-border">
              <td className="p-4 font-medium text-muted-foreground sticky left-0 bg-card z-10">
                Photo
              </td>
              {places.map((place) => (
                <td key={place.id} className="p-4">
                  {place.photos?.[0] ? (
                    <img
                      src={place.photos[0]}
                      alt={place.name}
                      className="w-full h-32 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* Name Row */}
            <tr className="border-t border-border bg-muted/30">
              <td className="p-4 font-medium text-muted-foreground sticky left-0 bg-muted/30 z-10">
                Name
              </td>
              {places.map((place) => (
                <td key={place.id} className="p-4">
                  <p className="font-semibold text-foreground">{place.name}</p>
                </td>
              ))}
            </tr>

            {/* Type Row */}
            <tr className="border-t border-border">
              <td className="p-4 font-medium text-muted-foreground sticky left-0 bg-card z-10">
                Type
              </td>
              {places.map((place) => (
                <td key={place.id} className="p-4">
                  <span className="inline-flex px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                    {place.type}
                  </span>
                </td>
              ))}
            </tr>

            {/* Rating Row */}
            <tr className="border-t border-border bg-muted/30">
              <td className="p-4 font-medium text-muted-foreground sticky left-0 bg-muted/30 z-10">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Rating
                </div>
              </td>
              {places.map((place) => (
                <td key={place.id} className="p-4">
                  {place.rating ? (
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg',
                        place.rating === bestRating
                          ? 'bg-green-500/20 border border-green-500/30'
                          : 'bg-muted'
                      )}
                    >
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-semibold">{place.rating.toFixed(1)}</span>
                      {place.review_count && (
                        <span className="text-xs text-muted-foreground">
                          ({place.review_count})
                        </span>
                      )}
                      {place.rating === bestRating && (
                        <TrendingUp className="w-3 h-3 text-green-600 ml-1" />
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No rating</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Price Row */}
            <tr className="border-t border-border">
              <td className="p-4 font-medium text-muted-foreground sticky left-0 bg-card z-10">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Price
                </div>
              </td>
              {places.map((place) => {
                const price = place.price_per_night || place.price || place.price_level || 0;
                const priceDisplay = place.price_per_night
                  ? `$${place.price_per_night}/night`
                  : place.price
                  ? `$${place.price}`
                  : place.price_level
                  ? '$'.repeat(place.price_level)
                  : 'N/A';

                return (
                  <td key={place.id} className="p-4">
                    {price > 0 ? (
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold',
                          price === lowestPrice && lowestPrice < Infinity
                            ? 'bg-green-500/20 border border-green-500/30 text-green-700 dark:text-green-300'
                            : 'bg-muted'
                        )}
                      >
                        {priceDisplay}
                        {price === lowestPrice && lowestPrice < Infinity && (
                          <TrendingUp className="w-3 h-3 text-green-600 ml-1" />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No price</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Address Row */}
            <tr className="border-t border-border bg-muted/30">
              <td className="p-4 font-medium text-muted-foreground sticky left-0 bg-muted/30 z-10">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
              </td>
              {places.map((place) => (
                <td key={place.id} className="p-4">
                  {place.address ? (
                    <p className="text-sm text-foreground">{place.address}</p>
                  ) : (
                    <span className="text-muted-foreground text-sm">No address</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Opening Hours Row */}
            <tr className="border-t border-border">
              <td className="p-4 font-medium text-muted-foreground sticky left-0 bg-card z-10">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Hours
                </div>
              </td>
              {places.map((place) => (
                <td key={place.id} className="p-4">
                  {place.opening_hours ? (
                    <p className="text-sm text-foreground">{place.opening_hours}</p>
                  ) : (
                    <span className="text-muted-foreground text-sm">No hours listed</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Amenities Row (for hotels) */}
            {places.some((p) => p.amenities && p.amenities.length > 0) && (
              <tr className="border-t border-border bg-muted/30">
                <td className="p-4 font-medium text-muted-foreground sticky left-0 bg-muted/30 z-10">
                  Amenities
                </td>
                {places.map((place) => (
                  <td key={place.id} className="p-4">
                    {place.amenities && place.amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {place.amenities.slice(0, 5).map((amenity, i) => (
                          <span
                            key={i}
                            className="inline-flex px-2 py-1 rounded-md bg-accent text-xs"
                          >
                            {amenity}
                          </span>
                        ))}
                        {place.amenities.length > 5 && (
                          <span className="inline-flex px-2 py-1 rounded-md bg-accent text-xs">
                            +{place.amenities.length - 5} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No amenities listed</span>
                    )}
                  </td>
                ))}
              </tr>
            )}

            {/* Cuisine Type Row (for restaurants) */}
            {places.some((p) => p.cuisine_type) && (
              <tr className="border-t border-border">
                <td className="p-4 font-medium text-muted-foreground sticky left-0 bg-card z-10">
                  Cuisine
                </td>
                {places.map((place) => (
                  <td key={place.id} className="p-4">
                    {place.cuisine_type ? (
                      <span className="inline-flex px-2 py-1 rounded-md bg-accent text-sm capitalize">
                        {place.cuisine_type}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                ))}
              </tr>
            )}

            {/* Duration Row (for activities) */}
            {places.some((p) => p.duration) && (
              <tr className="border-t border-border bg-muted/30">
                <td className="p-4 font-medium text-muted-foreground sticky left-0 bg-muted/30 z-10">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration
                  </div>
                </td>
                {places.map((place) => (
                  <td key={place.id} className="p-4">
                    {place.duration ? (
                      <span className="text-sm text-foreground">{place.duration}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Bar */}
      <div className="mt-6 flex items-center justify-between bg-muted/50 p-4 rounded-xl border border-border">
        <p className="text-sm text-muted-foreground">
          Select a day to save all {places.length} places to your trip
        </p>
        <div className="flex gap-3">
          {onSaveCard && (
            <>
              <select
                onChange={(e) => {
                  const day = parseInt(e.target.value);
                  if (day > 0) {
                    places.forEach((place) => onSaveCard(place, day));
                  }
                }}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:border-primary/50 focus:outline-none focus:border-primary transition-colors"
                defaultValue="0"
              >
                <option value="0">Select day for all...</option>
                {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Day {day}
                  </option>
                ))}
              </select>
              <button
                onClick={() => places.forEach((place) => onSaveCard(place))}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Heart className="w-4 h-4" />
                Save All
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
