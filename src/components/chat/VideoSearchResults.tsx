'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import type { ChatVideoResult } from '@/types/video';
import { cn } from '@/lib/utils';

interface VideoSearchResultsProps {
  videos: ChatVideoResult[];
  title?: string;
  onVideoSelect?: (video: ChatVideoResult) => void;
  selectedVideoId?: string;
  className?: string;
}

/**
 * Video Search Results - Horizontal scrolling carousel of video thumbnails
 *
 * Shows additional related videos below the featured video.
 * Clicking a video can either select it as featured or play inline.
 */
export function VideoSearchResults({
  videos,
  title = 'More Videos',
  onVideoSelect,
  selectedVideoId,
  className,
}: VideoSearchResultsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!videos || videos.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn('space-y-3', className)}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Video className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {title}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {videos.length}
          </span>
        </div>

        {/* Navigation Arrows - Always visible on desktop */}
        {videos.length > 3 && (
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Video Carousel */}
      <div className="relative group">
        {/* Scroll Buttons - Mobile hover */}
        {videos.length > 2 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </>
        )}

        {/* Video Grid - Horizontal Scroll */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-1 px-1"
        >
          {videos.map((video, index) => (
            <VideoThumbnailCard
              key={video.videoId}
              video={video}
              index={index}
              isSelected={video.videoId === selectedVideoId}
              onClick={() => onVideoSelect?.(video)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Individual video thumbnail card
 */
function VideoThumbnailCard({
  video,
  index,
  isSelected,
  onClick,
}: {
  video: ChatVideoResult;
  index: number;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        'flex-shrink-0 w-64 snap-start group cursor-pointer text-left',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded-xl'
      )}
    >
      <div
        className={cn(
          'relative aspect-video rounded-xl overflow-hidden',
          'shadow-md transition-all duration-300',
          isSelected
            ? 'ring-2 ring-purple-500 ring-offset-2 shadow-purple-200 dark:shadow-purple-900/30'
            : 'hover:shadow-lg hover:scale-[1.02]'
        )}
      >
        {/* Thumbnail */}
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
            {video.duration}
          </div>
        )}

        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isSelected ? (
            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center border-2 border-white shadow-lg">
              <div className="flex gap-0.5">
                <span className="w-1 h-4 bg-white rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all border border-white/30">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          )}
        </div>

        {/* Title & Channel */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-sm font-medium text-white line-clamp-2 leading-tight">
            {video.title}
          </p>
          <p className="text-xs text-white/70 mt-0.5 truncate">
            {video.channelTitle}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

/**
 * Compact version for limited space
 */
export function VideoSearchResultsCompact({
  videos,
  onVideoSelect,
  className,
}: {
  videos: ChatVideoResult[];
  onVideoSelect?: (video: ChatVideoResult) => void;
  className?: string;
}) {
  if (!videos || videos.length === 0) return null;

  return (
    <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide', className)}>
      {videos.slice(0, 4).map((video) => (
        <button
          key={video.videoId}
          onClick={() => onVideoSelect?.(video)}
          className="flex-shrink-0 w-24 group"
        >
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
