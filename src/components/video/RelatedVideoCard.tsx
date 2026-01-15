'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import type { YouTubeVideo } from '@/types/video';

interface RelatedVideoCardProps {
  video: YouTubeVideo;
  city?: string;
  index?: number;
  variant?: 'default' | 'portrait';
}

// Format duration from seconds to MM:SS or HH:MM:SS
function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function RelatedVideoCard({
  video,
  city,
  index = 0,
  variant = 'default',
}: RelatedVideoCardProps) {
  const videoUrl = city
    ? `/travel/video/${video.videoId}?city=${encodeURIComponent(city)}`
    : `/travel/video/${video.videoId}`;

  // Portrait variant - tall card with overlay
  if (variant === 'portrait') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="w-56"
      >
        <Link href={videoUrl} className="block group">
          {/* Card Container */}
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-lg group-hover:shadow-xl transition-shadow">
            {/* Thumbnail */}
            {video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="224px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Duration Badge */}
            {video.durationSeconds && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-white text-xs font-medium">
                {formatDuration(video.durationSeconds)}
              </div>
            )}

            {/* Center Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg"
              >
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              </motion.div>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h4 className="text-white font-medium text-sm line-clamp-2 leading-snug mb-1 group-hover:text-purple-200 transition-colors">
                {video.title}
              </h4>
              <p className="text-white/70 text-xs truncate">
                {video.channelTitle}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Default variant - horizontal row card
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={videoUrl}
        className="flex gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
      >
        {/* Thumbnail */}
        <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="160px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}

          {/* Duration Badge */}
          {video.durationSeconds && (
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
              {formatDuration(video.durationSeconds)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-0.5">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {video.title}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
            {video.channelTitle}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
