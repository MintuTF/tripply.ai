import { getSharedTripByToken } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { SharedTripView } from './SharedTripView';

interface SharedTripPageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedTripPage({ params }: SharedTripPageProps) {
  const { token } = await params;

  let shared;
  try {
    shared = await getSharedTripByToken(token);
  } catch (error) {
    console.error('[Shared] Failed to load shared trip:', error);
    notFound();
  }

  if (!shared) {
    notFound();
  }

  return (
    <SharedTripView
      trip={shared.trip}
      cards={shared.cards}
      role={shared.role}
    />
  );
}
