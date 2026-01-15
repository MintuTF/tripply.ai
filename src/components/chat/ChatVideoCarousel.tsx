'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  X,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Video,
  RotateCcw,
} from 'lucide-react';
import type { ChatVideoResult } from '@/types/video';
import type { TravelPlace } from '@/lib/travel/types';
import { VideoContentPanel } from '@/app/travel/components/VideoContentPanel';
import { sendYouTubeCommand as sendCommand, buildEmbedUrl, replayVideo } from '@/lib/video';
import { cn } from '@/lib/utils';

interface ChatVideoCarouselProps {
  videos: ChatVideoResult[];
  cityName: string;
  onPlaceClick?: (place: TravelPlace) => void;
  className?: string;
}

export function ChatVideoCarousel({
  videos,
  cityName,
  onPlaceClick,
  className,
}: ChatVideoCarouselProps) {
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const expandedVideo = videos.find((v) => v.videoId === expandedVideoId);

  // Listen for YouTube state changes to detect video end
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(event.data);
        // State 0 = ended
        if (data.event === 'onStateChange' && data.info === 0) {
          setIsEnded(true);
        }
        // State 1 = playing (reset ended state)
        if (data.event === 'onStateChange' && data.info === 1) {
          setIsEnded(false);
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    if (expandedVideoId) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [expandedVideoId]);

  // Reset isEnded when video changes
  useEffect(() => {
    setIsEnded(false);
  }, [expandedVideoId]);

  const handleReplay = () => {
    replayVideo(iframeRef.current);
    setIsEnded(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400; // Increased for larger thumbnails
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    sendCommand(iframeRef.current, isMuted ? 'unMute' : 'mute');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Video className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Travel Videos
        </span>
        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
          {videos.length}
        </span>
      </div>

      {/* Expanded Video View - Matching VideoCollectionCard style */}
      <AnimatePresence mode="wait">
        {expandedVideo && (
          <motion.div
            key={expandedVideo.videoId}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col lg:flex-row gap-6 items-stretch"
          >
            {/* Video Player Card */}
            <div className="relative w-full lg:w-[45%] lg:max-w-md">
              {/* Purple glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur-lg opacity-30 animate-pulse" />

              <div
                className="relative overflow-hidden rounded-2xl shadow-2xl shadow-purple-500/40 ring-2 ring-purple-400/60 max-h-[600px]"
                style={{ aspectRatio: '9/16' }}
              >
                {/* Video iframe */}
                <iframe
                  ref={iframeRef}
                  src={buildEmbedUrl(expandedVideo.videoId, { muted: isMuted })}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />

                {/* Gradient overlay for controls visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

                {/* Title badge - Top left */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute top-4 left-4 z-10"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white line-clamp-1 max-w-[150px]">
                        {expandedVideo.title.split(' ').slice(0, 3).join(' ')}
                      </h3>
                      <p className="text-xs text-white/70">{expandedVideo.channelTitle}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Controls - Top right */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 right-4 flex items-center gap-2 z-20"
                >
                  <motion.button
                    onClick={handleMuteToggle}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all border border-white/20 shadow-lg"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </motion.button>

                  <motion.button
                    onClick={() => setExpandedVideoId(null)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 backdrop-blur-md flex items-center justify-center hover:from-red-600 hover:to-pink-600 transition-all border border-white/20 shadow-lg"
                  >
                    <X className="w-4 h-4 text-white" />
                  </motion.button>
                </motion.div>

                {/* Replay overlay - shows when video ended */}
                {isEnded && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 rounded-2xl"
                  >
                    <motion.button
                      onClick={handleReplay}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg"
                    >
                      <RotateCcw className="w-7 h-7 text-white" />
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Content Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
              className="w-full lg:w-[55%] lg:self-stretch"
            >
              <VideoContentPanel
                video={{
                  videoId: expandedVideo.videoId,
                  title: expandedVideo.title,
                  description: expandedVideo.description,
                  thumbnailUrl: expandedVideo.thumbnailUrl,
                  channelTitle: expandedVideo.channelTitle,
                }}
                cityName={cityName}
                onPlaceClick={onPlaceClick || (() => {})}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Thumbnails - Always visible */}
      <div className="relative group">
        {/* Scroll buttons */}
        {videos.length > 2 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700"
            >
              <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </>
        )}

        {/* Video thumbnails */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-hide px-1 sm:px-0"
        >
          {videos.map((video, index) => (
            <ChatVideoThumbnail
              key={video.videoId}
              video={video}
              index={index}
              isActive={video.videoId === expandedVideoId}
              onPlay={() => setExpandedVideoId(
                video.videoId === expandedVideoId ? null : video.videoId
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual video thumbnail card
 */
function ChatVideoThumbnail({
  video,
  index,
  isActive,
  onPlay,
}: {
  video: ChatVideoResult;
  index: number;
  isActive?: boolean;
  onPlay: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onPlay}
      className={cn(
        'flex-shrink-0 w-[85vw] sm:w-72 snap-start group cursor-pointer text-left',
        isActive && 'scale-[0.95]'
      )}
    >
      <div
        className={cn(
          'relative aspect-video rounded-xl overflow-hidden shadow-md transition-all duration-300',
          isActive
            ? 'ring-2 ring-purple-500 ring-offset-2 shadow-purple-200'
            : 'hover:shadow-lg hover:scale-[1.02]'
        )}
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Play/Playing indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isActive ? (
            <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center border-2 border-white">
              <div className="flex gap-1">
                <span className="w-1.5 h-5 bg-white rounded-full animate-pulse" />
                <span className="w-1.5 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all border border-white/30">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          )}
        </div>

        {/* Title and channel */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-sm font-medium text-white line-clamp-2 leading-tight">
            {video.title}
          </p>
          <p className="text-xs text-white/70 mt-1">{video.channelTitle}</p>
        </div>
      </div>
    </motion.button>
  );
}
