'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatsCard } from '@/components/admin/StatsCard';
import {
  Users,
  Map,
  Package,
  MessageSquare,
  TrendingUp,
  Calendar,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalTrips: number;
  totalProducts: number;
  totalFeedback: number;
  newFeedbackCount: number;
  recentTrips: Array<{
    id: string;
    title: string;
    destination?: string;
    user_email?: string;
    created_at: string;
  }>;
  recentFeedback: Array<{
    id: string;
    category: string;
    message: string;
    user_email?: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      try {
        // Fetch counts in parallel
        const [usersRes, tripsRes, productsRes, feedbackRes, newFeedbackRes] =
          await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('trips').select('id', { count: 'exact', head: true }),
            supabase.from('products').select('id', { count: 'exact', head: true }),
            supabase.from('feedback').select('id', { count: 'exact', head: true }),
            supabase
              .from('feedback')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'new'),
          ]);

        // Fetch recent items
        const [recentTripsRes, recentFeedbackRes] = await Promise.all([
          supabase
            .from('trips')
            .select('id, title, destination, created_at, users(email)')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('feedback')
            .select('id, category, message, user_email, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          totalTrips: tripsRes.count || 0,
          totalProducts: productsRes.count || 0,
          totalFeedback: feedbackRes.count || 0,
          newFeedbackCount: newFeedbackRes.count || 0,
          recentTrips:
            recentTripsRes.data?.map((trip: any) => ({
              id: trip.id,
              title: trip.title,
              destination: trip.destination?.name,
              user_email: trip.users?.email,
              created_at: trip.created_at,
            })) || [],
          recentFeedback: recentFeedbackRes.data || [],
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
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
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your admin dashboard. Here's an overview of your app.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
        />
        <StatsCard
          title="Total Trips"
          value={stats?.totalTrips || 0}
          icon={Map}
        />
        <StatsCard
          title="Products"
          value={stats?.totalProducts || 0}
          icon={Package}
        />
        <StatsCard
          title="Feedback"
          value={stats?.totalFeedback || 0}
          subtitle={
            stats?.newFeedbackCount
              ? `${stats.newFeedbackCount} new`
              : undefined
          }
          icon={MessageSquare}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Trips */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Recent Trips</h2>
            <Link
              href="/manage-portal-x7k9/trips"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {stats?.recentTrips.length ? (
              stats.recentTrips.map((trip) => (
                <div key={trip.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Map className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {trip.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {trip.destination || 'No destination'} •{' '}
                      {trip.user_email || 'Unknown user'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(trip.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-muted-foreground">
                No trips yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Recent Feedback</h2>
            <Link
              href="/manage-portal-x7k9/feedback"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {stats?.recentFeedback.length ? (
              stats.recentFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="rounded-lg bg-primary/10 p-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          feedback.category === 'bug'
                            ? 'bg-red-100 text-red-700'
                            : feedback.category === 'feature'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {feedback.category}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {feedback.user_email || 'Anonymous'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground line-clamp-1">
                      {feedback.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-muted-foreground">
                No feedback yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
