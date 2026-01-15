'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Loader2, Video } from 'lucide-react';
import type { YouTubeVideo } from '@/types/video';
import { PlaceVideoModal } from './PlaceVideoModal';

interface PlaceVideoTabProps {
  placeName: string;
  placeId: string;
}

/**
 * Place Video Tab Component
 * Displays a 2x2 grid of video thumbnails for a place
 * Click opens video in modal
 */
export function PlaceVideoTab({ placeName, placeId }: PlaceVideoTabProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);

  // Fetch videos on mount
  useEffect(() => {
    async function fetchVideos() {
      if (!placeName || !placeId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/travel/videos?type=place&name=${encodeURIComponent(placeName)}&id=${encodeURIComponent(placeId)}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.videos && data.videos.length > 0) {
            setVideos(data.videos);
          }
        }
      } catch (error) {
        console.error('Failed to fetch place videos:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVideos();
  }, [placeName, placeId]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading videos...</span>
        </div>
      </div>
    );
  }

  // Error or no videos state
  if (hasError || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Video className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No videos available for this place
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Try checking back later
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* 2x2 Video Thumbnail Grid */}
      <div className="grid grid-cols-2 gap-3">
        {videos.map((video, index) => (
          <motion.button
            key={video.videoId}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedVideoIndex(index)}
            className="relative aspect-video rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            {/* Thumbnail */}
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-white/80 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                <Play className="w-5 h-5 text-purple-600 ml-0.5" fill="currentColor" />
              </div>
            </div>

            {/* Video title (on hover) */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs font-medium line-clamp-2">
                {video.title}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Video count indicator */}
      <p className="text-center text-xs text-gray-400 mt-4">
        {videos.length} video{videos.length !== 1 ? 's' : ''} found
      </p>

      {/* Video Modal */}
      {selectedVideoIndex !== null && (
        <PlaceVideoModal
          videos={videos}
          currentIndex={selectedVideoIndex}
          onClose={() => setSelectedVideoIndex(null)}
          onNavigate={setSelectedVideoIndex}
        />
      )}
    </div>
  );
}
