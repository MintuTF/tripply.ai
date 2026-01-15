import { redirect } from 'next/navigation';

interface CityPageProps {
  params: Promise<{
    citySlug: string;
  }>;
}

/**
 * Redirect /travel/[citySlug] to /travel/[citySlug]/explore
 */
export default async function CityPage({ params }: CityPageProps) {
  const { citySlug } = await params;
  redirect(`/travel/${citySlug}/explore`);
}
