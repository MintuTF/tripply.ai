'use client';

import { useState, useEffect } from 'react';
import { useTripContext } from '@/context/TripContext';
import { X, MapPin, Calendar, Users, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateTripContextDisplayText, getTripContextSummary } from '@/lib/marketplace/tripContextUtils';

interface TripContextModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TripContextModal({ isOpen, onClose }: TripContextModalProps) {
  const { trip, updateTrip } = useTripContext();

  // Form state
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Load current trip data
  useEffect(() => {
    if (trip) {
      setDestination(trip.destination?.name || trip.title || '');
      setStartDate(trip.dates?.start || '');
      setEndDate(trip.dates?.end || '');
      setAdults(trip.party_json?.adults || 2);
      setChildren((trip.party_json?.children || 0) + (trip.party_json?.infants || 0));
    }
  }, [trip]);

  const handleSave = () => {
    if (!updateTrip) {
      console.warn('updateTrip not available');
      onClose();
      return;
    }

    // Update trip context
    const updates = {
      title: destination,
      destination: {
        name: destination,
        coordinates: trip?.destination?.coordinates,
      },
      dates: startDate && endDate ? { start: startDate, end: endDate } : undefined,
      party_json: {
        adults,
        children,
        infants: 0,
      },
    };

    updateTrip(updates);
    onClose();
  };

  // Preview text for the updated context
  const previewSummary = getTripContextSummary({
    ...trip,
    title: destination,
    destination: { name: destination },
    dates: startDate && endDate ? { start: startDate, end: endDate } : undefined,
    party_json: { adults, children, infants: 0 },
  } as any);

  const previewText = generateTripContextDisplayText(previewSummary);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-sky-50 to-purple-50 border-b border-purple-100 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Trip Details
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Update your trip to refine recommendations
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 p-2 rounded-full hover:bg-white/80 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="px-6 py-6 space-y-5">
                {/* Destination */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    Destination
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g., Tokyo, Paris, New York"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Travelers */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Users className="w-4 h-4 text-purple-500" />
                    Travelers
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Adults */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs font-medium text-gray-600 mb-2">Adults</div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-purple-300 flex items-center justify-center text-gray-700 font-semibold transition-colors"
                        >
                          −
                        </button>
                        <span className="text-lg font-semibold text-gray-900 min-w-[2ch] text-center">
                          {adults}
                        </span>
                        <button
                          onClick={() => setAdults(Math.min(10, adults + 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-purple-300 flex items-center justify-center text-gray-700 font-semibold transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs font-medium text-gray-600 mb-2">Children</div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-purple-300 flex items-center justify-center text-gray-700 font-semibold transition-colors"
                        >
                          −
                        </button>
                        <span className="text-lg font-semibold text-gray-900 min-w-[2ch] text-center">
                          {children}
                        </span>
                        <button
                          onClick={() => setChildren(Math.min(10, children + 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-purple-300 flex items-center justify-center text-gray-700 font-semibold transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {destination && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-purple-700 mb-1">
                          Preview
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {previewText}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!destination}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
