'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useTravel } from '../../context/TravelContext';
import { TravelHeader } from '../../components/TravelHeader';
import { PlaceDetailDrawer } from '../../components/PlaceDetailDrawer';
import { NearbyPlacesModal } from '../../components/NearbyPlacesModal';
import { ItineraryBuilder } from '../../components/ItineraryBuilder';
import { Footer } from '../../components/Footer';
import { ExploreTabContent } from '../../components/tabs/ExploreTabContent';
import { TripBuilderFAB } from '@/components/shared/TripBuilderFAB';
import { SavedPlacesPanel } from '@/components/shared/SavedPlacesPanel';
import { CreateDraftTripModal } from '@/components/trip/CreateDraftTripModal';
import { useAuth } from '@/components/auth/AuthProvider';
import type { TravelPlace } from '@/lib/travel/types';

export default function ExplorePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const citySlug = params.citySlug as string;
  const tripId = searchParams.get('trip');

  const { user } = useAuth();
  const {
    state,
    selectPlace,
    toggleMap,
    hideNearby,
    unsavePlace,
    setActiveTab,
    fetchSavedPlacesData,
    resumeTripCreationFromStorage,
    createAndSaveTripToDatabase,
  } = useTravel();

  const {
    city,
    showMap,
    selectedPlace,
    showNearbyModal,
    nearbyPlace,
    savedPlaceIds,
    savedPlacesData,
  } = state;

  const [showItinerary, setShowItinerary] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [showResumedTripModal, setShowResumedTripModal] = useState(false);
  const [resumedPending, setResumedPending] = useState<{
    place: TravelPlace;
    cardType: 'hotel' | 'spot' | 'food' | 'activity';
  } | null>(null);

  // Set active tab to explore
  useEffect(() => {
    setActiveTab('explore');
  }, [setActiveTab]);

  // Fetch saved places data when panel or itinerary builder opens
  useEffect(() => {
    if ((showSavedPanel || showItinerary) && savedPlaceIds.length > 0) {
      fetchSavedPlacesData();
    }
  }, [showSavedPanel, showItinerary, savedPlaceIds, fetchSavedPlacesData]);

  // Check for resumed trip creation after OAuth redirect
  useEffect(() => {
    const checkForResumedTrip = async () => {
      const shouldResumeTrip = searchParams.get('resumeTrip') === 'true';

      if (shouldResumeTrip && user) {
        const pending = await resumeTripCreationFromStorage();
        if (pending) {
          setResumedPending(pending);
          setShowResumedTripModal(true);

          // Clean URL - remove resumeTrip parameter
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.delete('resumeTrip');
          const queryString = newParams.toString();
          const newUrl = queryString
            ? `/travel/${citySlug}/explore?${queryString}`
            : `/travel/${citySlug}/explore`;
          window.history.replaceState({}, '', newUrl);
        }
      }
    };

    checkForResumedTrip();
  }, [user, searchParams, resumeTripCreationFromStorage, citySlug]);

  return (
    <div className="min-h-screen travel-gradient">
      <TravelHeader
        tripName={tripId}
        citySlug={citySlug}
        onOpenSavedPanel={() => setShowSavedPanel(true)}
      />

      {/* Explore Tab Content */}
      <ExploreTabContent />

      {/* Place Detail Drawer */}
      <PlaceDetailDrawer
        place={selectedPlace}
        city={city}
        isOpen={!!selectedPlace}
        onClose={() => selectPlace(null)}
        onShowOnMap={() => {
          if (!showMap) toggleMap();
        }}
      />

      {/* Nearby Places Modal */}
      <NearbyPlacesModal
        isOpen={showNearbyModal}
        onClose={hideNearby}
        centerPlace={nearbyPlace}
        onSelectPlace={(place) => {
          hideNearby();
          selectPlace(place);
        }}
      />

      {/* Itinerary Builder */}
      <ItineraryBuilder
        isOpen={showItinerary}
        onClose={() => setShowItinerary(false)}
        tripId={tripId}
        savedPlaces={savedPlacesData}
        city={city}
      />

      {/* Trip Builder FAB */}
      {city && (
        <TripBuilderFAB
          savedCount={savedPlaceIds.length}
          isReady={savedPlaceIds.length >= 3}
          onViewSaved={() => setShowSavedPanel(true)}
          onBuildItinerary={() => setShowItinerary(true)}
        />
      )}

      {/* Saved Places Panel */}
      <SavedPlacesPanel
        isOpen={showSavedPanel}
        onClose={() => setShowSavedPanel(false)}
        savedPlaces={savedPlacesData}
        onRemove={(placeId) => unsavePlace(placeId)}
        onViewBoard={() => router.push(`/travel/${citySlug}/board`)}
        onBuildItinerary={() => {
          setShowSavedPanel(false);
          setShowItinerary(true);
        }}
      />

      {/* Resumed Trip Creation Modal */}
      {showResumedTripModal && resumedPending && (
        <CreateDraftTripModal
          isOpen={showResumedTripModal}
          onClose={() => {
            setShowResumedTripModal(false);
            setResumedPending(null);
          }}
          onCreateTrip={async (tripData) => {
            const result = await createAndSaveTripToDatabase(tripData, resumedPending);

            if (result.success) {
              setShowResumedTripModal(false);
              setResumedPending(null);
              router.push(`/travel/${citySlug}/board`);
            } else {
              alert(result.error || 'Failed to create trip');
            }
          }}
          defaultDestination={city?.name}
          defaultName={city?.name ? `${city.name} Trip` : ''}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
