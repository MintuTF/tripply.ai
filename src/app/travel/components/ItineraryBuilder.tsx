'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Calendar,
  Plus,
  X,
  GripVertical,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
  Save,
  Loader2,
  Check,
} from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import type { TravelPlace, CityData } from '@/lib/travel/types';
import type { Card, CardType, Trip } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Unified item type for itinerary - can be a Card or a converted TravelPlace
interface ItineraryItem {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  duration?: string;
  categories: string[];
  type: CardType;
  isFromTrip: boolean; // true if from database Card, false if from savedPlaces
  originalCard?: Card; // Reference to original card if from database
}

interface ItineraryDay {
  id: string;
  dayNumber: number;
  items: ItineraryItem[];
}

interface ItineraryBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  tripId?: string | null;
  savedPlaces?: TravelPlace[];
  city?: CityData | null;
}

// Helper to get CardType from TravelPlace categories
function getCardType(categories: string[]): CardType {
  const cats = categories.map(c => c.toLowerCase());
  if (cats.some(c => c.includes('hotel') || c.includes('lodging'))) return 'hotel';
  if (cats.some(c => c.includes('restaurant') || c.includes('food') || c.includes('cafe') || c.includes('bar'))) return 'food';
  if (cats.some(c => c.includes('activity') || c.includes('tour'))) return 'activity';
  return 'spot';
}

// Convert TravelPlace to ItineraryItem
function placeToItem(place: TravelPlace): ItineraryItem {
  return {
    id: place.id,
    name: place.name,
    imageUrl: place.imageUrl,
    rating: place.rating,
    duration: place.duration,
    categories: place.categories,
    type: getCardType(place.categories),
    isFromTrip: false,
  };
}

// Convert Card to ItineraryItem
function cardToItem(card: Card): ItineraryItem {
  const payload = typeof card.payload_json === 'string'
    ? JSON.parse(card.payload_json)
    : card.payload_json;

  return {
    id: card.id,
    name: payload.name || 'Untitled',
    imageUrl: payload.photos?.[0] || payload.imageUrl || '',
    rating: payload.rating || 0,
    duration: payload.duration,
    categories: payload.categories || [],
    type: card.type,
    isFromTrip: true,
    originalCard: card,
  };
}

