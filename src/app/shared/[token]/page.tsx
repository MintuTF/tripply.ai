import { getShareLink, getTrip, getTripCards } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { SharedTripView } from './SharedTripView';

interface SharedTripPageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedTripPage({ params }: SharedTripPageProps) {
  const { token } = await params;

  // Get share link
  const shareLink = await getShareLink(token);
  if (!shareLink) {
    notFound();
  }

  // Get trip data
  const trip = await getTrip(shareLink.trip_id);
  if (!trip) {
    notFound();
  }

  // Get trip cards
  const cards = await getTripCards(shareLink.trip_id);

  return (
    <SharedTripView
      trip={trip}
      cards={cards}
      role={shareLink.role}
    />
  );
}
