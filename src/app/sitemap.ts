import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { blogPosts } from '@/data/blog-posts';
import { travelGuides } from '@/data/travel-guides';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ['', '/discover', '/guides', '/blog', '/travel', '/packing', '/research', '/about', '/contact', '/privacy', '/terms'];

  return [
    ...staticPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: path === '' ? ('daily' as const) : ('weekly' as const),
      priority: path === '' ? 1 : 0.7,
    })),
    ...travelGuides.map((g) => ({
      url: `${SITE_URL}/guides/${g.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...blogPosts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}
