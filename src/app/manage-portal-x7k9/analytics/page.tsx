'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatsCard } from '@/components/admin/StatsCard';
import {
  Users,
  UserPlus,
  TrendingUp,
  Activity,
  Map,
  Calendar,
  Loader2,
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number; // Users with trips in last 30 days
  totalTrips: number;
  tripsThisMonth: number;
  avgTripsPerUser: number;
  usersByMonth: { month: string; count: number }[];
  tripsByMonth: { month: string; count: number }[];
  topDestinations: { destination: string; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      const supabase = createClient();

      try {
        // Get date ranges
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch all data in parallel
        const [
          usersRes,
          newUsersRes,
          tripsRes,
          newTripsRes,
          activeUsersRes,
        ] = await Promise.all([
          supabase.from('users').select('id, created_at'),
          supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfMonth.toISOString()),
          supabase.from('trips').select('id, user_id, destination, created_at'),
          supabase
            .from('trips')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfMonth.toISOString()),
          supabase
            .from('trips')
            .select('user_id')
            .gte('created_at', thirtyDaysAgo.toISOString()),
        ]);

        const users = usersRes.data || [];
        const trips = tripsRes.data || [];

        // Calculate active users (unique users with trips in last 30 days)
        const activeUserIds = new Set(
          (activeUsersRes.data || []).map((t: any) => t.user_id)
        );

        // Calculate users by month (last 6 months)
        const usersByMonth: { month: string; count: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          const count = users.filter((u: any) => {
            const date = new Date(u.created_at);
            return date >= month && date <= monthEnd;
          }).length;
          usersByMonth.push({
            month: month.toLocaleDateString('en-US', { month: 'short' }),
            count,
          });
        }

        // Calculate trips by month (last 6 months)
        const tripsByMonth: { month: string; count: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          const count = trips.filter((t: any) => {
            const date = new Date(t.created_at);
            return date >= month && date <= monthEnd;
          }).length;
          tripsByMonth.push({
            month: month.toLocaleDateString('en-US', { month: 'short' }),
            count,
          });
        }

        // Top destinations
        const destinationCounts: Record<string, number> = {};
        trips.forEach((trip: any) => {
          const dest = trip.destination?.name || 'Unknown';
          destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
        });
        const topDestinations = Object.entries(destinationCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([destination, count]) => ({ destination, count }));

        setData({
          totalUsers: users.length,
          newUsersThisMonth: newUsersRes.count || 0,
          activeUsers: activeUserIds.size,
          totalTrips: trips.length,
          tripsThisMonth: newTripsRes.count || 0,
          avgTripsPerUser: users.length > 0 ? trips.length / users.length : 0,
          usersByMonth,
          tripsByMonth,
          topDestinations,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          User and trip statistics overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Users"
          value={data?.totalUsers || 0}
          icon={Users}
        />
        <StatsCard
          title="New This Month"
          value={data?.newUsersThisMonth || 0}
          icon={UserPlus}
        />
        <StatsCard
          title="Active Users"
          value={data?.activeUsers || 0}
          subtitle="Last 30 days"
          icon={Activity}
        />
        <StatsCard
          title="Total Trips"
          value={data?.totalTrips || 0}
          icon={Map}
        />
        <StatsCard
          title="Trips This Month"
          value={data?.tripsThisMonth || 0}
          icon={Calendar}
        />
        <StatsCard
          title="Avg Trips/User"
          value={(data?.avgTripsPerUser || 0).toFixed(1)}
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Signups Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-foreground">User Signups</h2>
          <div className="h-64">
            <SimpleBarChart data={data?.usersByMonth || []} color="primary" />
          </div>
        </div>

        {/* Trips Created Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-foreground">Trips Created</h2>
          <div className="h-64">
            <SimpleBarChart data={data?.tripsByMonth || []} color="secondary" />
          </div>
        </div>
      </div>

      {/* Top Destinations */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold text-foreground">Top Destinations</h2>
        <div className="space-y-4">
          {data?.topDestinations.length ? (
            data.topDestinations.map((dest, index) => (
              <div key={dest.destination} className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">
                      {dest.destination}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {dest.count} trips
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${
                          (dest.count / (data.topDestinations[0]?.count || 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No destination data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple bar chart component
function SimpleBarChart({
  data,
  color,
}: {
  data: { month: string; count: number }[];
  color: 'primary' | 'secondary';
}) {
  const maxValue = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex h-full items-end justify-between gap-2">
      {data.map((item) => (
        <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
          <div className="relative w-full flex-1">
            <div
              className={`absolute bottom-0 w-full rounded-t-md ${
                color === 'primary' ? 'bg-primary' : 'bg-blue-500'
              }`}
              style={{
                height: `${(item.count / maxValue) * 100}%`,
                minHeight: item.count > 0 ? '4px' : '0',
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{item.month}</span>
          <span className="text-sm font-medium text-foreground">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
