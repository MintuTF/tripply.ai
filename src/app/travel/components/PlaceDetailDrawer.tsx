'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  X,
  Star,
  Clock,
  MapPin,
  Navigation,
  Heart,
  Check,
  Sparkles,
  Loader2,
  GripHorizontal,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import { ShareButton } from './ShareButton';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/adsense/config';
import type { TravelPlace, CityData } from '@/lib/travel/types';
import { cn } from '@/lib/utils';

interface PlaceDetailDrawerProps {
  place: TravelPlace | null;
  city: CityData | null;
  isOpen: boolean;
  onClose: () => void;
  onShowOnMap: () => void;
}

export function PlaceDetailDrawer({
  place,
  city,
  isOpen,
  onClose,
  onShowOnMap
}: PlaceDetailDrawerProps) {
  const router = useRouter();
  const { savePlace, unsavePlace, isPlaceSaved } = useTravel();
  const [whyVisit, setWhyVisit] = useState<string[]>([]);
  const [loadingWhyVisit, setLoadingWhyVisit] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'expanded'>('expanded');
  const dragControls = useDragControls();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch "Why worth a visit" when place changes
  useEffect(() => {
    if (place && city) {
      fetchWhyVisit();
    } else {
      setWhyVisit([]);
    }
  }, [place?.id]);

  const fetchWhyVisit = async () => {
    if (!place) return;

    setLoadingWhyVisit(true);
    try {
      const response = await fetch('/api/travel/ai/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'whyVisit',
          place: {
            id: place.id,
            name: place.name,
            categories: place.categories,
            rating: place.rating,
            description: place.description,
          },
          city: city?.name,
          maxReasons: 3, // Limit to 3 bullet points for preview
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure max 3 reasons for preview mode
        setWhyVisit((data.reasons || []).slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to fetch why visit:', error);
      setWhyVisit([
        `Highly rated with ${place.rating} stars`,
        `Popular ${place.categories[0] || 'destination'} in ${city?.name}`,
        'Recommended by travelers',
      ]);
    } finally {
      setLoadingWhyVisit(false);
    }
  };

  const isSaved = place ? isPlaceSaved(place.id) : false;

  const handleSaveToggle = () => {
    if (!place) return;
    if (isSaved) {
      unsavePlace(place.id);
    } else {
      savePlace(place.id);
    }
  };

  const handleViewDetails = () => {
    if (place) {
      router.push(`/travel/places/${place.id}`);
    }
  };

  // Mobile bottom sheet or desktop side panel
  const drawerVariants = isMobile ? {
    initial: { y: '100%' },
    animate: { y: sheetHeight === 'collapsed' ? '60%' : 0 },
    exit: { y: '100%' },
  } : {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  };

  return (
    <AnimatePresence>
      {isOpen && place && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={drawerVariants.initial}
            animate={drawerVariants.animate}
            exit={drawerVariants.exit}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag={isMobile ? 'y' : false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (isMobile) {
                if (info.velocity.y > 500 || info.offset.y > 200) {
                  onClose();
                } else if (info.offset.y > 50) {
                  setSheetHeight('collapsed');
                } else {
                  setSheetHeight('expanded');
                }
              }
            }}
            className={cn(
              'fixed z-50 bg-white shadow-2xl overflow-hidden',
              isMobile
                ? 'bottom-0 left-0 right-0 rounded-t-3xl max-h-[90vh]'
                : 'top-0 right-0 h-full w-full sm:w-[480px] md:w-[520px]'
            )}
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
              >
                <GripHorizontal className="w-8 h-1.5 text-gray-300" />
              </div>
            )}

            <div className="h-full flex flex-col overflow-y-auto">
              {/* Hero Image */}
              <div className="relative h-56 sm:h-64 flex-shrink-0">
                <img
                  src={place.imageUrl || '/placeholder-place.jpg'}
                  alt={place.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>

                {/* Save and Share buttons */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <button
                    onClick={handleSaveToggle}
                    className={cn(
                      'w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors',
                      isSaved
                        ? 'bg-pink-500 text-white'
                        : 'bg-white/90 text-gray-700 hover:bg-white'
                    )}
                  >
                    <Heart className={cn('w-5 h-5', isSaved && 'fill-current')} />
                  </button>
                  <ShareButton place={place} cityName={city?.name} />
                </div>

                {/* Title overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {place.name}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-sm font-medium">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>
                    {place.categories.slice(0, 2).map((cat, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 space-y-6">
                {/* Description - Clamped to 3 lines */}
                <p className="text-gray-700 leading-relaxed line-clamp-3">
                  {place.shortDescription || place.description || 'Discover this amazing destination and create unforgettable memories.'}
                </p>

                {/* Quick Info Pills */}
                <div className="flex flex-wrap gap-3">
                  {place.duration && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{place.duration}</span>
                    </div>
                  )}
                  {place.area && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{place.area}</span>
                    </div>
                  )}
                  {place.priceLevel && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 text-green-700 text-sm">
                      <DollarSign className="w-4 h-4" />
                      <span>{'$'.repeat(place.priceLevel)}</span>
                    </div>
                  )}
                </div>

                {/* Mini Map */}
                {place.coordinates && (
                  <div
                    onClick={onShowOnMap}
                    className="relative h-32 rounded-xl overflow-hidden cursor-pointer group"
                  >
                    <img
                      src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-l+8B5CF6(${place.coordinates.lng},${place.coordinates.lat})/${place.coordinates.lng},${place.coordinates.lat},14,0/400x150@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''}`}
                      alt="Location map"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white bg-purple-600 px-3 py-1.5 rounded-full text-sm font-medium transition-opacity">
                        View on Map
                      </span>
                    </div>
                  </div>
                )}

                {/* AI Why This Fits - Shortened to max 3 bullets */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Why this fits your trip
                    </h3>
                  </div>

                  {loadingWhyVisit ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {whyVisit.slice(0, 3).map((reason, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-2"
                        >
                          <span className="text-purple-600 flex-shrink-0 mt-0.5">•</span>
                          <span className="text-gray-700 text-sm leading-snug">{reason}</span>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Drawer Ad - Before CTA */}
                <div className="flex justify-center py-2">
                  <AdSlot
                    slot={AD_SLOTS.MODAL_HEADER_LEADERBOARD}
                    format="horizontal"
                    responsive={true}
                    layout="display"
                    priority="normal"
                  />
                </div>

                {/* Primary CTA - View Full Details */}
                <button
                  onClick={handleViewDetails}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300"
                >
                  <span>View Full Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Secondary Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onShowOnMap}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-purple-200 text-purple-700 font-medium hover:bg-purple-50 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Show on Map</span>
                  </button>
                  <button
                    onClick={handleSaveToggle}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-medium transition-colors',
                      isSaved
                        ? 'bg-pink-500 border-pink-500 text-white'
                        : 'border-purple-200 text-purple-700 hover:bg-purple-50'
                    )}
                  >
                    <Heart className={cn('w-5 h-5', isSaved && 'fill-current')} />
                    <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
