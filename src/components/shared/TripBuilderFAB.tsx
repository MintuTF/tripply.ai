'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

interface TripBuilderFABProps {
  savedCount: number;
  isReady: boolean;  // Has hotels + activities
  onViewSaved: () => void;
  onBuildItinerary: () => void;
}

export function TripBuilderFAB({
  savedCount,
  isReady,
  onBuildItinerary
}: TripBuilderFABProps) {
  // Hidden for now - TODO: re-enable when itinerary builder is fully ready
  const isVisible = false; // savedCount >= 3;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Build Itinerary button - centered at bottom */}
          <Tooltip content="Organize your saved places into a day-by-day itinerary">
            <button
              onClick={onBuildItinerary}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full",
                "font-medium shadow-md md:shadow-lg hover:shadow-xl",
                "transition-all hover:scale-105",
                isReady
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              )}
            >
              <Calendar className="w-5 h-5" />
              <span>Build Itinerary</span>
              {isReady && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Check className="w-5 h-5" />
                </motion.div>
              )}
            </button>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
