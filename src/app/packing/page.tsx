'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  ShoppingBag,
  Sparkles,
  MapPin,
  Calendar,
  ChevronRight,
  Download,
  Share2,
  RefreshCw,
  Loader2,
  Check,
  X,
  Sun,
  Cloud,
  Snowflake,
  Umbrella,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PackingList, PackingContext, TripType, WeatherCondition } from '@/types/packing';
import { generatePackingList, getItemsForTemperature } from '@/lib/packing/generator';
import { savePackingList, loadPackingLists, getCurrentList, setCurrentList } from '@/lib/packing/storage';
import { PackingListView } from '@/components/packing';

// Trip type options
const TRIP_TYPES: { id: TripType; name: string; icon: string }[] = [
  { id: 'leisure', name: 'Leisure', icon: 'palm-tree' },
  { id: 'business', name: 'Business', icon: 'briefcase' },
  { id: 'adventure', name: 'Adventure', icon: 'mountain' },
  { id: 'beach', name: 'Beach', icon: 'sun' },
  { id: 'city', name: 'City', icon: 'building' },
  { id: 'nature', name: 'Nature', icon: 'tree' },
  { id: 'family', name: 'Family', icon: 'users' },
  { id: 'romantic', name: 'Romantic', icon: 'heart' },
];

// Weather icons
const WEATHER_ICONS: Record<string, React.ReactNode> = {
  hot: <Sun className="h-4 w-4 text-amber-500" />,
  warm: <Sun className="h-4 w-4 text-amber-400" />,
  mild: <Cloud className="h-4 w-4 text-blue-400" />,
  cold: <Snowflake className="h-4 w-4 text-blue-500" />,
  rainy: <Umbrella className="h-4 w-4 text-blue-600" />,
};

// Toast component
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

function PackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params
  const destinationParam = searchParams.get('destination');
  const durationParam = searchParams.get('duration');
  const tripTypeParam = searchParams.get('type') as TripType | null;

  // State
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Generator form state
  const [destination, setDestination] = useState(destinationParam || '');
  const [duration, setDuration] = useState(durationParam ? parseInt(durationParam) : 5);
  const [tripType, setTripType] = useState<TripType>(tripTypeParam || 'leisure');
  const [avgTemp, setAvgTemp] = useState(20);
  const [activities, setActivities] = useState<string[]>([]);

  // Load existing list or generate new one
  useEffect(() => {
    const existingList = getCurrentList();
    if (existingList) {
      setPackingList(existingList);
    } else if (destinationParam) {
      // Auto-generate if destination provided
      setShowGenerator(true);
    } else {
      setShowGenerator(true);
    }
  }, [destinationParam]);

  // Show toast helper
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Generate packing list
  const handleGenerate = useCallback(() => {
    if (!destination.trim()) {
      showToast('Please enter a destination');
      return;
    }

    setIsGenerating(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const context: PackingContext = {
        destination: destination.trim(),
        duration,
        tripType,
        weather: {
          avgTemp,
          conditions: getItemsForTemperature(avgTemp),
        },
        activities: activities.length > 0 ? activities : undefined,
      };

      const newList = generatePackingList(context);
      setPackingList(newList);
      savePackingList(newList);
      setCurrentList(newList.id);
      setShowGenerator(false);
      setIsGenerating(false);
      showToast('Packing list generated!');
    }, 1500);
  }, [destination, duration, tripType, avgTemp, activities, showToast]);

  // Update list
  const handleUpdateList = useCallback((updatedList: PackingList) => {
    setPackingList(updatedList);
    savePackingList(updatedList);
  }, []);

  // Share list
  const handleShare = useCallback(() => {
    if (packingList) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!');
    }
  }, [packingList, showToast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Voyagr</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/marketplace"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                Shop Gear
              </Link>
              <Link
                href="/trips"
                className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                My Trips
              </Link>
              <Link
                href="/plan"
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Plan Trip
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {packingList ? packingList.name : 'Smart Packing List'}
                </h1>
                {packingList && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {packingList.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {packingList.duration} days
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Generator Card */}
          <AnimatePresence mode="wait">
            {showGenerator && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card rounded-2xl border border-border p-6 mb-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Generate Smart Packing List</h2>
                    <p className="text-sm text-muted-foreground">
                      AI-powered recommendations based on your trip
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Destination */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Destination</label>
                    <input
                      type="text"
                      placeholder="Where are you going?"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  {/* Duration & Temperature */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Duration (days)</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Avg Temperature</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={-10}
                          max={40}
                          value={avgTemp}
                          onChange={(e) => setAvgTemp(parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="w-12 text-center font-medium">{avgTemp}°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Trip Type</label>
                    <div className="flex flex-wrap gap-2">
                      {TRIP_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setTripType(type.id)}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            tripType === type.id
                              ? 'bg-primary text-white'
                              : 'bg-accent hover:bg-accent/80'
                          )}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activities */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Activities (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., hiking, beach, photography"
                      value={activities.join(', ')}
                      onChange={(e) =>
                        setActivities(
                          e.target.value
                            .split(',')
                            .map((a) => a.trim())
                            .filter(Boolean)
                        )
                      }
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !destination.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating your list...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Generate Packing List
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Packing List View */}
          {packingList && !showGenerator && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Action buttons */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setShowGenerator(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent/80 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  New List
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent/80 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <Link
                    href="/marketplace"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Shop All Gear
                  </Link>
                </div>
              </div>

              {/* List */}
              <PackingListView list={packingList} onUpdateList={handleUpdateList} />

              {/* Shop CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-2xl p-6 border border-border/50 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-4">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Need travel gear?</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Browse our curated collection of travel essentials with Amazon affiliate links.
                </p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Shop Travel Gear
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Toast */}
      <AnimatePresence>{toast && <Toast message={toast} onClose={() => setToast(null)} />}</AnimatePresence>
    </div>
  );
}

export default function PackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Loading packing list...</p>
          </motion.div>
        </div>
      }
    >
      <PackingContent />
    </Suspense>
  );
}
