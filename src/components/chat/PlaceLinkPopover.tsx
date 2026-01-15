'use client';

import { useState, ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { PlaceCard } from '@/types';
import { cn } from '@/lib/utils';
import { MapPin, Star, Plus, Loader2, ExternalLink, X } from 'lucide-react';

interface PlaceLinkPopoverProps {
  query: string;
  children: ReactNode;
  onAddToShortlist?: (card: PlaceCard) => void;
}

export function PlaceLinkPopover({ query, children, onAddToShortlist }: PlaceLinkPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [placeCard, setPlaceCard] = useState<PlaceCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const fetchPlaceData = async () => {
    if (placeCard) return; // Already fetched

    setIsLoading(true);
    setError(null);

    try {
      // Parse query - format is "Place Name, City" or just "Place Name"
      const parts = query.split(',').map(s => s.trim());
      const placeName = parts[0];
      const location = parts.length > 1 ? parts.slice(1).join(', ') : '';

      // If we have a location, use it; otherwise search with just the place name
      // Don't use "World" as it won't geocode properly
      const searchQuery = location ? placeName : query;
      const searchLocation = location || placeName; // Use place name itself if no location

      const response = await fetch(
        `/api/places/search?query=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(searchLocation)}&type=all`
      );

      if (!response.ok) {
        throw new Error('Failed to search for place');
      }

      const data = await response.json();

      if (data.cards && data.cards.length > 0) {
        // Take the first result and convert to PlaceCard format
        const card = data.cards[0];
        const payload = card.payload_json;

        const placeCardData: PlaceCard = {
          id: card.id || `place-${Date.now()}`,
          type: card.type === 'hotel' ? 'hotel' :
                card.type === 'food' ? 'restaurant' :
                card.type === 'spot' ? 'activity' : 'location',
          name: payload.name,
          address: payload.address,
          coordinates: payload.coordinates,
          photos: payload.photos || [],
          rating: payload.rating,
          review_count: payload.review_count,
          price_level: payload.price_level,
          description: payload.description,
          opening_hours: payload.opening_hours,
          url: payload.url,
          place_id: payload.place_id,
          cuisine_type: payload.cuisine_type,
          amenities: payload.amenities,
        };

        setPlaceCard(placeCardData);
      } else {
        setError('No places found');
      }
    } catch (err) {
      console.error('Error fetching place:', err);
      setError('Failed to load place information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !placeCard && !isLoading) {
      fetchPlaceData();
    }
  };

  const handleAddToShortlist = () => {
    if (placeCard && onAddToShortlist) {
      onAddToShortlist(placeCard);
      setIsAdded(true);
    }
  };

  // Get photo URL - handles both direct URLs and API proxy
  const getPhotoUrl = (photo: string) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    // Proxy through our API for Google Photos references
    return `/api/places/photo?ref=${encodeURIComponent(photo)}&maxwidth=400`;
  };

  const firstPhoto = placeCard?.photos?.[0];
  const photoUrl = firstPhoto ? getPhotoUrl(firstPhoto) : null;

  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-0.5 text-primary font-medium',
            'hover:text-accent-foreground transition-colors duration-200',
            'underline decoration-primary/30 hover:decoration-primary decoration-2 underline-offset-2',
            'cursor-pointer'
          )}
        >
          <MapPin className="h-3 w-3 flex-shrink-0" />
          {children}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={cn(
            'z-50 w-72 rounded-xl border bg-card shadow-lg',
            'animate-in fade-in-0 zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=top]:slide-in-from-bottom-2'
          )}
          sideOffset={8}
          align="start"
        >
          {/* Close button */}
          <Popover.Close className="absolute right-2 top-2 z-10 rounded-full p-1 bg-black/50 hover:bg-black/70 text-white transition-colors">
            <X className="h-3 w-3" />
          </Popover.Close>

          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          )}

          {error && (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={fetchPlaceData}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {placeCard && !isLoading && (
            <div className="overflow-hidden rounded-xl">
              {/* Image */}
              {photoUrl ? (
                <div className="relative h-32 w-full overflow-hidden">
                  <img
                    src={photoUrl}
                    alt={placeCard.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              ) : (
                <div className="h-20 w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}

              {/* Content */}
              <div className="p-3 space-y-2">
                {/* Name */}
                <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                  {placeCard.name}
                </h4>

                {/* Rating */}
                {placeCard.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium text-foreground">
                      {placeCard.rating.toFixed(1)}
                    </span>
                    {placeCard.review_count && (
                      <span className="text-xs text-muted-foreground">
                        ({placeCard.review_count.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}

                {/* Address */}
                {placeCard.address && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {placeCard.address}
                  </p>
                )}

                {/* Type badge */}
                {placeCard.cuisine_type && (
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                    {placeCard.cuisine_type}
                  </span>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {onAddToShortlist && (
                    <button
                      onClick={handleAddToShortlist}
                      disabled={isAdded}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        isAdded
                          ? 'bg-green-500/10 text-green-600 cursor-default'
                          : 'bg-primary text-white hover:bg-primary/90'
                      )}
                    >
                      {isAdded ? (
                        <>Added!</>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          Add to Shortlist
                        </>
                      )}
                    </button>
                  )}

                  {placeCard.url && (
                    <a
                      href={placeCard.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <Popover.Arrow className="fill-card" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
