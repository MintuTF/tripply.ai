'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trip, TripStatus } from '@/types';
import {
  Search,
  Map,
  Calendar,
  Users,
  ExternalLink,
  Loader2,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TripWithUser extends Trip {
  user_email?: string;
}

const STATUS_OPTIONS: { value: TripStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_COLORS: Record<TripStatus, string> = {
  planning: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-700',
};

export default function TripsPage() {
  const [trips, setTrips] = useState<TripWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'start_date'>('created_at');

  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('trips')
      .select('*, users(email)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trips:', error);
    } else {
      setTrips(
        (data || []).map((trip: any) => ({
          ...trip,
          user_email: trip.users?.email,
        }))
      );
    }
    setLoading(false);
  }

  const filteredTrips = trips
    .filter((trip) => {
      const matchesSearch =
        !searchQuery ||
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.destination?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !filterStatus || trip.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'start_date') {
        return (
          new Date(b.dates?.start || 0).getTime() -
          new Date(a.dates?.start || 0).getTime()
        );
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Stats
  const stats = {
    total: trips.length,
    planning: trips.filter((t) => t.status === 'planning').length,
    inProgress: trips.filter((t) => t.status === 'in_progress').length,
    completed: trips.filter((t) => t.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Trip Overview</h1>
        <p className="text-muted-foreground">
          View all trips created by users
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Trips</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Planning</p>
          <p className="text-2xl font-bold text-blue-600">{stats.planning}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search trips, destinations, users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="created_at">Sort by Created</option>
          <option value="start_date">Sort by Start Date</option>
        </select>
      </div>

      {/* Trips Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Trip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Party
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredTrips.map((trip) => (
              <tr key={trip.id} className="hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Map className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{trip.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {trip.destination?.name || 'No destination'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {trip.user_email || 'Unknown'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {trip.dates?.start
                      ? new Date(trip.dates.start).toLocaleDateString()
                      : 'Not set'}
                    {trip.dates?.end && (
                      <>
                        {' → '}
                        {new Date(trip.dates.end).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {trip.party_json?.adults || 1}
                    {trip.party_json?.children && ` + ${trip.party_json.children} kids`}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                      STATUS_COLORS[trip.status]
                    )}
                  >
                    {trip.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(trip.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/trips/${trip.id}`}
                      target="_blank"
                      className="rounded p-1 hover:bg-accent"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTrips.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No trips found
          </div>
        )}
      </div>
    </div>
  );
}
