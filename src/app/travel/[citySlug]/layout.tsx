'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import { parseCitySlug, formatDestination } from '@/lib/travel/url-utils';

interface CityLayoutProps {
  children: React.ReactNode;
}

export default function CityLayout({ children }: CityLayoutProps) {
  const params = useParams();
  const citySlug = params.citySlug as string;
  const { state, setCity, setCityLoading, fetchPlaces } = useTravel();
  const { city, cityLoading } = state;

  // Track which slug we've already processed to avoid duplicate geocode calls
  const processedSlugRef = useRef<string | null>(null);

  // Parse slug and load city data
  useEffect(() => {
    if (!citySlug || processedSlugRef.current === citySlug) {
      return;
    }

    // Parse the slug to get city and country
    const parsed = parseCitySlug(citySlug);
    if (!parsed) {
      return;
    }

    const destination = formatDestination(parsed.city, parsed.country);

    // Check if we already have this city loaded
    if (city?.name === parsed.city) {
      processedSlugRef.current = citySlug;
      return;
    }

    processedSlugRef.current = citySlug;
    setCityLoading(true);

    const loadCity = async () => {
      try {
        const response = await fetch(
          `/api/places/geocode?address=${encodeURIComponent(destination)}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.lat && data.lng) {
            setCity({
              name: parsed.city,
              country: data.country || parsed.country,
              countryCode: data.countryCode || '',
              placeId: data.placeId || '',
              imageUrl: data.photoUrl,
              coordinates: {
                lat: data.lat,
                lng: data.lng,
              },
            });

            // Save the last visited city slug to localStorage for persistence
            if (typeof window !== 'undefined') {
              localStorage.setItem('voyagr_last_city_slug', citySlug);
            }
          }
        }
      } catch (error) {
        console.error('[CityLayout] Failed to geocode destination:', error);
      } finally {
        setCityLoading(false);
      }
    };

    loadCity();
  }, [citySlug, city?.name, setCity, setCityLoading]);

  // Fetch places when city is loaded
  useEffect(() => {
    if (city?.coordinates) {
      fetchPlaces(city.coordinates, city.name);
    }
  }, [city, fetchPlaces]);

  // Show loading state while city is loading
  if (cityLoading && !city) {
    return (
      <div className="min-h-screen travel-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading destination...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
