import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET() {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch counts
    const [
      usersCount,
      newUsersCount,
      tripsCount,
      newTripsCount,
      productsCount,
      feedbackCount,
    ] = await Promise.all([
      supabase!.from('users').select('id', { count: 'exact', head: true }),
      supabase!
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      supabase!.from('trips').select('id', { count: 'exact', head: true }),
      supabase!
        .from('trips')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      supabase!.from('products').select('id', { count: 'exact', head: true }),
      supabase!.from('feedback').select('id', { count: 'exact', head: true }),
    ]);

    // Active users (users with trips in last 30 days)
    const activeUsersRes = await supabase!
      .from('trips')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const activeUserIds = new Set(
      (activeUsersRes.data || []).map((t: any) => t.user_id)
    );

    return NextResponse.json({
      totalUsers: usersCount.count || 0,
      newUsersThisMonth: newUsersCount.count || 0,
      activeUsers: activeUserIds.size,
      totalTrips: tripsCount.count || 0,
      tripsThisMonth: newTripsCount.count || 0,
      totalProducts: productsCount.count || 0,
      totalFeedback: feedbackCount.count || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
