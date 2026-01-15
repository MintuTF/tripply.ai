'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Users, Clock, MapPin, Plus, Check, Bookmark, BookmarkCheck } from 'lucide-react';
import type { TravelPlace } from '@/lib/travel/types';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';
import { useTravel } from '../context/TravelContext';
import { CreateDraftTripModal } from '@/components/trip/CreateDraftTripModal';
import { SignInModal } from '@/components/auth/SignInModal';
import { useAuth } from '@/components/auth/AuthProvider';

interface PlaceCardProps {
  place: TravelPlace;
  onClick: () => void;
  index?: number;
}

// Format popularity score (e.g., 17668 -> "17.7K")
function formatPopularity(score: number): string {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  return score.toString();
}

// Get category icon
function getCategoryIcon(category: string) {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('restaurant') || lowerCategory.includes('food')) {
    return '🍽️';
  }
  if (lowerCategory.includes('bar') || lowerCategory.includes('nightlife')) {
    return '🍸';
  }
  if (lowerCategory.includes('park') || lowerCategory.includes('nature')) {
    return '🌳';
  }
  if (lowerCategory.includes('museum') || lowerCategory.includes('art')) {
    return '🎨';
  }
  if (lowerCategory.includes('temple') || lowerCategory.includes('shrine')) {
    return '⛩️';
  }
  if (lowerCategory.includes('shopping')) {
    return '🛍️';
  }
  if (lowerCategory.includes('hotel') || lowerCategory.includes('stay')) {
    return '🏨';
  }
  return '📍';
}

// Determine card type from place categories
function getCardType(place: TravelPlace): 'hotel' | 'spot' | 'food' | 'activity' {
  const categories = place.categories.map(c => c.toLowerCase());

  if (categories.some(c => c.includes('hotel') || c.includes('lodging') || c.includes('accommodation'))) {
    return 'hotel';
  }
  if (categories.some(c => c.includes('restaurant') || c.includes('food') || c.includes('cafe') || c.includes('bar'))) {
    return 'food';
  }
  if (categories.some(c => c.includes('museum') || c.includes('attraction') || c.includes('landmark'))) {
    return 'spot';
  }

  return 'activity';
}

export function PlaceCard({ place, onClick, index = 0 }: PlaceCardProps) {
  const { state, savePlace, unsavePlace, createDraftTrip, addToTrip, createAndSaveTripToDatabase } = useTravel();
  const { user } = useAuth();
  const isSaved = state.savedPlaceIds.includes(place.id);
  const isInTrip = state.draftCards.some(c => c.placeData.id === place.id);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<{place: TravelPlace, cardType: 'hotel' | 'spot' | 'food' | 'activity'} | null>(null);
  const displayCategories = place.categories.slice(0, 2);

  // After user signs in, show trip creation modal with a delay
  useEffect(() => {
    if (user && pendingPlace && !showSignInModal) {
      // Add small delay to prevent flash
      const timer = setTimeout(() => {
        if (!showTripModal) {
          setShowTripModal(true);
        }
      }, 300); // 300ms delay for smooth transition

      return () => clearTimeout(timer);
    }
  }, [user, pendingPlace, showSignInModal, showTripModal]);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      unsavePlace(place.id);
    } else {
      savePlace(place.id);
    }
  };

  const handleAddToTripClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    const cardType = getCardType(place);

    // Check if user is logged in
    if (!user) {
      setPendingPlace({ place, cardType });

      // Save to sessionStorage for OAuth redirect preservation
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('voyagr_pending_place', JSON.stringify({
          place,
          cardType,
          timestamp: Date.now(),
        }));
      }

      setShowSignInModal(true);
      return;
    }

    // If no current trip, show trip creation modal
    if (!state.currentTripId) {
      setPendingPlace({ place, cardType });
      setShowTripModal(true);
      return;
    }

    // Add to existing trip
    addToTrip(place, cardType);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="travel-card bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
        {/* Image Container */}
        <div className="relative h-40 overflow-hidden">
          <motion.img
            src={place.imageUrl || '/placeholder-place.jpg'}
            alt={place.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Save Button (Bookmark) - top-left */}
          <div className="absolute top-3 left-3 z-10">
            <Tooltip content={isSaved ? "Saved ✓" : "Save for later"}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSaveClick}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm
                           shadow-lg flex items-center justify-center
                           hover:bg-white transition-colors"
              >
                {isSaved ? (
                  <BookmarkCheck className="w-5 h-5 text-purple-600" />
                ) : (
                  <Bookmark className="w-5 h-5 text-gray-600" />
                )}
              </motion.button>
            </Tooltip>
          </div>

          {/* Add to Trip Button - top-right */}
          <div className="absolute top-3 right-3 z-10">
            <Tooltip content={isInTrip ? "In trip ✓" : "Add to trip"}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToTripClick}
                className={`w-10 h-10 rounded-full backdrop-blur-sm shadow-lg flex items-center justify-center transition-all ${
                  isInTrip
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-white/90 hover:bg-white'
                }`}
              >
                {isInTrip ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Plus className="w-5 h-5 text-purple-600" />
                )}
              </motion.button>
            </Tooltip>
          </div>

          {/* Popularity Badge - moved down slightly */}
          {place.popularityScore > 0 && (
            <div className="absolute top-16 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-semibold shadow-lg">
              <Users className="w-3 h-3" />
              <span>{formatPopularity(place.popularityScore)}</span>
            </div>
          )}

          {/* Rating Badge - Bottom Left */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-gray-900">{place.rating.toFixed(1)}</span>
            {place.reviewCount > 0 && (
              <span className="text-gray-500">({place.reviewCount})</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
            {place.name}
          </h3>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {displayCategories.map((category, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium"
              >
                <span>{getCategoryIcon(category)}</span>
                <span>{category}</span>
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {place.description || place.shortDescription || 'Discover this amazing place'}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            {place.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{place.duration}</span>
              </div>
            )}
            {place.area && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="line-clamp-1">{place.area}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trip Creation Modal */}
      <CreateDraftTripModal
        isOpen={showTripModal}
        onClose={() => {
          setShowTripModal(false);
          setPendingPlace(null);
        }}
        onCreateTrip={async (tripData) => {
          const result = await createAndSaveTripToDatabase(
            tripData,
            pendingPlace || undefined
          );

          if (result.success) {
            setShowTripModal(false);
            setPendingPlace(null);
          } else {
            alert(result.error || 'Failed to create trip');
          }
        }}
        defaultDestination={state.city?.name}
        defaultName={state.city?.name ? `${state.city.name} Trip` : ''}
      />

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => {
          setShowSignInModal(false);
          setPendingPlace(null);
        }}
        title="Sign in to save your trip"
        description="Create an account to save your trip and access it from anywhere."
      />
    </motion.div>
  );
}
