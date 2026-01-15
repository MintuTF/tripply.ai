'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { YouTubeVideo } from '@/types/video';

interface CityVideoHeroProps {
  cityName: string;
  cityId: string;
  fallbackImageUrl?: string;
}

/**
 * City Video Hero Component
 * Displays autoplay muted YouTube videos in the city hero banner
 * Auto-rotates between 4 videos every 8 seconds
 * Falls back to static image if no videos available
 */
export function CityVideoHero({
  cityName,
  cityId,
  fallbackImageUrl,
}: CityVideoHeroProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch videos on mount
  useEffect(() => {
    async function fetchVideos() {
      if (!cityName || !cityId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/travel/videos?type=city&name=${encodeURIComponent(cityName)}&id=${encodeURIComponent(cityId)}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.videos && data.videos.length > 0) {
            setVideos(data.videos);
          }
        }
      } catch (error) {
        console.error('Failed to fetch city videos:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVideos();
  }, [cityName, cityId]);

  // Auto-rotate videos every 8 seconds
  useEffect(() => {
    if (videos.length > 1 && isVideoReady) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % videos.length);
        setIsVideoReady(false); // Reset for new video
      }, 8000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videos.length, isVideoReady]);

  // Handle video loaded
  const handleVideoLoad = useCallback(() => {
    setIsVideoReady(true);
  }, []);

  // Navigate to specific video
  const goToVideo = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsVideoReady(false);
  }, []);

  // Show fallback image
  if (isLoading || hasError || videos.length === 0) {
    return (
      <div className="absolute inset-0">
        {fallbackImageUrl ? (
          <img
            src={fallbackImageUrl}
            alt={cityName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-white dark:to-gray-950" />
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Video Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentVideo.videoId}
          initial={{ opacity: 0 }}
          animate={{ opacity: isVideoReady ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&playlist=${currentVideo.videoId}&enablejsapi=1`}
            className="absolute inset-0 w-full h-full scale-150 pointer-events-none"
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            frameBorder="0"
            title={currentVideo.title}
            onLoad={handleVideoLoad}
          />
        </motion.div>
      </AnimatePresence>

      {/* Fallback image while video loads */}
      {!isVideoReady && fallbackImageUrl && (
        <div className="absolute inset-0">
          <img
            src={fallbackImageUrl}
            alt={cityName}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-white dark:to-gray-950 pointer-events-none" />

      {/* Video indicators */}
      {videos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToVideo(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
