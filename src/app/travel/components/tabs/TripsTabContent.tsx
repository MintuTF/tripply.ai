'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { SignInButton } from '@/components/auth/SignInButton';
import { Trip, TripStatus } from '@/types';
import {
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
  Plane,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore } from 'date-fns';

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'name' | 'upcoming';

const STATUS_CONFIG: Record<TripStatus, { label: string; color: string }> = {
  planning: { label: 'Planning', color: 'bg-blue-500/10 text-blue-600' },
  in_progress: { label: 'In Progress', color: 'bg-green-500/10 text-green-600' },
  completed: { label: 'Completed', color: 'bg-gray-500/10 text-gray-600' },
  archived: { label: 'Archived', color: 'bg-gray-500/10 text-gray-500' },
};

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

  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <span className="text-sm text-gray-500">({trips.length})</span>
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
                className="group block rounded-2xl border border-purple-100 bg-white overflow-hidden hover:border-purple-300 hover:shadow-xl transition-all duration-300"
              >
                <Link href={`/trips/${trip.id}`}>
                  <div className="h-24 bg-gradient-to-br from-purple-100 via-pink-50 to-purple-50 relative">
                    <div
                      className={cn(
                        'absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium',
                        statusConfig.color
                      )}
                    >
                      {statusConfig.label}
                    </div>
                    {trip.destination?.name && (
                      <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {trip.destination.name.split(',')[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">
                      {trip.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
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

                <div className="px-5 pb-4 flex items-center gap-4">
                  {showReopenButton && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onStatusUpdate(trip.id, 'planning');
                      }}
                      className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 transition-colors"
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
                className="flex items-center gap-6 p-5 rounded-xl border border-purple-100 bg-white hover:border-purple-300 hover:shadow-lg transition-all"
              >
                <Link href={`/trips/${trip.id}`} className="flex items-center gap-6 flex-1 min-w-0">
                  <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex-shrink-0">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{trip.title}</h3>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                          statusConfig.color
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
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
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {showReopenButton && (
                    <button
                      onClick={() => onStatusUpdate(trip.id, 'planning')}
                      className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 transition-colors"
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

export function TripsTabContent() {
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

  const getEffectiveStatus = (trip: Trip): TripStatus => {
    if (trip.status === 'archived') return 'archived';
    if (trip.status === 'completed') return 'completed';

    if (!trip.dates?.start || !trip.dates?.end) return trip.status || 'planning';

    const now = new Date();
    const start = new Date(trip.dates.start);
    const end = new Date(trip.dates.end);

    if (isAfter(now, end)) return 'completed';
    if (isAfter(now, start) && isBefore(now, end)) return 'in_progress';
    return 'planning';
  };

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

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;

    try {
      const response = await fetch(`/api/trips/${tripToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
        setTripToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete trip:', err);
    }
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'upcoming', label: 'Upcoming first' },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200 mb-6">
          <Plane className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign in to see your trips</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          Create an account to save your trip plans and access them from anywhere.
        </p>
        <SignInButton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">My Trips</h2>
          <p className="text-gray-500 mt-1">
            {trips.length} trip{trips.length !== 1 ? 's' : ''} planned
          </p>
        </div>
        <Link
          href="/plan"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-200 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Trip
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {trips.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-6">
            <MapPin className="w-10 h-10 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No trips yet</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Start planning your next adventure! Search for destinations, add places, and organize your perfect trip.
          </p>
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-200 transition-all"
          >
            <Plus className="h-5 w-5" />
            Create Your First Trip
          </Link>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-purple-100 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-100 bg-white hover:bg-purple-50 transition-colors"
                >
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {sortOptions.find((o) => o.value === sortBy)?.label}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {showSortMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSortMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-white rounded-xl border border-purple-100 shadow-lg z-50">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortMenu(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-purple-50 transition-colors',
                            sortBy === option.value && 'text-purple-600 font-medium'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex rounded-xl border border-purple-100 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2.5 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white hover:bg-purple-50'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2.5 transition-colors border-l border-purple-100',
                    viewMode === 'list'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white hover:bg-purple-50'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Trip Sections */}
          <div className="space-y-8">
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

            {tripsBySection.completed.length > 0 && (
              <div>
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800 hover:text-purple-600 transition-colors"
                >
                  <ChevronRight
                    className={cn(
                      'h-5 w-5 transition-transform',
                      showCompleted && 'rotate-90'
                    )}
                  />
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Completed Trips</span>
                  <span className="text-sm font-normal text-gray-500">
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

            {tripsBySection.archived.length > 0 && (
              <div>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800 hover:text-purple-600 transition-colors"
                >
                  <ChevronRight
                    className={cn(
                      'h-5 w-5 transition-transform',
                      showArchived && 'rotate-90'
                    )}
                  />
                  <Archive className="h-5 w-5 text-gray-500" />
                  <span>Archived Trips</span>
                  <span className="text-sm font-normal text-gray-500">
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
          </div>
        </>
      )}

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
