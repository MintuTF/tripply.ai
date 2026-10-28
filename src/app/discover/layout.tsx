import type { Metadata } from 'next';
import { pageMeta } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Explore Destinations',
  description: 'Browse destinations by region, search by country or tag, and start planning your next trip.',
  path: '/discover',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