export function ItineraryBuilder({
  isOpen,
  onClose,
  tripId,
  savedPlaces = [],
  city,
}: ItineraryBuilderProps) {
  const { state, dispatch, fetchSavedPlacesData, setActiveTab } = useTravel();
  const { savedPlaceIds, savedPlacesData } = state;

  // Use passed savedPlaces or fall back to context
  const availablePlaces = savedPlaces.length > 0 ? savedPlaces : savedPlacesData;

  const [days, setDays] = useState<ItineraryDay[]>([
    { id: 'day-1', dayNumber: 1, items: [] },
  ]);
  const [unassignedItems, setUnassignedItems] = useState<ItineraryItem[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>('day-1');
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Trip selection and naming state
  const [existingTrips, setExistingTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(tripId || null);
  const [tripName, setTripName] = useState('');
  const [isNewTrip, setIsNewTrip] = useState(!tripId);

  // Date state - default to today and tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + (days.length || 1));

  const [startDate, setStartDate] = useState(today.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(tomorrow.toISOString().split('T')[0]);

  // Load data when builder opens
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);

      try {
        // Check for valid tripId (not null, undefined, or "null" string)
        const hasValidTripId = tripId && tripId !== 'null' && tripId !== 'undefined';

        if (hasValidTripId) {
          // Load cards from database
          const response = await fetch(`/api/cards?trip_id=${tripId}`);

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json();
              const cards: Card[] = data.cards || data || [];

              // Separate cards into assigned (have day) and unassigned
              const assigned = cards.filter(c => c.day && c.day > 0);
              const unassigned = cards.filter(c => !c.day || c.day === 0);

              // Group assigned cards by day
              const maxDay = assigned.length > 0
                ? Math.max(...assigned.map(c => c.day || 1))
                : 1;

              const initialDays: ItineraryDay[] = Array.from({ length: maxDay }, (_, i) => ({
                id: `day-${i + 1}`,
                dayNumber: i + 1,
                items: assigned
                  .filter(c => c.day === i + 1)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map(cardToItem),
              }));

              // Ensure at least one day exists
              if (initialDays.length === 0) {
                initialDays.push({ id: 'day-1', dayNumber: 1, items: [] });
              }

              setDays(initialDays);
              setUnassignedItems(unassigned.map(cardToItem));
              setLoading(false);
              return;
            }
          }

          // If API failed or returned non-JSON, fall back to saved places
          console.warn('Failed to load trip cards, falling back to saved places');
        }

        // No trip or failed to load - use saved places
        if (savedPlaceIds.length > 0 && availablePlaces.length === 0) {
          await fetchSavedPlacesData();
        }

        // All saved places start as unassigned
        setUnassignedItems(availablePlaces.map(placeToItem));
        setDays([{ id: 'day-1', dayNumber: 1, items: [] }]);
      } catch (error) {
        console.error('Error loading itinerary data:', error);
        // Fall back to saved places on error
        setUnassignedItems(availablePlaces.map(placeToItem));
        setDays([{ id: 'day-1', dayNumber: 1, items: [] }]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, tripId, savedPlaceIds.length, availablePlaces, fetchSavedPlacesData]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDays([{ id: 'day-1', dayNumber: 1, items: [] }]);
      setUnassignedItems([]);
      setExpandedDay('day-1');
      setShowUnassigned(true);
      setTripName('');
      setSelectedTripId(tripId || null);
      setIsNewTrip(!tripId);
    }
  }, [isOpen, tripId]);

  // Fetch user's existing trips when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchTrips = async () => {
      try {
        const response = await fetch('/api/trips');
        if (response.ok) {
          const data = await response.json();
          if (data.trips) {
            setExistingTrips(data.trips);
          }
        }
      } catch (error) {
        console.error('Failed to fetch trips:', error);
      }
    };

    fetchTrips();
  }, [isOpen]);

  const addDay = () => {
    const newDay: ItineraryDay = {
      id: `day-${days.length + 1}`,
      dayNumber: days.length + 1,
      items: [],
    };
    setDays([...days, newDay]);
    setExpandedDay(newDay.id);

    // Update end date to match new number of days
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + days.length); // +1 more day
    setEndDate(newEndDate.toISOString().split('T')[0]);
  };

  const removeDay = (dayId: string) => {
    if (days.length === 1) return;

    const dayToRemove = days.find(d => d.id === dayId);
    if (dayToRemove && dayToRemove.items.length > 0) {
      // Move items back to unassigned
      setUnassignedItems([...unassignedItems, ...dayToRemove.items]);
    }

    // Remove day and renumber remaining days
    const newDays = days
      .filter(d => d.id !== dayId)
      .map((d, i) => ({ ...d, dayNumber: i + 1, id: `day-${i + 1}` }));
    setDays(newDays);

    // Update end date to match new number of days
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + (newDays.length - 1));
    setEndDate(newEndDate.toISOString().split('T')[0]);
  };

  const addItemToDay = (dayId: string, item: ItineraryItem) => {
    setDays(
      days.map((day) =>
        day.id === dayId
          ? { ...day, items: [...day.items, item] }
          : day
      )
    );
    setUnassignedItems(unassignedItems.filter(i => i.id !== item.id));
  };

  const removeItemFromDay = (dayId: string, itemId: string) => {
    const day = days.find(d => d.id === dayId);
    const item = day?.items.find(i => i.id === itemId);

    if (item) {
      setUnassignedItems([...unassignedItems, item]);
    }

    setDays(
      days.map((day) =>
        day.id === dayId
          ? { ...day, items: day.items.filter(i => i.id !== itemId) }
          : day
      )
    );
  };

  const handleReorder = (dayId: string, newOrder: ItineraryItem[]) => {
    setDays(
      days.map((day) =>
        day.id === dayId ? { ...day, items: newOrder } : day
      )
    );
  };

  const getTotalItems = (): number => {
    return days.reduce((acc, day) => acc + day.items.length, 0);
  };

  const handleSaveItinerary = async () => {
    setSaving(true);

    try {
      // Use selectedTripId to determine if adding to existing trip
      const targetTripId = selectedTripId && selectedTripId !== 'null' && selectedTripId !== 'undefined' ? selectedTripId : null;

      if (targetTripId && !isNewTrip) {
        // Adding to existing trip - create new cards for that trip
        const totalItems = getTotalItems();
        if (totalItems === 0) {
          toast.error('Add at least one place to your itinerary');
          setSaving(false);
          return;
        }

        // Create cards for all items in the existing trip
        const allItems = days.flatMap((day, dayIndex) =>
          day.items.map((item, itemIndex) => ({
            trip_id: targetTripId,
            type: item.type,
            payload_json: {
              name: item.name,
              photos: item.imageUrl ? [item.imageUrl] : [],
              rating: item.rating,
              duration: item.duration,
              categories: item.categories,
            },
            labels: ['confirmed'],
            favorite: false,
            day: dayIndex + 1,
            order: itemIndex,
          }))
        );

        // Create cards in parallel
        await Promise.all(
          allItems.map(card =>
            fetch('/api/cards', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(card),
            })
          )
        );

        // Set as current trip and navigate to Board
        dispatch({ type: 'SET_CURRENT_TRIP_ID', payload: targetTripId });
        setActiveTab('board');

        const selectedTrip = existingTrips.find(t => t.id === targetTripId);
        toast.success(`Added to "${selectedTrip?.title || 'trip'}"!`);
      } else {
        // Create new trip with cards
        if (!city) {
          toast.error('No destination selected');
          setSaving(false);
          return;
        }

        // Check if there are items to save
        const totalItems = getTotalItems();
        if (totalItems === 0) {
          toast.error('Add at least one place to your itinerary');
          setSaving(false);
          return;
        }

        // Use custom trip name or generate default
        const finalTripName = tripName.trim() || `Trip to ${city.name}`;

        // Create trip first
        const tripResponse = await fetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: finalTripName,
            destination: {
              name: city.name,
              place_id: city.placeId,
              coordinates: city.coordinates,
            },
            dates: {
              start: startDate,
              end: endDate,
            },
          }),
        });

        if (!tripResponse.ok) {
          const errorText = await tripResponse.text();
          console.error('Trip creation failed:', errorText);
          throw new Error('Failed to create trip. Please sign in to save your itinerary.');
        }

        const contentType = tripResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Please sign in to save your itinerary.');
        }

        const response = await tripResponse.json();
        const newTrip = response.trip;

        if (!newTrip?.id) {
          throw new Error('Failed to create trip - no trip ID returned');
        }

        // Create cards for all items
        const allItems = days.flatMap((day, dayIndex) =>
          day.items.map((item, itemIndex) => ({
            trip_id: newTrip.id,
            type: item.type,
            payload_json: {
              name: item.name,
              photos: item.imageUrl ? [item.imageUrl] : [],
              rating: item.rating,
              duration: item.duration,
              categories: item.categories,
            },
            labels: ['confirmed'],
            favorite: false,
            day: dayIndex + 1,
            order: itemIndex,
          }))
        );

        // Create cards in parallel
        await Promise.all(
          allItems.map(card =>
            fetch('/api/cards', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(card),
            })
          )
        );

        // Set as current trip and navigate to Board
        dispatch({ type: 'SET_CURRENT_TRIP_ID', payload: newTrip.id });
        setActiveTab('board');
        toast.success(`"${finalTripName}" created!`);
      }

      onClose();
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast.error('Failed to save itinerary');
    } finally {
      setSaving(false);
    }
  };

  const exportItinerary = () => {
    const text = days
      .map((day) => {
        const itemsText = day.items
          .map((item, i) => `  ${i + 1}. ${item.name}${item.duration ? ` (${item.duration})` : ''}`)
          .join('\n');
        return `Day ${day.dayNumber}:\n${itemsText || '  No places added'}`;
      })
      .join('\n\n');

    const cityName = city?.name || 'My Trip';
    const blob = new Blob([`${cityName} Itinerary\n${'='.repeat(cityName.length + 10)}\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cityName.toLowerCase().replace(/\s+/g, '-')}-itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Slide-in Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Build Itinerary
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {days.length} day{days.length !== 1 ? 's' : ''} • {getTotalItems()} place{getTotalItems() !== 1 ? 's' : ''}
                    {unassignedItems.length > 0 && ` • ${unassignedItems.length} unassigned`}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Trip Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Add to Trip
                </label>
                <select
                  value={selectedTripId || 'new'}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setSelectedTripId(null);
                      setIsNewTrip(true);
                    } else {
                      setSelectedTripId(e.target.value);
                      setIsNewTrip(false);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="new">+ Create New Trip</option>
                  {existingTrips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trip Name Input - only for new trips */}
              {isNewTrip && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Trip Name
                  </label>
                  <input
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder={`Trip to ${city?.name || 'destination'}`}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              )}

              {/* Date Range Inputs - only for new trips */}
              {isNewTrip && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Unassigned Items Section */}
                  {unassignedItems.length > 0 && (
                    <div className="bg-amber-50 rounded-2xl overflow-hidden border border-amber-200">
                      <div
                        onClick={() => setShowUnassigned(!showUnassigned)}
                        className="w-full flex items-center justify-between p-4 hover:bg-amber-100 transition-colors cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setShowUnassigned(!showUnassigned);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
                            ?
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900">
                              Unassigned Places
                            </p>
                            <p className="text-sm text-amber-700">
                              {unassignedItems.length} places to schedule
                            </p>
                          </div>
                        </div>
                        {showUnassigned ? (
                          <ChevronUp className="w-5 h-5 text-amber-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-amber-600" />
                        )}
                      </div>

                      <AnimatePresence>
                        {showUnassigned && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-0 space-y-2 max-h-48 overflow-y-auto">
                              {unassignedItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm"
                                >
                                  <img
                                    src={item.imageUrl || '/placeholder-place.jpg'}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200';
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate text-sm">
                                      {item.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span className="capitalize">{item.type}</span>
                                      {item.rating > 0 && (
                                        <span className="flex items-center gap-0.5">
                                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                          {item.rating.toFixed(1)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {/* Quick add dropdown */}
                                  <select
                                    onChange={(e) => {
                                      const dayId = e.target.value;
                                      if (dayId) {
                                        addItemToDay(dayId, item);
                                        e.target.value = '';
                                      }
                                    }}
                                    className="text-xs bg-purple-100 text-purple-700 rounded-lg px-2 py-1 cursor-pointer hover:bg-purple-200"
                                    defaultValue=""
                                  >
                                    <option value="" disabled>Add to...</option>
                                    {days.map((day) => (
                                      <option key={day.id} value={day.id}>
                                        Day {day.dayNumber}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Days */}
                  {days.map((day) => (
                    <div
                      key={day.id}
                      className="bg-gray-50 rounded-2xl overflow-hidden"
                    >
                      {/* Day Header */}
                      <div
                        onClick={() =>
                          setExpandedDay(expandedDay === day.id ? null : day.id)
                        }
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setExpandedDay(expandedDay === day.id ? null : day.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                            {day.dayNumber}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900">
                              Day {day.dayNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {day.items.length} place{day.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {days.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDay(day.id);
                              }}
                              className="w-8 h-8 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                          {expandedDay === day.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Day Content */}
                      <AnimatePresence>
                        {expandedDay === day.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-0 space-y-3">
                              {day.items.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 text-sm">
                                  Add places from unassigned or drag to reorder
                                </p>
                              ) : (
                                <Reorder.Group
                                  axis="y"
                                  values={day.items}
                                  onReorder={(newOrder) =>
                                    handleReorder(day.id, newOrder)
                                  }
                                  className="space-y-2"
                                >
                                  {day.items.map((item, index) => (
                                    <Reorder.Item
                                      key={item.id}
                                      value={item}
                                      className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        {index + 1}
                                      </div>
                                      <img
                                        src={item.imageUrl || '/placeholder-place.jpg'}
                                        alt={item.name}
                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200';
                                        }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate text-sm">
                                          {item.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          {item.duration && (
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {item.duration}
                                            </span>
                                          )}
                                          {item.rating > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                              {item.rating.toFixed(1)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() =>
                                          removeItemFromDay(day.id, item.id)
                                        }
                                        className="w-7 h-7 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0"
                                      >
                                        <X className="w-4 h-4 text-red-500" />
                                      </button>
                                    </Reorder.Item>
                                  ))}
                                </Reorder.Group>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  {/* Add Day Button */}
                  <button
                    onClick={addDay}
                    className="w-full py-4 rounded-2xl bg-purple-100 text-purple-700 font-medium hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Day {days.length + 1}
                  </button>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={exportItinerary}
                disabled={getTotalItems() === 0}
                className={cn(
                  "py-3 px-4 rounded-xl border border-purple-200 text-purple-700 font-medium transition-colors flex items-center justify-center gap-2",
                  getTotalItems() === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-50"
                )}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleSaveItinerary}
                disabled={saving || getTotalItems() === 0}
                className={cn(
                  "flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium transition-all flex items-center justify-center gap-2",
                  (saving || getTotalItems() === 0) ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isNewTrip ? 'Create Trip' : 'Add to Trip'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
