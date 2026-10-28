'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserMenu } from '@/components/auth/UserMenu';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { Trip, TripStatus } from '@/types';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Calendar,
  Users,
  MapPin,
  Loader2,
  LayoutGrid,
  List,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Archive,
  Check,
  Clock,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore } from 'date-fns';

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'name' | 'upcoming';

// Trip Section Component
interface TripSectionProps {
  title?: string;
  icon?: React.ReactNode;
  trips: Trip[];
  viewMode: ViewMode;
  getEffectiveStatus: (trip: Trip) => TripStatus;
  onStatusUpdate: (tripId: string, status: TripStatus) => void;
  onDelete: (trip: Trip) => void;
  showReopenButton?: boolean;
}

function TripSection({
  title,
  icon,
  trips,
  viewMode,
  getEffectiveStatus,
  onStatusUpdate,
  onDelete,
  showReopenButton,
}: TripSectionProps) {
  if (trips.length === 0) return null;

  const STATUS_CONFIG: Record<TripStatus, { label: string; color: string }> = {
    planning: { label: 'Planning', color: 'bg-blue-500/10 text-blue-600' },
    in_progress: { label: 'In Progress', color: 'bg-green-500/10 text-green-600' },
    completed: { label: 'Completed', color: 'bg-gray-500/10 text-gray-600' },
    archived: { label: 'Archived', color: 'bg-gray-500/10 text-gray-500' },
  };

  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">({trips.length})</span>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const status = getEffectiveStatus(trip);
            const statusConfig = STATUS_CONFIG[status];
            return (
              <div
                key={trip.id}
                className={cn(
                  'group block rounded-2xl border bg-card overflow-hidden',
                  'hover:border-primary/50 hover:shadow-xl transition-all duration-300'
                )}
              >
                <Link href={`/trips/${trip.id}`}>
                  {/* Card Header with gradient */}
                  <div className="h-24 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 relative">
                    <div
                      className={cn(
                        'absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium',
                        statusConfig.color
                      )}
                    >
                      {statusConfig.label}
                    </div>
                    {trip.destination?.name && (
                      <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-foreground/70">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {trip.destination.name.split(',')[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors">
                      {trip.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {trip.dates?.start && trip.dates?.end && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(trip.dates.start), 'MMM d')} -{' '}
                            {format(new Date(trip.dates.end), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      {trip.party_json && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>
                            {trip.party_json.adults +
                              (trip.party_json.children || 0) +
                              (trip.party_json.infants || 0)}{' '}
                            travelers
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="px-5 pb-4 flex items-center gap-4">
                  {showReopenButton && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onStatusUpdate(trip.id, 'planning');
                      }}
                      className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reopen Trip
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(trip);
                    }}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors ml-auto"
                    title="Delete trip"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => {
            const status = getEffectiveStatus(trip);
            const statusConfig = STATUS_CONFIG[status];
            return (
              <div
                key={trip.id}
                className={cn(
                  'flex items-center gap-6 p-5 rounded-xl border bg-card',
                  'hover:border-primary/50 hover:shadow-lg transition-all'
                )}
              >
                <Link href={`/trips/${trip.id}`} className="flex items-center gap-6 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold truncate">{trip.title}</h3>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                          statusConfig.color
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {trip.destination?.name && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">
                            {trip.destination.name}
                          </span>
                        </div>
                      )}
                      {trip.dates?.start && trip.dates?.end && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(trip.dates.start), 'MMM d')} -{' '}
                            {format(new Date(trip.dates.end), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      {trip.party_json && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>
                            {trip.party_json.adults} adult
                            {trip.party_json.adults > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {showReopenButton && (
                    <button
                      onClick={() => onStatusUpdate(trip.id, 'planning')}
                      className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reopen
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(trip)}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
                    title="Delete trip"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TripsPage() {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch user's trips
    fetch('/api/trips')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setTrips(data.trips || []);
        }
      })
      .catch((err) => {
        setError('Failed to load trips');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  // Filter and sort trips
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (trip) =>
          trip.title.toLowerCase().includes(query) ||
          trip.destination?.name?.toLowerCase().includes(query)
      );
    }

    // Sort trips
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'upcoming':
          const aDate = a.dates?.start ? new Date(a.dates.start) : new Date(0);
          const bDate = b.dates?.start ? new Date(b.dates.start) : new Date(0);
          const now = new Date();
          const aUpcoming = isAfter(aDate, now) ? aDate.getTime() : Infinity;
          const bUpcoming = isAfter(bDate, now) ? bDate.getTime() : Infinity;
          return aUpcoming - bUpcoming;
        default:
          return 0;
      }
    });

    return result;
  }, [trips, searchQuery, sortBy]);

  // Calculate effective status (combines stored status + auto-detection from dates)
  const getEffectiveStatus = (trip: Trip): TripStatus => {
    // If manually archived or completed, keep it
    if (trip.status === 'archived') return 'archived';
    if (trip.status === 'completed') return 'completed';

    // Auto-detect based on dates
    if (!trip.dates?.start || !trip.dates?.end) return trip.status || 'planning';

    const now = new Date();
    const start = new Date(trip.dates.start);
    const end = new Date(trip.dates.end);

    if (isAfter(now, end)) return 'completed';
    if (isAfter(now, start) && isBefore(now, end)) return 'in_progress';
    return 'planning';
  };

  // Group trips by status section
  const tripsBySection = useMemo(() => {
    const active: Trip[] = [];
    const completed: Trip[] = [];
    const archived: Trip[] = [];

    trips.forEach((trip) => {
      const status = getEffectiveStatus(trip);
      if (status === 'archived') {
        archived.push(trip);
      } else if (status === 'completed') {
        completed.push(trip);
      } else {
        active.push(trip);
      }
    });

    return { active, completed, archived };
  }, [trips]);

  // Handle status update (for reopen/archive actions)
  const handleStatusUpdate = async (tripId: string, status: TripStatus) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setTrips((prev) =>
          prev.map((t) => (t.id === tripId ? { ...t, status } : t))
        );
      }
    } catch (err) {
      console.error('Failed to update trip status:', err);
    }
  };

  // Handle trip deletion
  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;

    try {
      const response = await fetch(`/api/trips/${tripToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
        setTripToDelete(null);
      } else {
        console.error('Failed to delete trip');
      }
    } catch (err) {
      console.error('Failed to delete trip:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="container max-w-6xl mx-auto px-4 py-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary shadow-glow">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-secondary bg-clip-text text-transparent">
                Tripply
              </h1>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Sign in to see your trips</h2>
            <p className="text-muted-foreground mb-6">
              Create an account to save your trip plans and access them from anywhere.
            </p>
            <SignInButton />
          </div>
        </main>
      </div>
    );
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'upcoming', label: 'Upcoming first' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-secondary bg-clip-text text-transparent">
              Tripply
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            <FeedbackButton />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold">My Trips</h2>
            <p className="text-muted-foreground mt-1">
              {trips.length} trip{trips.length !== 1 ? 's' : ''} planned
            </p>
          </div>
          <Link
            href="/plan"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
          >
            <Plus className="h-4 w-4" />
            New Trip
          </Link>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mb-6">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No trips yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start planning your next adventure! Search for destinations, add places, and organize your perfect trip.
            </p>
            <Link
              href="/plan"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Create Your First Trip
            </Link>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
                  >
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {sortOptions.find((o) => o.value === sortBy)?.label}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>

                  {showSortMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowSortMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-card rounded-xl border border-border shadow-lg z-50">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setShowSortMenu(false);
                            }}
                            className={cn(
                              'w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors',
                              sortBy === option.value && 'text-primary font-medium'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2.5 transition-colors',
                      viewMode === 'grid'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-accent'
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2.5 transition-colors border-l border-border',
                      viewMode === 'list'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-accent'
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Trip Sections */}
            <div className="space-y-8">
              {/* Active Trips Section */}
              {tripsBySection.active.length > 0 && (
                <TripSection
                  title="Active Trips"
                  icon={<Clock className="h-5 w-5 text-blue-500" />}
                  trips={tripsBySection.active.filter((trip) =>
                    searchQuery
                      ? trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        trip.destination?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )}
                  viewMode={viewMode}
                  getEffectiveStatus={getEffectiveStatus}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={setTripToDelete}
                />
              )}

              {/* Completed Trips Section */}
              {tripsBySection.completed.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-2 mb-4 text-lg font-semibold hover:text-primary transition-colors"
                  >
                    <ChevronRight
                      className={cn(
                        'h-5 w-5 transition-transform',
                        showCompleted && 'rotate-90'
                      )}
                    />
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Completed Trips</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      ({tripsBySection.completed.length})
                    </span>
                  </button>
                  {showCompleted && (
                    <TripSection
                      trips={tripsBySection.completed.filter((trip) =>
                        searchQuery
                          ? trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            trip.destination?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                          : true
                      )}
                      viewMode={viewMode}
                      getEffectiveStatus={getEffectiveStatus}
                      onStatusUpdate={handleStatusUpdate}
                      onDelete={setTripToDelete}
                      showReopenButton
                    />
                  )}
                </div>
              )}

              {/* Archived Trips Section */}
              {tripsBySection.archived.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex items-center gap-2 mb-4 text-lg font-semibold hover:text-primary transition-colors"
                  >
                    <ChevronRight
                      className={cn(
                        'h-5 w-5 transition-transform',
                        showArchived && 'rotate-90'
                      )}
                    />
                    <Archive className="h-5 w-5 text-gray-500" />
                    <span>Archived Trips</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      ({tripsBySection.archived.length})
                    </span>
                  </button>
                  {showArchived && (
                    <TripSection
                      trips={tripsBySection.archived.filter((trip) =>
                        searchQuery
                          ? trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            trip.destination?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                          : true
                      )}
                      viewMode={viewMode}
                      getEffectiveStatus={getEffectiveStatus}
                      onStatusUpdate={handleStatusUpdate}
                      onDelete={setTripToDelete}
                      showReopenButton
                    />
                  )}
                </div>
              )}

              {/* Empty state when no trips match search */}
              {tripsBySection.active.length === 0 &&
                tripsBySection.completed.length === 0 &&
                tripsBySection.archived.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No trips match your search.</p>
                  </div>
                )}
            </div>
          </>
        )}
      </main>

      {/* Delete Trip Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!tripToDelete}
        title="Delete Trip"
        message={`Are you sure you want to delete "${tripToDelete?.title}"? This will permanently remove the trip and all its cards. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteTrip}
        onCancel={() => setTripToDelete(null)}
      />
    </div>
  );
}
