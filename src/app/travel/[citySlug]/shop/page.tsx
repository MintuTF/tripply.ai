'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTravel } from '../../context/TravelContext';
import { TravelHeader } from '../../components/TravelHeader';
import { Footer } from '../../components/Footer';
import { MarketplaceTabContent } from '../../components/tabs/MarketplaceTabContent';

export default function ShopPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const citySlug = params.citySlug as string;
  const tripId = searchParams.get('trip');

  const { setActiveTab } = useTravel();

  // Set active tab to marketplace
  useEffect(() => {
    setActiveTab('marketplace');
  }, [setActiveTab]);

  return (
    <div className="min-h-screen travel-gradient">
      <TravelHeader tripName={tripId} citySlug={citySlug} />

      {/* Marketplace Tab Content */}
      <MarketplaceTabContent />

      {/* Footer */}
      <Footer />
    </div>
  );
}
