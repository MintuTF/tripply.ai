'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  ExternalLink,
  Clock,
  Eye,
  Sparkles,
  Target,
  MapPin,
  Camera,
  Utensils,
  Building2,
  Landmark,
} from 'lucide-react';
import type { ChatVideoResult, VideoAnalysis, VideoPlaceWithNote } from '@/types/video';
import { sendYouTubeCommand, buildEmbedUrl, replayVideo } from '@/lib/video';
import { cn } from '@/lib/utils';

// Place type icons mapping (from VideoSummary.tsx)
const placeTypeIcons: Record<string, typeof Camera> = {
  attraction: Camera,
  restaurant: Utensils,
  hotel: Building2,
  landmark: Landmark,
  default: MapPin,
};

function getPlaceIcon(type: string) {
  return placeTypeIcons[type?.toLowerCase()] || placeTypeIcons.default;
}

interface VideoFeaturedCardProps {
  video: ChatVideoResult;
  analysis?: VideoAnalysis | null;
  autoPlay?: boolean;
  className?: string;
}

/**
 * Featured Video Card - Compact side-by-side layout with AI summary
 *
 * Design: Small YouTube embed on left, summary + highlights on right.
 * Auto-plays muted, with video analysis displayed alongside.
 */
export function VideoFeaturedCard({
  video,
  analysis,
  autoPlay = true,
  className,
}: VideoFeaturedCardProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for YouTube state changes
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(event.data);
        // State 0 = ended, 1 = playing, 2 = paused
        if (data.event === 'onStateChange') {
          if (data.info === 0) {
            setIsEnded(true);
            setIsPlaying(false);
          } else if (data.info === 1) {
            setIsEnded(false);
            setIsPlaying(true);
          } else if (data.info === 2) {
            setIsPlaying(false);
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls && isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const handlePlayPause = () => {
    if (isPlaying) {
      sendYouTubeCommand(iframeRef.current, 'pauseVideo');
      setIsPlaying(false);
    } else {
      sendYouTubeCommand(iframeRef.current, 'playVideo');
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    sendYouTubeCommand(iframeRef.current, isMuted ? 'unMute' : 'mute');
  };

  const handleReplay = () => {
    replayVideo(iframeRef.current);
    setIsEnded(false);
    setIsPlaying(true);
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleOpenYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank');
  };

  // Expanded fullscreen view
  if (isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-4 z-50 bg-black rounded-3xl overflow-hidden"
      >
        <div className="relative h-full">
          <iframe
            ref={iframeRef}
            src={buildEmbedUrl(video.videoId, {
              autoplay: true,
              muted: isMuted,
              enablejsapi: true,
            })}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all border border-white/20 text-white"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden',
        className
      )}
    >
      {/* Side-by-side layout: Video + Summary */}
      <div className="flex flex-col sm:flex-row">
        {/* Video Section - Large (60% width on tablet+) */}
        <div
          className="relative w-full sm:w-3/5 flex-shrink-0 bg-black rounded-l-2xl overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setShowControls(true)}
        >
          {/* Aspect Ratio Container */}
          <div className="relative aspect-[4/5] sm:aspect-video">
            {/* YouTube Embed */}
            <iframe
              ref={iframeRef}
              src={buildEmbedUrl(video.videoId, {
                autoplay: autoPlay,
                muted: isMuted,
                enablejsapi: true,
              })}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* Controls Overlay */}
            <AnimatePresence>
              {(showControls || !isPlaying || isEnded) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Featured Badge - Top Left */}
            <div className="absolute top-2 left-2 z-10">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-semibold shadow-lg">
                <Play className="w-2.5 h-2.5 fill-white" />
                Featured
              </div>
            </div>

            {/* Control Buttons - Top Right */}
            <AnimatePresence>
              {(showControls || !isPlaying) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-2 right-2 flex items-center gap-1 z-20 pointer-events-auto"
                >
                  <SmallControlButton onClick={handleMuteToggle} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <VolumeX className="w-4 h-4 md:w-3 md:h-3" /> : <Volume2 className="w-4 h-4 md:w-3 md:h-3" />}
                  </SmallControlButton>
                  <SmallControlButton onClick={() => setIsExpanded(true)} title="Fullscreen">
                    <Maximize2 className="w-4 h-4 md:w-3 md:h-3" />
                  </SmallControlButton>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center Play/Pause Button */}
            <AnimatePresence>
              {(showControls || !isPlaying || isEnded) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto"
                >
                  {isEnded ? (
                    <button
                      onClick={handleReplay}
                      className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all border border-white/30 shadow-lg"
                    >
                      <RotateCcw className="w-5 h-5 md:w-4 md:h-4 text-white" />
                    </button>
                  ) : (
                    <button
                      onClick={handlePlayPause}
                      className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all border border-white/30 shadow-lg"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 md:w-4 md:h-4 text-white fill-white" />
                      ) : (
                        <Play className="w-5 h-5 md:w-4 md:h-4 text-white fill-white ml-0.5" />
                      )}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Info - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-2 text-white/80 text-[10px]">
                <span className="font-medium truncate">{video.channelTitle}</span>
                {video.viewCount && (
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5" />
                    {formatViewCount(video.viewCount)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="flex-1 p-5 space-y-4">
          {/* Video Title */}
          <h3 className="font-semibold text-gray-900 dark:text-white text-base line-clamp-2">
            {video.title}
          </h3>

          {/* AI Summary */}
          {analysis?.summary ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>

              {/* Key Highlights */}
              {analysis.highlights && analysis.highlights.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Target className="w-4 h-4 text-purple-500" />
                    Key Highlights
                  </div>
                  <ul className="space-y-1.5 pl-5">
                    {analysis.highlights.slice(0, 3).map((highlight, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 dark:text-gray-400 list-disc"
                      >
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Places Mentioned */}
              {analysis.places && analysis.places.length > 0 && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-pink-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Places Mentioned
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.places.map((place, index) => {
                      const Icon = getPlaceIcon(place.type);
                      return (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-300 transition-all"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{place.name}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Fallback: Show video description */
            video.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
                {video.description}
              </p>
            )
          )}

          {/* Open on YouTube link */}
          <button
            onClick={handleOpenYouTube}
            className="flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Watch on YouTube
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Small control button for compact video overlay
 */
function SmallControlButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 md:w-6 md:h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all border border-white/20 text-white"
    >
      {children}
    </button>
  );
}

/**
 * Format view count to human readable (e.g., 1.2M, 500K)
 */
function formatViewCount(count: number | string): string {
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K views`;
  }
  return `${num} views`;
}
