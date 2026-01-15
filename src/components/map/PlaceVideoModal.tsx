'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { YouTubeVideo } from '@/types/video';

interface PlaceVideoModalProps {
  videos: YouTubeVideo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * Place Video Modal Component
 * Full-screen modal for watching place videos
 * Supports navigation between videos and keyboard controls
 */
export function PlaceVideoModal({
  videos,
  currentIndex,
  onClose,
  onNavigate,
}: PlaceVideoModalProps) {
  const currentVideo = videos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < videos.length - 1;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrev) onNavigate(currentIndex - 1);
          break;
        case 'ArrowRight':
          if (hasNext) onNavigate(currentIndex + 1);
          break;
      }
    },
    [onClose, onNavigate, currentIndex, hasPrev, hasNext]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const goToPrev = () => {
    if (hasPrev) onNavigate(currentIndex - 1);
  };

  const goToNext = () => {
    if (hasNext) onNavigate(currentIndex + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative z-10 w-full max-w-4xl mx-4"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Close video"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Video Container */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
            <iframe
              key={currentVideo.videoId}
              src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&rel=0&modestbranding=1`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              frameBorder="0"
              title={currentVideo.title}
            />
          </div>

          {/* Video Title */}
          <div className="mt-4 text-center">
            <h3 className="text-white text-lg font-medium line-clamp-2">
              {currentVideo.title}
            </h3>
            <p className="text-white/60 text-sm mt-1">
              {currentVideo.channelTitle}
            </p>
          </div>

          {/* Navigation Controls */}
          {videos.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={goToPrev}
                disabled={!hasPrev}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 p-3 rounded-full transition-all ${
                  hasPrev
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
                aria-label="Previous video"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              {/* Next Button */}
              <button
                onClick={goToNext}
                disabled={!hasNext}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 p-3 rounded-full transition-all ${
                  hasNext
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
                aria-label="Next video"
              >
                <ChevronRight className="w-8 h-8" />
              </button>

              {/* Video Counter */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {videos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => onNavigate(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-white w-6'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Go to video ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
