'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, Utensils, Camera, Landmark, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TravelPlace } from '@/lib/travel/types';
import { VideoCollectionCard } from './VideoCollectionCard';

interface Collection {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  searchKeywords: string; // Keywords for video search
  filter?: string; // Category filter to apply
}

interface CityCollectionsProps {
  cityName: string;
  country: string;
  onCollectionClick: (collectionId: string, filter?: string) => void;
  onPlaceClick?: (place: TravelPlace) => void;
}

// Helper to get collections with city-specific search queries
function getCollections(cityName: string, country: string): Collection[] {
  return [
    {
      id: 'hidden-gems',
      title: 'Hidden Gems',
      description: 'Secret spots locals love',
      icon: Gem,
      gradient: 'from-purple-500 to-pink-500',
      searchKeywords: `${cityName} ${country} hidden gems secret spots`,
    },
    {
      id: 'best-food',
      title: 'Best Food',
      description: 'Top restaurants & cafes',
      icon: Utensils,
      gradient: 'from-pink-500 to-rose-500',
      searchKeywords: `${cityName} ${country} best food restaurants`,
      filter: 'restaurants',
    },
    {
      id: 'must-see',
      title: 'Must-See',
      description: 'Iconic attractions',
      icon: Camera,
      gradient: 'from-purple-600 to-indigo-500',
      searchKeywords: `${cityName} ${country} must see attractions`,
      filter: 'activities',
    },
    {
      id: 'cultural',
      title: 'Cultural Sites',
      description: 'Museums & landmarks',
      icon: Landmark,
      gradient: 'from-indigo-500 to-purple-600',
      searchKeywords: `${cityName} ${country} cultural sites temples museums`,
    },
  ];
}

export function CityCollections({ cityName, country, onCollectionClick, onPlaceClick }: CityCollectionsProps) {
  const collections = getCollections(cityName, country);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Find the playing collection
  const playingCollection = playingVideoId
    ? collections.find((c) => c.id === playingVideoId)
    : null;

  // Get the index of the playing collection for animation
  const playingIndex = playingCollection
    ? collections.findIndex((c) => c.id === playingVideoId)
    : -1;

  // Filter non-playing collections for the grid
  const gridCollections = collections.filter((c) => c.id !== playingVideoId);

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Explore {cityName}
            </h2>
            <p className="text-gray-500 text-sm">Watch curated video guides for your trip</p>
          </div>
        </div>

        {/* Playing Video at Top */}
        <AnimatePresence mode="wait">
          {playingCollection && (
            <motion.div
              key={playingCollection.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="mb-6"
            >
              <VideoCollectionCard
                id={playingCollection.id}
                title={playingCollection.title}
                description={playingCollection.description}
                icon={playingCollection.icon}
                gradient={playingCollection.gradient}
                cityName={cityName}
                country={country}
                searchQuery={playingCollection.searchKeywords}
                onClick={() => onCollectionClick(playingCollection.id, playingCollection.filter)}
                index={playingIndex}
                isPlaying={true}
                onPlay={() => setPlayingVideoId(playingCollection.id)}
                onStop={() => setPlayingVideoId(null)}
                onPlaceClick={onPlaceClick}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Collections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-visible">
          {gridCollections.map((collection, index) => (
            <VideoCollectionCard
              key={collection.id}
              id={collection.id}
              title={collection.title}
              description={collection.description}
              icon={collection.icon}
              gradient={collection.gradient}
              cityName={cityName}
              country={country}
              searchQuery={collection.searchKeywords}
              onClick={() => onCollectionClick(collection.id, collection.filter)}
              index={index}
              isPlaying={false}
              onPlay={() => setPlayingVideoId(collection.id)}
              onStop={() => setPlayingVideoId(null)}
              onPlaceClick={onPlaceClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
