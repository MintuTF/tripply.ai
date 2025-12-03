'use client';

import { Card } from '@/types';
import { cn } from '@/lib/utils';
import { X, Star, MapPin, Check, Minus } from 'lucide-react';

interface CompareDrawerProps {
  cards: Card[];
  onClose: () => void;
  onRemoveCard: (cardId: string) => void;
}

/**
 * CompareDrawer - Side-by-side comparison of cards
 * Shows detailed comparison table for hotels, restaurants, etc.
 */
export function CompareDrawer({ cards, onClose, onRemoveCard }: CompareDrawerProps) {
  if (cards.length === 0) return null;

  // Parse card data
  const parsedCards = cards.map((card) => ({
    ...card,
    data: typeof card.data === 'string' ? JSON.parse(card.data) : card.data,
  }));

  // Extract common attributes for comparison
  const attributes = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'rating', label: 'Rating', type: 'rating' },
    { key: 'address', label: 'Location', type: 'text' },
    { key: 'review_count', label: 'Reviews', type: 'number' },
    { key: 'distance', label: 'Distance', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'website', label: 'Website', type: 'url' },
  ];

  // Get amenities (for hotels)
  const allAmenities = new Set<string>();
  parsedCards.forEach((card) => {
    if (card.data.amenities && Array.isArray(card.data.amenities)) {
      card.data.amenities.forEach((a: string) => allAmenities.add(a));
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="flex h-full items-center justify-center p-4">
        <div className="relative flex h-full max-h-[90vh] w-full max-w-6xl flex-col rounded-xl border bg-background shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold">Compare Options</h2>
              <p className="text-sm text-muted-foreground">
                Comparing {cards.length} {cards[0]?.type || 'item'}
                {cards.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Comparison Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-background">
                <tr>
                  <th className="w-48 border-b border-r bg-muted/50 p-4 text-left">
                    <span className="text-sm font-medium text-muted-foreground">
                      Attribute
                    </span>
                  </th>
                  {parsedCards.map((card) => (
                    <th key={card.id} className="min-w-[250px] border-b bg-muted/50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {card.data.image_url && (
                            <img
                              src={card.data.image_url}
                              alt={card.data.name}
                              className="mb-2 h-32 w-full rounded-lg object-cover"
                            />
                          )}
                          <h3 className="font-semibold line-clamp-2">
                            {card.data.name || card.data.title}
                          </h3>
                        </div>
                        <button
                          onClick={() => onRemoveCard(card.id)}
                          className="rounded p-1 hover:bg-accent"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Basic Attributes */}
                {attributes.map((attr) => {
                  const hasValue = parsedCards.some((card) => card.data[attr.key]);
                  if (!hasValue) return null;

                  return (
                    <tr key={attr.key} className="border-b">
                      <td className="border-r bg-muted/30 p-4 text-sm font-medium">
                        {attr.label}
                      </td>
                      {parsedCards.map((card) => (
                        <td key={card.id} className="p-4 text-sm">
                          {renderValue(card.data[attr.key], attr.type)}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* Amenities */}
                {allAmenities.size > 0 && (
                  <>
                    <tr className="border-b">
                      <td
                        colSpan={cards.length + 1}
                        className="bg-muted/50 p-4 text-sm font-medium"
                      >
                        Amenities
                      </td>
                    </tr>
                    {Array.from(allAmenities).map((amenity) => (
                      <tr key={amenity} className="border-b">
                        <td className="border-r bg-muted/30 p-4 text-sm">
                          {amenity}
                        </td>
                        {parsedCards.map((card) => {
                          const hasAmenity =
                            card.data.amenities &&
                            Array.isArray(card.data.amenities) &&
                            card.data.amenities.includes(amenity);
                          return (
                            <td key={card.id} className="p-4 text-center">
                              {hasAmenity ? (
                                <Check className="mx-auto h-5 w-5 text-green-500" />
                              ) : (
                                <Minus className="mx-auto h-5 w-5 text-gray-300" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/30 px-6 py-4">
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to render values based on type
function renderValue(value: any, type: string) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (type) {
    case 'rating':
      return (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{value}</span>
        </div>
      );

    case 'number':
      return <span>{value.toLocaleString()}</span>;

    case 'url':
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-500 hover:underline"
        >
          <span className="truncate">Visit</span>
        </a>
      );

    default:
      return <span className="line-clamp-2">{String(value)}</span>;
  }
}
