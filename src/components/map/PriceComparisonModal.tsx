'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Loader2, AlertCircle, CheckCircle, ChevronDown, Users2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HotelPriceOffer } from '@/app/api/hotels/price-comparison/route';

interface PriceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelName: string;
  location: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  propertyToken?: string; // SerpAPI property token
}

export function PriceComparisonModal({
  isOpen,
  onClose,
  hotelName,
  location,
  checkIn,
  checkOut,
  adults = 2,
  propertyToken,
}: PriceComparisonModalProps) {
  const [offers, setOffers] = useState<HotelPriceOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'mock' | 'serpapi' | null>(null);

  // Interactive filters
  const [selectedCheckIn, setSelectedCheckIn] = useState(checkIn);
  const [selectedCheckOut, setSelectedCheckOut] = useState(checkOut);
  const [selectedAdults, setSelectedAdults] = useState(adults);
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  // Reset filters when modal opens with new props
  useEffect(() => {
    if (isOpen) {
      setSelectedCheckIn(checkIn);
      setSelectedCheckOut(checkOut);
      setSelectedAdults(adults);
      setFreeCancellationOnly(false);
    }
  }, [isOpen, checkIn, checkOut, adults]);

  useEffect(() => {
    if (isOpen) {
      fetchPriceComparison();
    }
  }, [isOpen, hotelName, location, selectedCheckIn, selectedCheckOut, selectedAdults, propertyToken]);

  const fetchPriceComparison = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        hotel_name: hotelName,
        check_in: selectedCheckIn,
        check_out: selectedCheckOut,
        adults: selectedAdults.toString(),
      });

      if (propertyToken) {
        params.append('property_token', propertyToken);
      }
      if (location) {
        params.append('location', location);
      }

      const response = await fetch(`/api/hotels/price-comparison?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch price comparison');
      }

      const data = await response.json();
      setOffers(data.offers || []);
      setDataSource(data.source);
    } catch (err) {
      console.error('Price comparison error:', err);
      setError('Unable to load price comparison. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderClick = (url: string, provider: string) => {
    // Track click (could add analytics here)
    console.log(`User clicked ${provider}: ${url}`);

    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Format dates for display
  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${day}, ${monthDay}`;
  };

  // Filter offers by free cancellation if toggle is on
  const filteredOffers = freeCancellationOnly
    ? offers.filter(offer => offer.free_cancellation)
    : offers;

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
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-lg max-h-[85vh] bg-background rounded-2xl shadow-2xl border-2 border-border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-border p-6 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-1">{hotelName}</h2>
                  <p className="text-sm text-muted-foreground">Compare prices</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full hover:bg-muted p-2 transition-colors flex-shrink-0"
                >
                  <X className="h-6 w-6 text-foreground" />
                </button>
              </div>
            </div>

            {/* Date & Guest Filters */}
            <div className="border-b border-border p-4 flex-shrink-0 space-y-3">
              {/* Check in / Check out label */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Check in / Check out
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={freeCancellationOnly}
                      onChange={(e) => setFreeCancellationOnly(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Free cancellation only
                  </label>
                </div>
              </div>

              {/* Date and Guest Selectors */}
              <div className="flex items-center gap-2">
                {/* Check-in Date */}
                <div className="flex-1 relative">
                  <input
                    type="date"
                    value={selectedCheckIn}
                    onChange={(e) => setSelectedCheckIn(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:border-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                    style={{
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield',
                    }}
                  />
                </div>

                {/* Check-out Date */}
                <div className="flex-1 relative">
                  <input
                    type="date"
                    value={selectedCheckOut}
                    onChange={(e) => setSelectedCheckOut(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:border-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                    style={{
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield',
                    }}
                  />
                </div>

                {/* Guest Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowGuestPicker(!showGuestPicker)}
                    className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:border-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors flex items-center gap-2 min-w-[80px]"
                  >
                    <Users2 className="h-4 w-4" />
                    {selectedAdults}
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Guest Picker Dropdown */}
                  {showGuestPicker && (
                    <div className="absolute top-full mt-1 right-0 bg-background border border-border rounded-lg shadow-lg p-3 z-10 min-w-[180px]">
                      <label className="block text-xs text-muted-foreground mb-2">Number of guests</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedAdults(Math.max(1, selectedAdults - 1))}
                          className="px-3 py-1 rounded bg-muted hover:bg-muted/80 text-foreground font-medium"
                        >
                          −
                        </button>
                        <span className="flex-1 text-center font-medium">{selectedAdults}</span>
                        <button
                          onClick={() => setSelectedAdults(Math.min(8, selectedAdults + 1))}
                          className="px-3 py-1 rounded bg-muted hover:bg-muted/80 text-foreground font-medium"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => setShowGuestPicker(false)}
                        className="mt-3 w-full px-3 py-1.5 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Comparing prices...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                  <p className="text-sm text-foreground font-medium mb-2">Unable to load prices</p>
                  <p className="text-xs text-muted-foreground text-center px-4 mb-4">{error}</p>
                  <button
                    onClick={fetchPriceComparison}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredOffers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-foreground font-medium">No prices available</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {freeCancellationOnly
                      ? 'No offers with free cancellation. Try unchecking the filter.'
                      : 'Try different dates'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Data Source Notice */}
                  {dataSource === 'mock' && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Showing estimated prices. Configure SerpAPI for live pricing from multiple providers.</span>
                      </p>
                    </div>
                  )}
                  {dataSource === 'serpapi' && (
                    <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-800 dark:text-green-200 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Live prices from Google Hotels via SerpAPI</span>
                      </p>
                    </div>
                  )}

                  {/* Provider List */}
                  {filteredOffers.map((offer, index) => (
                    <motion.button
                      key={`${offer.provider}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleProviderClick(offer.url, offer.provider)}
                      className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      {/* Left: Provider Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Provider Logo Placeholder */}
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {offer.provider.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Provider Details */}
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground text-base truncate">
                              {offer.provider}
                            </p>
                            {offer.official_site && (
                              <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                                Official site
                              </span>
                            )}
                          </div>
                          {offer.deal && (
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-0.5">
                              {offer.deal}
                            </p>
                          )}
                          {offer.free_cancellation && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                              Free cancellation
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            ${offer.priceWithTaxes} with taxes + fees
                          </p>
                        </div>
                      </div>

                      {/* Right: Price + Arrow */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            ${offer.price}
                          </p>
                        </div>
                        <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </motion.button>
                  ))}

                  {/* Footer Note */}
                  <p className="text-xs text-center text-muted-foreground pt-4 border-t border-border mt-4">
                    Prices may vary. Click to check availability and final pricing.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
