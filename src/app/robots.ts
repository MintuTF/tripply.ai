import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/manage-portal-x7k9', '/shared/', '/trips', '/plan', '/itinerary', '/auth/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
