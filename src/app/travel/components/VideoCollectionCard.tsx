'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Volume2, VolumeX, ChevronRight, RotateCcw, Expand } from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { YouTubeVideo } from '@/types/video';
import type { TravelPlace } from '@/lib/travel/types';
import { VideoContentPanel } from './VideoContentPanel';
import { sendYouTubeCommand as sendCommand, buildEmbedUrl, replayVideo } from '@/lib/video';

interface VideoCollectionCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  cityName: string;
  country: string;
  searchQuery: string;
  onClick: () => void;
  index?: number;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onPlaceClick?: (place: TravelPlace) => void;
}

export function VideoCollectionCard({
  id,
  title,
  description,
  icon: Icon,
  gradient,
  cityName,
  country,
  searchQuery,
  onClick,
  index = 0,
  isPlaying,
  onPlay,
  onStop,
  onPlaceClick,
}: VideoCollectionCardProps) {
  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);


  useEffect(() => {
    const fetchVideo = async () => {
      try {
        // Pass skipFilter=true to get all 25 videos from the database cache
        const response = await fetch(
          `/api/travel/videos?type=collection&name=${encodeURIComponent(searchQuery)}&id=${id}&cityName=${encodeURIComponent(cityName)}&country=${encodeURIComponent(country)}&skipFilter=true`
        );
        const data = await response.json();
        if (data.videos && data.videos.length > 0) {
          // Take top 4 videos (sorted by score) and randomly select one
          const top4 = data.videos.slice(0, 4);
          const randomIndex = Math.floor(Math.random() * top4.length);
          setVideo(top4[randomIndex]);
        }
      } catch (error) {
        console.error('Failed to fetch collection video:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideo();
  }, [cityName, country, searchQuery, id]);

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

    if (isPlaying) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isPlaying]);

  // Reset isEnded when video changes or stops
  useEffect(() => {
    setIsEnded(false);
    setIsPaused(false);
  }, [video?.videoId, isPlaying]);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    replayVideo(iframeRef.current);
    setIsEnded(false);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  };

  const handleStopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStop();
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    sendCommand(iframeRef.current, isMuted ? 'unMute' : 'mute');
  };

  const handlePauseToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused) {
      sendCommand(iframeRef.current, 'playVideo');
    } else {
      sendCommand(iframeRef.current, 'pauseVideo');
    }
    setIsPaused(!isPaused);
  };

  const handleCardClick = () => {
    if (isPlaying) {
      // Toggle pause instead of closing
      if (isPaused) {
        sendCommand(iframeRef.current, 'playVideo');
      } else {
        sendCommand(iframeRef.current, 'pauseVideo');
      }
      setIsPaused(!isPaused);
    } else {
      onClick();
    }
  };

  return (
    <div className="relative">
      {/* Flex container for side-by-side layout when playing */}
      <div className={`flex ${isPlaying ? 'flex-col lg:flex-row gap-6 items-stretch' : ''}`}>
        {/* Video Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            opacity: { delay: index * 0.1, duration: 0.3 },
            y: { delay: index * 0.1, type: 'spring', stiffness: 400, damping: 30 },
          }}
          className={`relative ${isPlaying ? 'w-full lg:w-[55%]' : 'w-full'}`}
        >
          {/* Playing state wrapper with glow effect */}
          {isPlaying && (
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur-lg opacity-30 animate-pulse" />
          )}
          <motion.div
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !isPlaying && onClick()}
            className={`w-full text-left overflow-hidden transition-all duration-300 group relative cursor-pointer ${
              isPlaying
                ? 'shadow-2xl shadow-purple-500/40 ring-2 ring-purple-400/60 rounded-2xl aspect-[9/16] md:aspect-[16/10]'
                : 'shadow-lg hover:shadow-xl rounded-2xl aspect-[4/5]'
            }`}
            layout
            transition={{
              layout: { type: 'spring', stiffness: 300, damping: 30 },
            }}
          >
            {/* Video/Thumbnail Background */}
            <AnimatePresence mode="wait">
              {video ? (
                isPlaying ? (
                  <motion.div
                    key="video"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <iframe
                      ref={iframeRef}
                      src={buildEmbedUrl(video.videoId, { muted: isMuted })}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </motion.div>
                ) : (
                  <motion.img
                    key="thumbnail"
                    src={video.thumbnailUrl}
                    alt={title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )
              ) : isLoading ? (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} animate-pulse`} />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
              )}
            </AnimatePresence>

            {/* Gradient Overlay */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                isPlaying
                  ? 'bg-gradient-to-t from-black/60 via-transparent to-black/40'
                  : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent'
              }`}
            />

            {/* Play Button - Show when not playing */}
            <AnimatePresence>
              {video && !isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.button
                    onClick={handlePlayClick}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg hover:bg-white/35 transition-colors"
                  >
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls when playing */}
            <AnimatePresence>
              {video && isPlaying && (
                <>
                  {/* Top right controls: expand, mute and close */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="absolute top-4 right-4 flex items-center gap-2 z-20"
                  >
                    {/* Expand to full page button */}
                    <Link
                      href={`/travel/video/${video.videoId}?city=${encodeURIComponent(cityName)}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all border border-white/20 shadow-lg"
                      >
                        <Expand className="w-5 h-5 md:w-4 md:h-4 text-white" />
                      </motion.div>
                    </Link>

                    <motion.button
                      onClick={handleMuteToggle}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all border border-white/20 shadow-lg"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 md:w-4 md:h-4 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 md:w-4 md:h-4 text-white" />
                      )}
                    </motion.button>

                    <motion.button
                      onClick={handleStopClick}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 backdrop-blur-md flex items-center justify-center hover:from-red-600 hover:to-pink-600 transition-all border border-white/20 shadow-lg"
                    >
                      <X className="w-5 h-5 md:w-4 md:h-4 text-white" />
                    </motion.button>
                  </motion.div>

                  {/* Pause overlay - shows when paused */}
                  {isPaused && !isEnded && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center z-20"
                    >
                      <motion.button
                        onClick={handlePauseToggle}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg"
                      >
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                      </motion.button>
                    </motion.div>
                  )}

                  {/* Replay overlay - shows when video ended */}
                  {isEnded && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center z-20 bg-black/40"
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
                </>
              )}
            </AnimatePresence>

            {/* Content - Different layout for playing vs not playing */}
            {isPlaying ? (
              // Playing state - Title badge at top left
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-4 left-4 z-10"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">{title}</h3>
                    <p className="text-xs text-white/70">{video?.channelTitle}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Default state - Content at bottom
              <motion.div
                className="absolute bottom-0 left-0 right-0 p-5"
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="font-bold text-lg text-white mb-1">{title}</h3>
                <p className="text-sm text-white/80">{description}</p>

                {video && (
                  <p className="text-xs text-white/60 mt-2 line-clamp-1">{video.channelTitle}</p>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Video Content Panel - Shows when playing (side by side on larger screens) */}
        <AnimatePresence>
          {isPlaying && video && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
              className="w-full lg:w-[45%] lg:self-stretch"
            >
              <VideoContentPanel
                video={video}
                cityName={cityName}
                onPlaceClick={onPlaceClick || (() => {})}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
