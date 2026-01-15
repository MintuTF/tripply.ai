'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Sparkles, Map, Calendar, Share2, Download, X, Check, AlertCircle } from 'lucide-react';
import { PlanHero, TripOverview } from '@/components/plan-page';
import type { Activity, DayPlan } from '@/components/plan-page';
import { ItineraryMapView } from '@/components/plan-page/ItineraryMapView';
import { DraggableDayTimeline } from '@/components/itinerary/DraggableDayTimeline';
import SaveIndicator from '@/components/itinerary/SaveIndicator';
import { TimeSlotPicker } from '@/components/itinerary/TimeSlotPicker';
import { ConflictModal } from '@/components/itinerary/ConflictModal';
import { useAutoSave } from '@/hooks/useAutoSave';
import { validateCardUpdate } from '@/lib/utils/validation';
import type { Trip, Card, ConflictInfo } from '@/types';

// Toast notification component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-card border border-border rounded-xl shadow-lg"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
        <Check className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">{message}</span>
      <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// Transform Card to Activity format
function cardToActivity(card: Card, dayNumber?: number): Activity {
  const payload = card.payload_json as any;

  return {
    id: card.id,
    name: payload.name || payload.title || 'Untitled',
    type: card.type === 'hotel' ? 'hotel' :
          card.type === 'food' ? 'restaurant' :
          card.type === 'activity' ? 'attraction' :
          card.type === 'spot' ? 'culture' : 'other',
    startTime: card.time_slot || '',
    endTime: '',
    location: payload.location || payload.address || '',
    coordinates: payload.coordinates || { lat: 0, lng: 0 },
    estimatedCost: payload.price || payload.cost || 0,
    notes: payload.notes || payload.description || '',
    image: payload.image || payload.photos?.[0] || '',
    isBooked: card.labels?.includes('confirmed') || false,
  };
}

function ItineraryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = searchParams.get('trip_id');

  const [trip, setTrip] = useState<Trip | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [days, setDays] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Initialize auto-save hook
  const autoSave = useAutoSave({
    tripId: tripId || '',
    onError: (error) => {
      showToast(`Save error: ${error}`);
    },
    onConflict: (detectedConflicts) => {
      setConflicts(detectedConflicts);
      setShowConflictModal(true);
    },
    onSuccess: () => {
      // Optionally show success toast, but SaveIndicator already shows this
    },
  });

  // Fetch trip and cards data
  useEffect(() => {
    async function fetchData() {
      if (!tripId) {
        setError('No trip ID provided. Please select a trip.');
        setLoading(false);
        return;
      }

      try {
        // Fetch trip data
        const tripResponse = await fetch(`/api/trips/${tripId}`);
        if (!tripResponse.ok) {
          throw new Error('Failed to load trip');
        }
        const tripData = await tripResponse.json();
        const trip = tripData.trip;
        setTrip(trip);

        // Fetch cards for this trip
        const cardsResponse = await fetch(`/api/cards?trip_id=${tripId}`);
        if (!cardsResponse.ok) {
          throw new Error('Failed to load activities');
        }
        const cardsData = await cardsResponse.json();
        const fetchedCards = cardsData.cards || [];
        setCards(fetchedCards);

        // Calculate number of days
        const start = new Date(trip.start_date);
        const end = new Date(trip.end_date);
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Group cards by day
        const dayPlans: DayPlan[] = [];
        for (let i = 0; i < totalDays; i++) {
          const currentDate = new Date(start);
          currentDate.setDate(start.getDate() + i);
          const dateString = currentDate.toISOString().split('T')[0];

          // Get cards for this day
          const dayCards = fetchedCards
            .filter(card => card.day === i + 1)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

          const activities = dayCards.map(card => cardToActivity(card, i + 1));

          dayPlans.push({
            date: dateString,
            dayNumber: i + 1,
            activities,
            notes: '',
          });
        }

        setDays(dayPlans);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching itinerary data:', err);
        setError(err.message || 'Failed to load itinerary');
        setLoading(false);
      }
    }

    fetchData();
  }, [tripId]);

  // Separate unscheduled activities
  const unscheduledActivities = cards
    .filter(card => !card.day)
    .map(card => cardToActivity(card));

  // Drag and drop handlers
  const handleDayChange = useCallback((activityId: string, newDay: number, newOrder: number) => {
    // Find the card
    const cardIndex = cards.findIndex(c => c.id === activityId);
    if (cardIndex === -1) return;

    const card = cards[cardIndex];

    // Validate the update
    const validation = validateCardUpdate(card, { day: newDay, order: newOrder }, cards);

    // Show errors if validation failed
    if (!validation.valid) {
      showToast(`Error: ${validation.errors.join(', ')}`);
      return;
    }

    // Update local state optimistically
    const updatedCards = [...cards];
    updatedCards[cardIndex] = {
      ...card,
      day: newDay,
      order: newOrder,
    };
    setCards(updatedCards);

    // Update days state
    const newDays = days.map((day, idx) => {
      if (day.dayNumber === newDay) {
        // Add to new day
        const newActivity = cardToActivity(updatedCards[cardIndex], newDay);
        return {
          ...day,
          activities: [...day.activities, newActivity],
        };
      } else if (day.activities.some(a => a.id === activityId)) {
        // Remove from old day
        return {
          ...day,
          activities: day.activities.filter(a => a.id !== activityId),
        };
      }
      return day;
    });
    setDays(newDays);

    // Queue auto-save with critical priority
    autoSave.queueChange(activityId, { day: newDay, order: newOrder }, 'critical');

    showToast(`Activity moved to Day ${newDay}`);
  }, [cards, days, autoSave, showToast]);

  const handleReorder = useCallback((dayNumber: number, activityIds: string[]) => {
    // Update order for all cards in the day
    const updates: { id: string; order: number }[] = [];

    activityIds.forEach((id, index) => {
      const card = cards.find(c => c.id === id);
      if (card) {
        updates.push({ id, order: index });
      }
    });

    // Update local state
    const updatedCards = cards.map(card => {
      const update = updates.find(u => u.id === card.id);
      if (update) {
        return { ...card, order: update.order };
      }
      return card;
    });
    setCards(updatedCards);

    // Update days state
    const newDays = days.map(day => {
      if (day.dayNumber === dayNumber) {
        const reorderedActivities = activityIds
          .map(id => day.activities.find(a => a.id === id))
          .filter((a): a is Activity => a !== undefined);
        return { ...day, activities: reorderedActivities };
      }
      return day;
    });
    setDays(newDays);

    // Queue auto-save for all reordered cards
    updates.forEach(update => {
      autoSave.queueChange(update.id, { order: update.order }, 'critical');
    });

    showToast(`Day ${dayNumber} activities reordered`);
  }, [cards, days, autoSave, showToast]);

  const handleUnschedule = useCallback((activityId: string) => {
    // Find and update the card
    const cardIndex = cards.findIndex(c => c.id === activityId);
    if (cardIndex === -1) return;

    const card = cards[cardIndex];
    const updatedCards = [...cards];
    updatedCards[cardIndex] = {
      ...card,
      day: undefined,
      order: undefined,
      time_slot: undefined,
    };
    setCards(updatedCards);

    // Update days state
    const newDays = days.map(day => ({
      ...day,
      activities: day.activities.filter(a => a.id !== activityId),
    }));
    setDays(newDays);

    // Queue auto-save
    autoSave.queueChange(activityId, { day: null, order: null, time_slot: null }, 'critical');

    showToast('Activity unscheduled');
  }, [cards, days, autoSave, showToast]);

  const tripData = trip ? {
    destination: typeof trip.destination === 'object' && trip.destination?.name
      ? trip.destination.name
      : trip.destination,
    startDate: trip.start_date,
    endDate: trip.end_date,
    travelers: 2, // TODO: Get from trip data
    totalDays: days.length,
    activitiesCount: days.reduce((sum, d) => sum + d.activities.length, 0),
    weather: {
      temp: 18,
      condition: 'sunny' as const,
    },
  } : null;

  const stats = {
    totalDays: days.length,
    plannedActivities: days.reduce((sum, d) => sum + d.activities.length, 0),
    bookedActivities: days.reduce((sum, d) => sum + d.activities.filter(a => a.isBooked).length, 0),
    estimatedBudget: 2500,
    spentBudget: days.reduce((sum, d) => sum + d.activities.reduce((s, a) => s + (a.estimatedCost || 0), 0), 0),
    travelTime: '~3 hours',
    completionPercentage: Math.round((days.filter(d => d.activities.length > 0).length / days.length) * 100),
  };

  const handleAddActivity = useCallback((dayIndex: number) => {
    showToast(`Add activity feature coming soon for Day ${dayIndex + 1}`);
  }, [showToast]);

  const handleEditActivity = useCallback((dayIndex: number, activityId: string) => {
    setSelectedActivityId(activityId);
    setTimePickerOpen(true);
  }, []);

  const handleTimeSelect = useCallback((timeSlot: string) => {
    if (!selectedActivityId) return;

    // Find the card
    const cardIndex = cards.findIndex(c => c.id === selectedActivityId);
    if (cardIndex === -1) return;

    const card = cards[cardIndex];

    // Validate the update
    const validation = validateCardUpdate(card, { time_slot: timeSlot }, cards);

    // Show errors if validation failed
    if (!validation.valid) {
      showToast(`Error: ${validation.errors.join(', ')}`);
      return;
    }

    // Update local state optimistically
    const updatedCards = [...cards];
    updatedCards[cardIndex] = {
      ...card,
      time_slot: timeSlot,
    };
    setCards(updatedCards);

    // Update days state
    const newDays = days.map(day => ({
      ...day,
      activities: day.activities.map(activity =>
        activity.id === selectedActivityId
          ? { ...activity, startTime: timeSlot }
          : activity
      ),
    }));
    setDays(newDays);

    // Queue auto-save with medium priority (2s debounce for time changes)
    autoSave.queueChange(selectedActivityId, { time_slot: timeSlot }, 'medium');

    // Format time for display (convert 24h to 12h)
    const [hour, minute] = timeSlot.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const formattedTime = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;

    // Show warnings if any
    if (validation.warnings.length > 0) {
      showToast(`⚠️ ${validation.warnings[0]}`);
    } else {
      showToast(`Time set to ${formattedTime}`);
    }
  }, [selectedActivityId, cards, days, autoSave, showToast]);

  const handleShare = useCallback(() => {
    // Copy current URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    showToast('Itinerary link copied to clipboard!');
  }, [showToast]);

  const handleExport = useCallback(() => {
    showToast('Export feature coming soon');
  }, [showToast]);

  const handleOptimizeRoute = useCallback((dayNumber: number, optimizedOrder: string[]) => {
    setDays(prevDays => {
      return prevDays.map(day => {
        if (day.dayNumber !== dayNumber) return day;

        // Reorder activities based on optimized order
        const activityMap = new Map(day.activities.map(a => [a.id, a]));
        const reorderedActivities = optimizedOrder
          .map(id => activityMap.get(id))
          .filter((a): a is Activity => a !== undefined);

        return {
          ...day,
          activities: reorderedActivities,
        };
      });
    });

    showToast(`Day ${dayNumber} route optimized successfully!`);
  }, [showToast]);

  const handleAiSuggest = useCallback(() => {
    showToast('AI suggestions feature coming soon');
  }, [showToast]);

  const handleResolveConflicts = useCallback(async (resolutions: Record<string, 'mine' | 'theirs'>) => {
    // Process each resolution
    for (const conflict of conflicts) {
      const resolution = resolutions[conflict.cardId];

      if (resolution === 'mine') {
        // Force save with user's version
        // The auto-save system will retry with conflict flag
        autoSave.forceSave();
      } else {
        // Use server version - fetch latest data for this card
        try {
          const response = await fetch(`/api/cards/${conflict.cardId}`);
          if (response.ok) {
            const serverCard: Card = await response.json();

            // Update local state with server version
            setCards(prevCards =>
              prevCards.map(c => c.id === conflict.cardId ? serverCard : c)
            );

            // Update days state
            const cardActivity = cardToActivity(serverCard);
            setDays(prevDays =>
              prevDays.map(day => ({
                ...day,
                activities: day.activities.map(activity =>
                  activity.id === conflict.cardId ? cardActivity : activity
                ),
              }))
            );
          }
        } catch (error) {
          console.error('Failed to fetch server version:', error);
          showToast('Failed to fetch server version for some conflicts');
        }
      }
    }

    // Clear conflicts
    setConflicts([]);
    setShowConflictModal(false);
    showToast(`${conflicts.length} conflict(s) resolved`);
  }, [conflicts, autoSave, showToast]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="text-muted-foreground font-medium">Loading your itinerary...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !trip || !tripData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 max-w-md mx-auto px-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Failed to Load Itinerary</h2>
          <p className="text-center text-muted-foreground">{error || 'Unable to load trip data'}</p>
          <button
            onClick={() => router.push('/trips')}
            className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Go to My Trips
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <PlanHero
        trip={tripData}
        onShare={handleShare}
        onExport={handleExport}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Day Timeline - Main Content */}
          <div className="flex-1 lg:w-2/3">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold text-foreground"
                >
                  Your Itinerary
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  {/* Save Indicator */}
                  <SaveIndicator
                    status={autoSave.status}
                    onRetry={autoSave.forceSave}
                    onResolveConflicts={() => setShowConflictModal(true)}
                  />

                  <button
                    onClick={() => setShowMap(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-medium transition-colors"
                  >
                    <Map className="h-4 w-4" />
                    <span className="hidden sm:inline">View Map</span>
                  </button>
                  <button
                    onClick={handleAiSuggest}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">AI Fill</span>
                  </button>
                </motion.div>
              </div>
            </div>

            {days.length > 0 ? (
              <DraggableDayTimeline
                days={days}
                unscheduledActivities={unscheduledActivities}
                allCards={cards}
                onDayChange={handleDayChange}
                onReorder={handleReorder}
                onUnschedule={handleUnschedule}
                onAddActivity={handleAddActivity}
                onEditActivity={handleEditActivity}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-border bg-accent/20"
              >
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Days Planned Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start planning your trip by adding activities to each day
                </p>
                <button
                  onClick={() => handleAddActivity(0)}
                  className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  Add First Activity
                </button>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Trip Overview */}
          <aside className="lg:w-1/3">
            <div className="sticky top-4">
              <TripOverview
                destination={tripData.destination}
                startDate={tripData.startDate}
                endDate={tripData.endDate}
                travelers={tripData.travelers}
                stats={stats}
                onOptimizeRoute={handleOptimizeRoute}
                onAiSuggest={handleAiSuggest}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Floating Action Button - Mobile */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow"
        onClick={() => showToast('Add activity feature coming soon')}
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Map Modal */}
      <AnimatePresence>
        {showMap && (
          <ItineraryMapView
            days={days}
            onClose={() => setShowMap(false)}
            onOptimizeDay={handleOptimizeRoute}
          />
        )}
      </AnimatePresence>

      {/* Time Slot Picker Modal */}
      <TimeSlotPicker
        isOpen={timePickerOpen}
        onClose={() => {
          setTimePickerOpen(false);
          setSelectedActivityId(null);
        }}
        onSelect={handleTimeSelect}
        currentTime={selectedActivityId ? cards.find(c => c.id === selectedActivityId)?.time_slot : undefined}
        title="Set Activity Time"
        description="Choose when this activity will start"
      />

      {/* Conflict Resolution Modal */}
      <ConflictModal
        conflicts={conflicts}
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onResolve={handleResolveConflicts}
      />
    </div>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <p className="text-muted-foreground font-medium">Building your itinerary...</p>
          </motion.div>
        </div>
      }
    >
      <ItineraryContent />
    </Suspense>
  );
}
