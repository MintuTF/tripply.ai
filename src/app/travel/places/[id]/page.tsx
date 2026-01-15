import { notFound } from 'next/navigation';
import { Header } from './components/Header';
import { PlaceInfoBar } from './components/PlaceInfoBar';
import { PlaceVideoHero } from './components/PlaceVideoHero';
import { PlaceVideosCarousel } from './components/PlaceVideosCarousel';
import { LocationMapSection } from './components/LocationMapSection';
import type { TravelPlace } from '@/lib/travel/types';

interface PlaceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Fetch full place details
async function getPlaceDetails(placeId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/travel/place/details?id=${placeId}`, {
      cache: 'no-store', // Ensure fresh data for each request
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch place details:', error);
    return null;
  }
}

export default async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  // Await params in Next.js 15+
  const { id } = await params;
  const data = await getPlaceDetails(id);

  if (!data || !data.place) {
    notFound();
  }

  const { place, nearby } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-900">
      {/* Header with Back Navigation */}
      <Header
        placeName={place.name}
        placeId={place.id}
      />

      {/* Compact Info Bar - Name, Rating, Categories, Address, Hours */}
      <PlaceInfoBar place={place} />

      {/* Video-First Hero with AI Summary */}
      <PlaceVideoHero place={place} />

      {/* More Videos Carousel */}
      <PlaceVideosCarousel
        placeName={place.name}
        placeId={place.id}
        city={place.area}
      />

      {/* Location & Map - Keep existing */}
      <LocationMapSection
        place={place}
        nearbyPlaces={nearby || { hotels: [], activities: [], restaurants: [] }}
      />

      {/* Action Buttons */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address || place.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Get Directions
            </a>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-full font-medium border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Save Place
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
