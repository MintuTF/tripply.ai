import type { Metadata } from 'next';
import { getTravelGuide } from '@/data/travel-guides';
import { pageMeta, SITE_NAME } from '@/lib/site';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getTravelGuide(slug);
  if (!guide) return { title: 'Guide not found', robots: { index: false } };
  const meta = pageMeta({
    title: `${guide.city}, ${guide.country} Travel Guide`,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    image: guide.heroImage,
  });
  return { ...meta, title: { absolute: `${`${guide.city}, ${guide.country} Travel Guide`} | ${SITE_NAME}` } };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
