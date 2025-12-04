'use client';

import { Trip, Card } from '@/types';
import { MapPin, Clock, Calendar, Users } from 'lucide-react';

interface PrintableItineraryProps {
  trip: Trip;
  cards: Card[];
}

/**
 * PrintableItinerary - A hidden component that renders when printing
 * Shows only confirmed cards in a timeline format with photos
 */
export function PrintableItinerary({ trip, cards }: PrintableItineraryProps) {
  // Filter to only confirmed cards
  const confirmedCards = cards
    .filter((c) => c.labels?.includes('confirmed'))
    .sort((a, b) => {
      if (a.day !== b.day) return (a.day || 999) - (b.day || 999);
      if (a.time_slot && b.time_slot) return a.time_slot.localeCompare(b.time_slot);
      return (a.order || 0) - (b.order || 0);
    });

  // Group by day
  const cardsByDay = confirmedCards.reduce(
    (acc, card) => {
      const day = card.day?.toString() || 'Unscheduled';
      if (!acc[day]) acc[day] = [];
      acc[day].push(card);
      return acc;
    },
    {} as Record<string, Card[]>
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get party text
  const getPartyText = () => {
    const party = trip.party_json;
    let text = `${party.adults} adult${party.adults !== 1 ? 's' : ''}`;
    if (party.children) {
      text += `, ${party.children} child${party.children !== 1 ? 'ren' : ''}`;
    }
    return text;
  };

  return (
    <div className="print-itinerary hidden print:block bg-white text-black p-8">
      {/* Header */}
      <header className="text-center mb-8 pb-6 border-b-2 border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{trip.title}</h1>

        <div className="flex items-center justify-center gap-6 text-gray-600 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(trip.dates.start)} - {formatDate(trip.dates.end)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{getPartyText()}</span>
          </div>
        </div>

        {trip.destination?.name && (
          <div className="flex items-center justify-center gap-1 text-gray-500 mt-2">
            <MapPin className="h-4 w-4" />
            <span>{trip.destination.name}</span>
          </div>
        )}

        <p className="text-sm text-teal-600 mt-3">{confirmedCards.length} confirmed items</p>
      </header>

      {/* Timeline by Day */}
      {Object.entries(cardsByDay).map(([day, dayCards]) => (
        <section key={day} className="mb-8 print-section">
          {/* Day Header */}
          <h2 className="text-lg font-bold bg-teal-500 text-white px-4 py-2 mb-4 rounded">
            {day === 'Unscheduled' ? 'Unscheduled Items' : `Day ${day}`}
          </h2>

          {/* Timeline */}
          <div className="relative pl-8">
            {/* Vertical timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

            {dayCards.map((card, idx) => {
              const payload =
                typeof card.payload_json === 'string'
                  ? JSON.parse(card.payload_json)
                  : card.payload_json;

              return (
                <div key={card.id} className="relative mb-6 print-card">
                  {/* Timeline dot */}
                  <div className="absolute -left-5 top-3 w-3 h-3 bg-teal-500 rounded-full border-2 border-white shadow" />

                  <div className="flex gap-4 bg-gray-50 rounded-lg p-3">
                    {/* Thumbnail */}
                    {payload.photos?.[0] && (
                      <img
                        src={payload.photos[0]}
                        alt={payload.name || 'Place'}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {/* Time */}
                      {card.time_slot && (
                        <div className="flex items-center gap-1 text-teal-600 text-sm font-semibold mb-1">
                          <Clock className="h-3 w-3" />
                          <span>{card.time_slot}</span>
                        </div>
                      )}

                      {/* Name */}
                      <h3 className="font-bold text-gray-900 text-base">
                        {payload.name || payload.title || 'Untitled'}
                      </h3>

                      {/* Type badge */}
                      <span className="inline-block text-xs uppercase text-gray-500 bg-gray-200 px-2 py-0.5 rounded mt-1">
                        {card.type}
                      </span>

                      {/* Address */}
                      {payload.address && (
                        <p className="text-sm text-gray-600 mt-1 flex items-start gap-1">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="truncate">{payload.address}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Empty state */}
      {confirmedCards.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No confirmed items yet.</p>
          <p className="text-sm mt-2">
            Move cards to the &ldquo;Confirmed&rdquo; column to include them in your itinerary.
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 mt-8 pt-4 border-t border-gray-200">
        Generated by Tripply
      </footer>
    </div>
  );
}
