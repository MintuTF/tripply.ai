'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Sparkles, Plane } from 'lucide-react';

interface TripNameModalProps {
  isOpen: boolean;
  cityName: string;
  cityFullName: string; // e.g., "Paris, France"
  onClose: () => void;
  onConfirm: (tripName: string) => void;
}

// Get city image from Unsplash
function getCityImageUrl(cityName: string): string {
  const cleanCity = cityName.split(',')[0].trim().toLowerCase();
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(cleanCity)},city,travel`;
}

export function TripNameModal({
  isOpen,
  cityName,
  cityFullName,
  onClose,
  onConfirm,
}: TripNameModalProps) {
  const [tripName, setTripName] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  // Pre-fill trip name when city changes
  useEffect(() => {
    if (cityName) {
      const cleanName = cityName.split(',')[0].trim();
      setTripName(`My ${cleanName} Trip`);
    }
  }, [cityName]);

  // Reset image loaded state when modal opens
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tripName.trim()) {
      onConfirm(tripName.trim());
    }
  };

  const imageUrl = getCityImageUrl(cityName);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Plane className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Start Your Adventure
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* City Image */}
              <div className="relative w-full h-44 rounded-xl overflow-hidden mb-5">
                {/* Gradient placeholder while loading */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400" />

                {/* Actual image */}
                <img
                  src={imageUrl}
                  alt={cityName}
                  onLoad={() => setImageLoaded(true)}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* City name badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{cityFullName || cityName}</span>
                </div>
              </div>

              {/* Trip Name Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label
                    htmlFor="tripName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Name your trip
                  </label>
                  <input
                    type="text"
                    id="tripName"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder="My Paris Trip"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 outline-none transition-all"
                    autoFocus
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-200 dark:shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-300 dark:hover:shadow-purple-900/40 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Start Planning
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
