'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Pause, Play, RotateCcw, Maximize, X } from 'lucide-react';
import { buildEmbedUrl, sendYouTubeCommand, replayVideo } from '@/lib/video';

interface VideoPlayerProps {
  videoId: string;
  autoplay?: boolean;
  className?: string;
  title?: string;
  channelTitle?: string;
  durationSeconds?: number;
  onClose?: () => void;
}

// Format seconds to MM:SS or HH:MM:SS
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoPlayer({
  videoId,
  autoplay = true,
  className = '',
  title,
  channelTitle,
  durationSeconds = 0,
  onClose,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [isSeeking, setIsSeeking] = useState(false);

  // Poll for current time via YouTube API
  useEffect(() => {
    if (!iframeRef.current?.contentWindow || isPaused || isEnded) return;

    const interval = setInterval(() => {
      // Request current time from YouTube
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening' }),
        '*'
      );
    }, 500);

    return () => clearInterval(interval);
  }, [isPaused, isEnded]);

  // Listen for YouTube state changes and time updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'onStateChange') {
          if (data.info === 0) setIsEnded(true);
          if (data.info === 1) {
            setIsEnded(false);
            setIsPaused(false);
          }
          if (data.info === 2) setIsPaused(true);
        }
        // Update time info when available
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number' && !isSeeking) {
            setCurrentTime(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isSeeking]);

  // Handle seeking
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;

    setCurrentTime(newTime);
    sendYouTubeCommand(iframeRef.current, 'seekTo', [newTime, true]);
  }, [duration]);

  const handleSeekStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsSeeking(true);
    handleSeek(e);
  }, [handleSeek]);

  const handleSeekEnd = useCallback(() => {
    setIsSeeking(false);
  }, []);

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    sendYouTubeCommand(iframeRef.current, isMuted ? 'unMute' : 'mute');
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      sendYouTubeCommand(iframeRef.current, 'playVideo');
    } else {
      sendYouTubeCommand(iframeRef.current, 'pauseVideo');
    }
    setIsPaused(!isPaused);
  };

  const handleReplay = () => {
    replayVideo(iframeRef.current);
    setIsEnded(false);
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen?.();
    }
  };

  return (
    <div
      className={`relative aspect-video bg-black rounded-2xl overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <iframe
        ref={iframeRef}
        src={buildEmbedUrl(videoId, { autoplay, muted: isMuted })}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      {/* Gradient overlay for controls visibility */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls || isPaused || isEnded ? 1 : 0 }}
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none"
      />

      {/* Title Badge - Top Left */}
      <AnimatePresence>
        {(title || channelTitle) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: showControls ? 1 : 0.9, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-4 left-4 z-10"
          >
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="max-w-[90%] md:max-w-[200px]">
                {title && (
                  <h3 className="font-semibold text-sm text-white truncate">
                    {title.length > 25 ? title.slice(0, 25) + '...' : title}
                  </h3>
                )}
                {channelTitle && (
                  <p className="text-xs text-white/70 truncate">{channelTitle}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Right Controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -10 }}
        className="absolute top-4 right-4 flex items-center gap-2 z-10"
      >
        <button
          onClick={handleFullscreen}
          className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all border border-white/20"
        >
          <Maximize className="w-5 h-5 md:w-4 md:h-4 text-white" />
        </button>

        <button
          onClick={handleMuteToggle}
          className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all border border-white/20"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 md:w-4 md:h-4 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 md:w-4 md:h-4 text-white" />
          )}
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 backdrop-blur-sm flex items-center justify-center hover:from-red-600 hover:to-pink-600 transition-all border border-white/20"
          >
            <X className="w-5 h-5 md:w-4 md:h-4 text-white" />
          </button>
        )}
      </motion.div>

      {/* Bottom Controls Bar - Progress & Play/Pause */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: showControls || isPaused ? 1 : 0, y: showControls || isPaused ? 0 : 10 }}
        className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8 bg-gradient-to-t from-black/60 to-transparent"
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          onMouseDown={handleSeekStart}
          onMouseUp={handleSeekEnd}
          onMouseLeave={handleSeekEnd}
          className="w-full h-2 md:h-1.5 bg-white/30 rounded-full cursor-pointer group/progress mb-3 relative"
        >
          {/* Progress Track */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 relative"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          >
            {/* Seek Handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={handlePauseToggle}
              className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
            >
              {isPaused ? (
                <Play className="w-6 h-6 md:w-5 md:h-5 text-white fill-white ml-0.5" />
              ) : (
                <Pause className="w-6 h-6 md:w-5 md:h-5 text-white" />
              )}
            </button>

            {/* Time Display */}
            <span className="text-white text-sm font-medium tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Center replay button when ended */}
      {isEnded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/40"
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

      {/* Center pause indicator */}
      <AnimatePresence>
        {isPaused && !isEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
