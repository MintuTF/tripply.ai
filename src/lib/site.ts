import type { Metadata } from 'next';

export const SITE_NAME = 'Tripply';
export const SITE_DESCRIPTION =
  'Discover destinations, get AI-powered travel recommendations, and turn your ideas into a day-by-day plan you can share.';

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://tripply.ai').replace(/\/$/, '');

interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}

export function pageMeta({ title, description, path, image, noIndex }: PageMetaOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${title} | ${SITE_NAME}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
