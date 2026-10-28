import { createEvents, EventAttributes } from 'ics';
import { Card, Trip } from '@/types';

/**
 * Download the Trip Guide PDF: cover map, day-by-day pages with route maps and QR codes,
 * and a watch-list of the videos the plan was built from.
 */
export async function exportToPDF(trip: Trip, cards: Card[]) {
  // Loaded on demand: the PDF and QR libraries are large and only needed when someone downloads
  const { exportTripGuide } = await import('./tripGuide');
  await exportTripGuide(trip, cards);
}

/**
 * Export trip to calendar (.ics file)
 * Only exports confirmed cards with time slots
 */
export async function exportToCalendar(trip: Trip, cards: Card[]) {
  // Filter to only confirmed cards with day and time_slot
  const confirmedCards = cards.filter(
    (c) => c.labels?.includes('confirmed') && c.day && c.time_slot
  );

  if (confirmedCards.length === 0) {
    throw new Error('No confirmed items with time slots to export');
  }

  const startDate = new Date(trip.dates.start);

  const events: EventAttributes[] = confirmedCards.map((card) => {
    const payload =
      typeof card.payload_json === 'string' ? JSON.parse(card.payload_json) : card.payload_json;

    // Calculate event date
    const eventDate = new Date(startDate);
    eventDate.setDate(startDate.getDate() + (card.day! - 1));

    // Parse time slot (HH:MM format)
    const [hours, minutes] = (card.time_slot || '09:00').split(':').map(Number);
    eventDate.setHours(hours, minutes, 0);

    // Event duration based on type
    const duration =
      card.type === 'activity'
        ? { hours: 2 }
        : card.type === 'food'
          ? { hours: 1, minutes: 30 }
          : { hours: 1 };

    return {
      start: [
        eventDate.getFullYear(),
        eventDate.getMonth() + 1,
        eventDate.getDate(),
        hours,
        minutes,
      ],
      duration,
      title: `${payload.name || payload.title} - ${trip.title}`,
      description: payload.description || `${card.type} for ${trip.title}`,
      location: payload.address || '',
      status: 'CONFIRMED' as const,
      busyStatus: 'BUSY' as const,
    };
  });

  const { error, value } = createEvents(events);

  if (error) {
    console.error('Calendar export error:', error);
    throw new Error('Failed to create calendar events');
  }

  // Download .ics file
  const blob = new Blob([value!], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${trip.title.replace(/\s+/g, '_')}_Calendar.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate shareable link for trip
 */
export function generateShareLink(tripId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/trips/${tripId}?shared=true`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}
