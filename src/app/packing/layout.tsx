import type { Metadata } from 'next';
import { pageMeta } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Smart Packing List',
  description: 'Generate a packing list tailored to your destination, dates and activities.',
  path: '/packing',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
