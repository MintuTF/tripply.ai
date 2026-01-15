'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTravel } from '../../context/TravelContext';
import { TravelHeader } from '../../components/TravelHeader';
import { Footer } from '../../components/Footer';
import { BoardTabContent } from '../../components/tabs/BoardTabContent';

export default function BoardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const citySlug = params.citySlug as string;
  const tripId = searchParams.get('trip');

  const { setActiveTab } = useTravel();

  // Set active tab to board
  useEffect(() => {
    setActiveTab('board');
  }, [setActiveTab]);

  return (
    <div className="min-h-screen travel-gradient">
      <TravelHeader tripName={tripId} citySlug={citySlug} />

      {/* Board Tab Content */}
      <BoardTabContent />

      {/* Footer */}
      <Footer />
    </div>
  );
}
