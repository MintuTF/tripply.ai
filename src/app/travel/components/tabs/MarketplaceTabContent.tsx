'use client';

import { useEffect } from 'react';
import { useTripContext } from '@/context/TripContext';
import { useTravel } from '../../context/TravelContext';
import { MarketplaceView } from '@/components/marketplace/MarketplaceView';

export function MarketplaceTabContent() {
  const { trip, updateTrip } = useTripContext();
  const { state } = useTravel();

  // Initialize trip data from travel state if not already set
  useEffect(() => {
    if (state.city && (!trip?.destination || trip.destination.name !== state.city.name)) {
      updateTrip({
        destination: {
          name: state.city.name,
          coordinates: state.city.coordinates,
        },
      });
    }
  }, [state.city, trip?.destination, updateTrip]);

  const tripContext = state.city ? {
    destination: state.city.name,
    destinationCoordinates: state.city.coordinates,
    duration: trip?.dates ? Math.ceil(
      (new Date(trip.dates.end).getTime() - new Date(trip.dates.start).getTime()) / (1000 * 60 * 60 * 24)
    ) : undefined,
  } : undefined;

  return (
    <div className="w-full">
      <MarketplaceView tripContext={tripContext} />
    </div>
  );
}
