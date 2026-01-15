'use client';

import { useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DestinationDetailCard, type DiscoverDestination } from './DestinationDetailCard';
import type { Region } from './RegionFilter';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/adsense/config';

// Sample destinations data
export const DISCOVER_DESTINATIONS: DiscoverDestination[] = [
  // Asia
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    region: 'asia',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    rating: 4.9,
    tags: ['Culture', 'Food', 'Technology'],
    description: 'A mesmerizing blend of ancient traditions and cutting-edge innovation in one of the world\'s most exciting cities.',
    bestTime: 'Mar-May, Sep-Nov',
    avgTemp: '16°C / 61°F',
    coordinates: { lat: 35.6762, lng: 139.6503 },
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    region: 'asia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    rating: 4.8,
    tags: ['Beach', 'Spiritual', 'Nature'],
    description: 'Island paradise with stunning temples, lush rice terraces, and world-class surfing.',
    bestTime: 'Apr-Oct',
    avgTemp: '27°C / 81°F',
    coordinates: { lat: -8.4095, lng: 115.1889 },
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    region: 'asia',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    rating: 4.9,
    tags: ['History', 'Temples', 'Gardens'],
    description: 'Japan\'s cultural heart with thousands of temples, traditional geisha districts, and serene zen gardens.',
    bestTime: 'Mar-May, Oct-Nov',
    avgTemp: '15°C / 59°F',
    coordinates: { lat: 35.0116, lng: 135.7681 },
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    region: 'asia',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
    rating: 4.7,
    tags: ['Modern', 'Food', 'Shopping'],
    description: 'A futuristic city-state where stunning architecture meets incredible street food and cultural diversity.',
    bestTime: 'Feb-Apr',
    avgTemp: '27°C / 81°F',
    coordinates: { lat: 1.3521, lng: 103.8198 },
  },

  // Europe
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    region: 'europe',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    rating: 4.8,
    tags: ['Romance', 'Art', 'Cuisine'],
    description: 'The City of Light, where iconic architecture, world-class museums, and exquisite dining await.',
    bestTime: 'Apr-Jun, Sep-Nov',
    avgTemp: '12°C / 54°F',
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'Greece',
    region: 'europe',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
    rating: 4.9,
    tags: ['Romance', 'Views', 'Beach'],
    description: 'Iconic white-washed buildings cascading down cliffs overlooking the deep blue Aegean Sea.',
    bestTime: 'Apr-Oct',
    avgTemp: '20°C / 68°F',
    coordinates: { lat: 36.3932, lng: 25.4615 },
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    region: 'europe',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
    rating: 4.7,
    tags: ['Architecture', 'Beach', 'Nightlife'],
    description: 'Gaudí\'s masterpieces, vibrant La Rambla, beautiful beaches, and unforgettable tapas.',
    bestTime: 'May-Jun, Sep-Oct',
    avgTemp: '16°C / 61°F',
    coordinates: { lat: 41.3851, lng: 2.1734 },
  },
  {
    id: 'amalfi',
    name: 'Amalfi Coast',
    country: 'Italy',
    region: 'europe',
    image: 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=800&q=80',
    rating: 4.8,
    tags: ['Scenic', 'Romance', 'Cuisine'],
    description: 'Dramatic cliffside villages, azure waters, and the finest Italian coastal cuisine.',
    bestTime: 'May-Sep',
    avgTemp: '18°C / 64°F',
    coordinates: { lat: 40.6333, lng: 14.6029 },
  },

  // Americas
  {
    id: 'new-york',
    name: 'New York City',
    country: 'USA',
    region: 'americas',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
    rating: 4.7,
    tags: ['Urban', 'Culture', 'Food'],
    description: 'The city that never sleeps - iconic skyline, Broadway shows, and endless neighborhoods to explore.',
    bestTime: 'Apr-Jun, Sep-Nov',
    avgTemp: '13°C / 55°F',
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  {
    id: 'machu-picchu',
    name: 'Machu Picchu',
    country: 'Peru',
    region: 'americas',
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80',
    rating: 4.9,
    tags: ['History', 'Adventure', 'Nature'],
    description: 'The lost city of the Incas, perched high in the Andes with breathtaking mountain vistas.',
    bestTime: 'Apr-Oct',
    avgTemp: '12°C / 54°F',
    coordinates: { lat: -13.1631, lng: -72.5450 },
  },
  {
    id: 'cancun',
    name: 'Cancún',
    country: 'Mexico',
    region: 'americas',
    image: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800&q=80',
    rating: 4.6,
    tags: ['Beach', 'Resorts', 'Nightlife'],
    description: 'Turquoise Caribbean waters, ancient Mayan ruins, and vibrant resort nightlife.',
    bestTime: 'Dec-Apr',
    avgTemp: '27°C / 81°F',
    coordinates: { lat: 21.1619, lng: -86.8515 },
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    country: 'Brazil',
    region: 'americas',
    image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80',
    rating: 4.7,
    tags: ['Beach', 'Culture', 'Nightlife'],
    description: 'Spectacular beaches, the iconic Christ the Redeemer, and infectious samba rhythms.',
    bestTime: 'Dec-Mar',
    avgTemp: '25°C / 77°F',
    coordinates: { lat: -22.9068, lng: -43.1729 },
  },

  // Africa
  {
    id: 'cape-town',
    name: 'Cape Town',
    country: 'South Africa',
    region: 'africa',
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
    rating: 4.8,
    tags: ['Nature', 'Wine', 'Adventure'],
    description: 'Table Mountain views, world-class wine regions, and stunning coastal drives.',
    bestTime: 'Nov-Mar',
    avgTemp: '17°C / 63°F',
    coordinates: { lat: -33.9249, lng: 18.4241 },
  },
  {
    id: 'marrakech',
    name: 'Marrakech',
    country: 'Morocco',
    region: 'africa',
    image: 'https://images.unsplash.com/photo-1597212720452-27547a715007?w=800&q=80',
    rating: 4.6,
    tags: ['Culture', 'Markets', 'History'],
    description: 'Ancient medinas, vibrant souks, and stunning riads in the heart of Morocco.',
    bestTime: 'Mar-May, Sep-Nov',
    avgTemp: '20°C / 68°F',
    coordinates: { lat: 31.6295, lng: -7.9811 },
  },
  {
    id: 'serengeti',
    name: 'Serengeti',
    country: 'Tanzania',
    region: 'africa',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80',
    rating: 4.9,
    tags: ['Safari', 'Wildlife', 'Nature'],
    description: 'Witness the Great Migration and see the Big Five in Africa\'s most famous national park.',
    bestTime: 'Jun-Oct',
    avgTemp: '21°C / 70°F',
    coordinates: { lat: -2.3333, lng: 34.8333 },
  },

  // Oceania
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    region: 'oceania',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
    rating: 4.7,
    tags: ['Beach', 'Urban', 'Nature'],
    description: 'Iconic Opera House, pristine beaches, and a laid-back lifestyle in this harbor city.',
    bestTime: 'Sep-Nov, Mar-May',
    avgTemp: '18°C / 64°F',
    coordinates: { lat: -33.8688, lng: 151.2093 },
  },
  {
    id: 'queenstown',
    name: 'Queenstown',
    country: 'New Zealand',
    region: 'oceania',
    image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&q=80',
    rating: 4.8,
    tags: ['Adventure', 'Scenic', 'Nature'],
    description: 'The adventure capital of the world, surrounded by stunning alpine scenery.',
    bestTime: 'Dec-Feb, Jun-Aug',
    avgTemp: '10°C / 50°F',
    coordinates: { lat: -45.0312, lng: 168.6626 },
  },
  {
    id: 'bora-bora',
    name: 'Bora Bora',
    country: 'French Polynesia',
    region: 'oceania',
    image: 'https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800&q=80',
    rating: 4.9,
    tags: ['Luxury', 'Beach', 'Romance'],
    description: 'Overwater bungalows, crystal-clear lagoons, and ultimate tropical paradise luxury.',
    bestTime: 'May-Oct',
    avgTemp: '26°C / 79°F',
    coordinates: { lat: -16.5004, lng: -151.7415 },
  },
];

