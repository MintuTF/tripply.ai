'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';

export function SavePlaceHint() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(
    typeof window !== 'undefined' && localStorage.getItem('savePlaceHint_dismissed') === 'true'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!dismissed) {
      // Show after user views 3 places without saving
      const viewCount = parseInt(localStorage.getItem('placeViewCount') || '0');
      if (viewCount >= 3) {
        setShow(true);
      }
    }
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('savePlaceHint_dismissed', 'true');
    }
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-16 right-4 z-20 max-w-xs"
    >
      <div className="bg-purple-600 text-white p-4 rounded-lg shadow-xl
                     relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-6 h-6 rounded-full
                   hover:bg-white/20 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex
                         items-center justify-center flex-shrink-0">
            💡
          </div>
          <div>
            <p className="font-medium mb-1">Tip: Save places to your trip</p>
            <p className="text-sm text-purple-100">
              Click the + button to save places and build your itinerary
            </p>
          </div>
        </div>
        {/* Animated pointer to Plus button */}
        <motion.div
          animate={{ x: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -right-8 top-1/2 -translate-y-1/2"
        >
          <ArrowRight className="w-6 h-6 text-purple-600" />
        </motion.div>
      </div>
    </motion.div>
  );
}
