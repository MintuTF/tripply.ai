'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTravel } from './context/TravelContext';
import { TravelHeader } from './components/TravelHeader';
import { HeroSearch } from './components/HeroSearch';
import { Footer } from './components/Footer';
import { generateSlugFromDestination } from '@/lib/travel/url-utils';

function TravelPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state } = useTravel();
  const { city, cityLoading } = state;
  const [checkingLastCity, setCheckingLastCity] = useState(true);

  // Handle legacy URL redirects and auto-redirect to last visited city
  useEffect(() => {
    const destination = searchParams.get('destination');
    const tab = searchParams.get('tab') || 'explore';

    if (destination) {
      // Generate slug and redirect to new URL structure
      const citySlug = generateSlugFromDestination(destination);
      const tabPath = tab === 'marketplace' ? 'shop' : tab;
      router.replace(`/travel/${citySlug}/${tabPath}`);
      return;
    }

    // Check for last visited city in localStorage and auto-redirect
    if (typeof window !== 'undefined') {
      const lastCitySlug = localStorage.getItem('voyagr_last_city_slug');
      if (lastCitySlug) {
        router.replace(`/travel/${lastCitySlug}/explore`);
        return;
      }
    }

    // No redirect needed, show the search page
    setCheckingLastCity(false);
  }, [searchParams, router]);

  // Show loading if redirecting or checking for last city
  if (searchParams.get('destination') || checkingLastCity) {
    return (
      <div className="min-h-screen travel-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen travel-gradient">
      <TravelHeader />

      {/* Landing Page - Search Hero */}
      {cityLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
        <HeroSearch />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen travel-gradient flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
    </div>
  );
}

export default function TravelPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TravelPageContent />
    </Suspense>
  );
}
