import { jsPDF } from 'jspdf';
import { createEvents, EventAttributes } from 'ics';
import { Card, Trip } from '@/types';

/**
 * Helper function to format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Helper function to group cards by day
 */
function groupCardsByDay(cards: Card[]): Record<string, Card[]> {
  const sorted = [...cards].sort((a, b) => {
    if (a.day !== b.day) return (a.day || 999) - (b.day || 999);
    if (a.time_slot && b.time_slot) return a.time_slot.localeCompare(b.time_slot);
    return (a.order || 0) - (b.order || 0);
  });

  return sorted.reduce((acc, card) => {
    const day = card.day?.toString() || 'Unscheduled';
    if (!acc[day]) acc[day] = [];
    acc[day].push(card);
    return acc;
  }, {} as Record<string, Card[]>);
}

/**
 * Helper function to load an image and add it to PDF
 */
async function addImageToPDF(
  doc: jsPDF,
  url: string,
  x: number,
  y: number,
  w: number,
  h: number
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          doc.addImage(dataUrl, 'JPEG', x, y, w, h);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Export trip itinerary to PDF with timeline layout
 * Only exports cards from the "Confirmed" column with photos
 */
export async function exportToPDF(trip: Trip, cards: Card[]) {
  const doc = new jsPDF();

  // Filter to only confirmed cards
  const confirmedCards = cards.filter((c) => c.labels?.includes('confirmed'));

  // Group by day
  const cardsByDay = groupCardsByDay(confirmedCards);

  let yPos = 25;

  // === TITLE PAGE ===
  // Trip Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text(trip.title, 105, yPos, { align: 'center' });
  yPos += 12;

  // Date range
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${formatDate(trip.dates.start)} - ${formatDate(trip.dates.end)}`,
    105,
    yPos,
    { align: 'center' }
  );
  yPos += 8;

  // Party info
  const party = trip.party_json;
  const partyText = `${party.adults} adult${party.adults !== 1 ? 's' : ''}${
    party.children ? `, ${party.children} child${party.children !== 1 ? 'ren' : ''}` : ''
  }`;
  doc.text(partyText, 105, yPos, { align: 'center' });
  yPos += 5;

  // Destination if available
  if (trip.destination?.name) {
    doc.text(trip.destination.name, 105, yPos, { align: 'center' });
    yPos += 5;
  }

  // Confirmed count
  doc.setFontSize(10);
  doc.setTextColor(88, 166, 193);
  doc.text(`${confirmedCards.length} confirmed items`, 105, yPos, { align: 'center' });
  yPos += 20;

  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.line(40, yPos, 170, yPos);
  yPos += 15;

  // === TIMELINE FOR EACH DAY ===
  const dayEntries = Object.entries(cardsByDay);

  for (let dayIdx = 0; dayIdx < dayEntries.length; dayIdx++) {
    const [day, dayCards] = dayEntries[dayIdx];

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Day header with background
    doc.setFillColor(88, 166, 193); // Teal
    doc.roundedRect(15, yPos - 5, 180, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(day === 'Unscheduled' ? 'Unscheduled' : `Day ${day}`, 20, yPos + 3);
    doc.setTextColor(0, 0, 0);
    yPos += 15;

    // Timeline items for this day
    for (let i = 0; i < dayCards.length; i++) {
      const card = dayCards[i];
      const payload =
        typeof card.payload_json === 'string'
          ? JSON.parse(card.payload_json)
          : card.payload_json;

      // Check page break before each card
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Timeline dot
      doc.setFillColor(88, 166, 193);
      doc.circle(22, yPos + 8, 3, 'F');

      // Timeline line connecting to next item
      if (i < dayCards.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(22, yPos + 13, 22, yPos + 45);
      }

      // Photo thumbnail (if available)
      const photoUrl = payload.photos?.[0];
      let textX = 32;
      const photoSize = 18; // mm

      if (photoUrl) {
        const loaded = await addImageToPDF(doc, photoUrl, 32, yPos, photoSize, photoSize);
        if (loaded) {
          textX = 55; // Offset text if photo was loaded
        } else {
          // Draw placeholder
          doc.setFillColor(240, 240, 240);
          doc.roundedRect(32, yPos, photoSize, photoSize, 2, 2, 'F');
          doc.setFontSize(8);
          doc.setTextColor(180, 180, 180);
          doc.text('No', 38, yPos + 8);
          doc.text('Image', 36, yPos + 12);
          textX = 55;
        }
      }

      // Time slot (if available)
      if (card.time_slot) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(88, 166, 193);
        doc.text(card.time_slot, textX, yPos + 5);
      }

      // Name
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      const name = payload.name || payload.title || 'Untitled';
      const truncatedName = name.length > 40 ? name.substring(0, 37) + '...' : name;
      doc.text(truncatedName, textX, yPos + (card.time_slot ? 12 : 8));

      // Type badge
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      const typeLabel = card.type.toUpperCase();
      doc.text(typeLabel, textX, yPos + (card.time_slot ? 18 : 14));

      // Address (if available)
      if (payload.address) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const truncatedAddress =
          payload.address.length > 50 ? payload.address.substring(0, 47) + '...' : payload.address;
        doc.text(truncatedAddress, textX, yPos + (card.time_slot ? 24 : 20));
      }

      // Move to next item
      yPos += photoUrl ? 38 : 32;
    }

    // Space between days
    yPos += 10;
  }

  // Handle case where there are no confirmed cards
  if (confirmedCards.length === 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('No confirmed items yet.', 105, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(11);
    doc.text('Move cards to the "Confirmed" column to include them in your itinerary.', 105, yPos, {
      align: 'center',
    });
  }

  // === FOOTER ON ALL PAGES ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated by Tripply - Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`${trip.title.replace(/\s+/g, '_')}_Itinerary.pdf`);
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
