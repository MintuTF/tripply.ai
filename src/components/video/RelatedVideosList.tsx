'use client';

import { useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Video, ChevronLeft, ChevronRight } from 'lucide-react';
import type { YouTubeVideo } from '@/types/video';
import { RelatedVideoCard } from './RelatedVideoCard';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface RelatedVideosListProps {
  videos: YouTubeVideo[];
  city?: string;
  isLoading?: boolean;
  className?: string;
  variant?: 'default' | 'carousel';
}

export function RelatedVideosList({
  videos,
  city,
  isLoading = false,
  className = '',
  variant = 'default',
}: RelatedVideosListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Shuffle videos on each render for fresh experience
  const shuffledVideos = useMemo(() => shuffleArray(videos), [videos]);

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

  // Carousel variant - horizontal scroll
  if (variant === 'carousel') {
    if (isLoading) {
      return (
        <div className={`space-y-4 ${className}`}>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" />
            More to Discover
          </h3>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-56">
                <div className="aspect-[4/5] rounded-2xl bg-purple-100 dark:bg-purple-900/30 animate-pulse" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-purple-100 dark:bg-purple-900/30 rounded w-full animate-pulse" />
                  <div className="h-3 bg-purple-100 dark:bg-purple-900/30 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (videos.length === 0) {
      return (
        <div className={`space-y-4 ${className}`}>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" />
            More to Discover
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
            No related videos found
          </p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`space-y-4 relative ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" />
            More to Discover
          </h3>

          {/* Navigation Arrows */}
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
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 -mb-4 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {shuffledVideos.map((video, index) => (
            <div key={video.videoId} className="flex-shrink-0 snap-start">
              <RelatedVideoCard
                video={video}
                city={city}
                index={index}
                variant="portrait"
              />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Default variant - vertical list
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Video className="w-4 h-4" />
          Related Videos
        </h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 p-2">
              <div className="w-40 aspect-video rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2 py-0.5">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Video className="w-4 h-4" />
          Related Videos
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">
          No related videos found
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`space-y-3 ${className}`}
    >
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 px-2">
        <Video className="w-4 h-4" />
        Related Videos
      </h3>
      <div className="space-y-1">
        {shuffledVideos.map((video, index) => (
          <RelatedVideoCard
            key={video.videoId}
            video={video}
            city={city}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}
