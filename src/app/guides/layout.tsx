import type { Metadata } from 'next';
import { pageMeta } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Travel Guides',
  description: 'In-depth city guides with top attractions, food, neighborhoods, budgets and practical tips.',
  path: '/guides',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
