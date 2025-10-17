'use client';

import { useState } from 'react';
import { Layout, Card } from '@/types';
import { cn } from '@/lib/utils';
import { ResultCard } from '@/components/cards/ResultCard';
import { SlidersHorizontal, MapPin, DollarSign, Star, Users } from 'lucide-react';

interface StaysLayoutProps {
  data: any;
  layout: Layout;
  onLayoutChange?: (intent: string) => void;
}

/**
 * StaysLayout - Hotel/accommodation search with filters and comparison
 * Shows when user asks about hotels, stays, accommodations
 */
export function StaysLayout({ data, layout }: StaysLayoutProps) {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 500,
    rating: 0,
    amenities: [] as string[],
  });
  const [showFilters, setShowFilters] = useState(false);

  const hotels = data.hotels || data.stays || [];

  const handleCompare = (card: Card) => {
    if (selectedCards.find((c) => c.id === card.id)) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id));
    } else if (selectedCards.length < 3) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with Filters */}
        <div className="border-b bg-background">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold">
                {data.location ? `Stays in ${data.location}` : 'Accommodation Options'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {hotels.length} properties found
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors',
                showFilters ? 'bg-accent' : 'hover:bg-accent'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-t bg-muted/50 px-6 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {/* Price Range */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4" />
                    Price Range
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={filters.priceMin}
                      onChange={(e) =>
                        setFilters({ ...filters, priceMin: Number(e.target.value) })
                      }
                      className="w-20 rounded-md border bg-background px-2 py-1 text-sm"
                      placeholder="Min"
                    />
                    <span className="text-muted-foreground">-</span>
                    <input
                      type="number"
                      value={filters.priceMax}
                      onChange={(e) =>
                        setFilters({ ...filters, priceMax: Number(e.target.value) })
                      }
                      className="w-20 rounded-md border bg-background px-2 py-1 text-sm"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Star className="h-4 w-4" />
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) =>
                      setFilters({ ...filters, rating: Number(e.target.value) })
                    }
                    className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                  >
                    <option value="0">Any</option>
                    <option value="3">3+ stars</option>
                    <option value="4">4+ stars</option>
                    <option value="4.5">4.5+ stars</option>
                  </select>
                </div>

                {/* Guests */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4" />
                    Guests
                  </label>
                  <select className="w-full rounded-md border bg-background px-3 py-1.5 text-sm">
                    <option>1 guest</option>
                    <option>2 guests</option>
                    <option>3+ guests</option>
                  </select>
                </div>

                {/* Amenities */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amenities</label>
                  <div className="space-y-1">
                    {['Free WiFi', 'Pool', 'Breakfast'].map((amenity) => (
                      <label key={amenity} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                amenities: [...filters.amenities, amenity],
                              });
                            } else {
                              setFilters({
                                ...filters,
                                amenities: filters.amenities.filter((a) => a !== amenity),
                              });
                            }
                          }}
                        />
                        {amenity}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hotels Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {hotels.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {hotels.map((hotel: any) => {
                const card: Card = {
                  id: hotel.id || `hotel-${Math.random()}`,
                  trip_id: data.trip_id || 'temp',
                  type: 'stay',
                  data: hotel,
                  is_favorited: false,
                  created_at: new Date().toISOString(),
                };
                return (
                  <ResultCard
                    key={card.id}
                    card={card}
                    variant="detailed"
                    onCompare={handleCompare}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No stays found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compare Drawer */}
      {selectedCards.length > 0 && (
        <div className="w-80 border-l bg-background">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Compare ({selectedCards.length}/3)</h3>
          </div>
          <div className="space-y-3 p-4">
            {selectedCards.map((card) => {
              const data = typeof card.data === 'string' ? JSON.parse(card.data) : card.data;
              return (
                <div
                  key={card.id}
                  className="rounded-lg border bg-card p-3"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="text-sm font-medium line-clamp-1">
                      {data.name}
                    </h4>
                    <button
                      onClick={() => handleCompare(card)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                  {data.rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{data.rating}</span>
                    </div>
                  )}
                  {data.price && (
                    <div className="mt-1 text-sm font-semibold">
                      ${data.price}/night
                    </div>
                  )}
                </div>
              );
            })}
            <button
              className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              disabled={selectedCards.length < 2}
            >
              Compare All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
