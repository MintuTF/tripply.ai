import type { Metadata } from 'next';
import { pageMeta } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Trip Research',
  description: 'Research places, hotels, restaurants and activities for your trip with AI.',
  path: '/research',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
