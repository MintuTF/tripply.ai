'use client';

import { formatDistanceToNow } from 'date-fns';
import type { VideoDetails } from '@/lib/video/types';

interface VideoInfoProps {
  video: VideoDetails;
  className?: string;
}

/**
 * Format view count with K, M suffixes
 */
function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
}

export function VideoInfo({ video, className = '' }: VideoInfoProps) {
  const publishedDate = video.publishedAt
    ? formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })
    : null;

  // Extract hashtags from title
  const hashtags = video.tags?.slice(0, 5) || [];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Title */}
      <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
        {video.title}
      </h1>

      {/* Channel and stats */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium text-gray-900 dark:text-white">
          {video.channelTitle}
        </span>
        <span className="text-gray-400">•</span>
        <span>{formatViewCount(video.viewCount)}</span>
        {publishedDate && (
          <>
            <span className="text-gray-400">•</span>
            <span>{publishedDate}</span>
          </>
        )}
      </div>

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag, index) => (
            <span
              key={index}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
