'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Video, ChevronLeft, ChevronRight } from 'lucide-react';
import { RelatedVideoCard } from '@/components/video';
import type { YouTubeVideo } from '@/types/video';

interface PlaceVideosCarouselProps {
  placeName: string;
  placeId: string;
  city?: string;
  // Can optionally receive videos from parent to avoid duplicate fetch
  videos?: YouTubeVideo[];
}

export function PlaceVideosCarousel({
  placeName,
  placeId,
  city,
  videos: initialVideos,
}: PlaceVideosCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>(initialVideos || []);
  const [isLoading, setIsLoading] = useState(!initialVideos);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Fetch videos if not provided
  useEffect(() => {
    if (initialVideos) {
      setVideos(initialVideos);
      return;
    }

    const fetchVideos = async () => {
      try {
        const params = new URLSearchParams({
          type: 'place',
          name: placeName,
          id: placeId,
          skipFilter: 'true', // Get all videos for carousel
        });
        if (city) {
          params.set('cityName', city);
        }

        const response = await fetch(`/api/travel/videos?${params}`);
        const data = await response.json();

        if (data.videos) {
          // Skip the first video (it's shown in hero)
          setVideos(data.videos.slice(1));
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [placeName, placeId, city, initialVideos]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-purple-500" />
            More Videos About This Place
          </h3>
          <div className="flex gap-2 sm:gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[85vw] sm:w-56">
                <div className="aspect-[4/5] rounded-2xl bg-purple-100 dark:bg-purple-900/30 animate-pulse" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-purple-100 dark:bg-purple-900/30 rounded w-full animate-pulse" />
                  <div className="h-3 bg-purple-100 dark:bg-purple-900/30 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // No videos - hide section
  if (videos.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" />
            More Videos About This Place
          </h3>

          {/* Navigation Arrows */}
          {videos.length > 3 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  showLeftArrow
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!showLeftArrow}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  showRightArrow
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!showRightArrow}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-2 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 -mb-4 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {videos.map((video, index) => (
            <div key={video.videoId} className="flex-shrink-0 snap-start w-[85vw] sm:w-56">
              <RelatedVideoCard
                video={video}
                city={city}
                index={index}
                variant="portrait"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
