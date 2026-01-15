'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTravel } from '../../context/TravelContext';
import { TravelHeader } from '../../components/TravelHeader';
import { ChatTabContent } from '../../components/tabs/ChatTabContent';

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const citySlug = params.citySlug as string;
  const tripId = searchParams.get('trip');

  const { setActiveTab } = useTravel();

  // Set active tab to chat
  useEffect(() => {
    setActiveTab('chat');
  }, [setActiveTab]);

  return (
    <div className="min-h-screen travel-gradient">
      <TravelHeader tripName={tripId} citySlug={citySlug} />

      {/* Chat Tab Content */}
      <ChatTabContent />
    </div>
  );
}