// Collection filter mapping
export const COLLECTION_FILTERS: Record<string, { region?: Region; tag?: string; title: string }> = {
  'hidden-gems-europe': { region: 'europe', title: 'Hidden Gems of Europe' },
  'beach-escapes': { tag: 'Beach', title: 'Best Beach Escapes' },
  'cultural-capitals': { tag: 'Culture', title: 'Cultural Capitals' },
  'adventure-awaits': { tag: 'Adventure', title: 'Adventure Awaits' },
};

interface DestinationGridProps {
  selectedRegion: Region;
  searchQuery?: string;
  collectionFilter?: string;
  className?: string;
}

export function DestinationGrid({ selectedRegion, searchQuery = '', collectionFilter, className }: DestinationGridProps) {
  const filteredDestinations = useMemo(() => {
    let filtered = DISCOVER_DESTINATIONS;

    // Filter by collection (takes precedence)
    if (collectionFilter && COLLECTION_FILTERS[collectionFilter]) {
      const collection = COLLECTION_FILTERS[collectionFilter];
      if (collection.region) {
        filtered = filtered.filter((d) => d.region === collection.region);
      }
      if (collection.tag) {
        const tagToFilter = collection.tag;
        filtered = filtered.filter((d) => d.tags.includes(tagToFilter));
      }
    } else {
      // Filter by region only if no collection is active
      if (selectedRegion !== 'all') {
        filtered = filtered.filter((d) => d.region === selectedRegion);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.country.toLowerCase().includes(query) ||
          d.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [selectedRegion, searchQuery, collectionFilter]);

  // Get featured destination (highest rated in filtered list)
  const featuredDestination = useMemo(() => {
    if (filteredDestinations.length === 0) return null;
    return [...filteredDestinations].sort((a, b) => b.rating - a.rating)[0];
  }, [filteredDestinations]);

  // Rest of destinations (excluding featured)
  const gridDestinations = useMemo(() => {
    if (!featuredDestination) return [];
    return filteredDestinations.filter((d) => d.id !== featuredDestination.id);
  }, [filteredDestinations, featuredDestination]);

  if (filteredDestinations.length === 0) {
    return (
      <div className={cn('py-20 text-center', className)}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">No destinations found</h3>
          <p className="text-muted-foreground max-w-md">
            {searchQuery
              ? `No destinations match "${searchQuery}". Try a different search term.`
              : 'No destinations available for this region. Try selecting a different region.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Featured destination */}
      {featuredDestination && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Featured Destination</h3>
          </div>
          <DestinationDetailCard destination={featuredDestination} featured />
        </motion.div>
      )}

      {/* Grid of remaining destinations */}
      {gridDestinations.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Popular Destinations</h3>
            <span className="text-sm text-muted-foreground">
              {filteredDestinations.length} destination{filteredDestinations.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {gridDestinations.map((destination, index) => (
                <Fragment key={destination.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                  >
                    <DestinationDetailCard destination={destination} />
                  </motion.div>

                  {/* Insert ad every 9 cards */}
                  {(index + 1) % 9 === 0 && index < gridDestinations.length - 1 && (
                    <motion.div
                      key={`ad-${index}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: (index + 1) * 0.05 }}
                      className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-center justify-center"
                      layout
                    >
                      <AdSlot
                        slot={AD_SLOTS.DISCOVER_GRID_NATIVE}
                        format="rectangle"
                        layout="in-feed"
                        priority="normal"
                        className="w-full"
                      />
                    </motion.div>
                  )}
                </Fragment>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
