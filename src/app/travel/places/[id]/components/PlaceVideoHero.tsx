'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video } from 'lucide-react';
import { VideoPlayer, VideoSummary } from '@/components/video';
import type { TravelPlace } from '@/lib/travel/types';
import type { YouTubeVideo } from '@/types/video';
import type { VideoPageAnalysis } from '@/lib/video/types';

interface PlaceVideoHeroProps {
  place: TravelPlace;
  onVideosLoaded?: (videos: YouTubeVideo[]) => void;
}

export function PlaceVideoHero({ place, onVideosLoaded }: PlaceVideoHeroProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [analysis, setAnalysis] = useState<VideoPageAnalysis | null>(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Fetch videos for this place
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const params = new URLSearchParams({
          type: 'place',
          name: place.name,
          id: place.id,
        });
        if (place.area) {
          params.set('cityName', place.area);
        }

        const response = await fetch(`/api/travel/videos?${params}`);
        const data = await response.json();

        if (data.videos && data.videos.length > 0) {
          setVideos(data.videos);
          setCurrentVideo(data.videos[0]);
          onVideosLoaded?.(data.videos);
        }
      } catch (error) {
        console.error('Failed to fetch place videos:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchVideos();
  }, [place.id, place.name, place.area, onVideosLoaded]);

  // Fetch video analysis when current video changes
  useEffect(() => {
    if (!currentVideo) return;

    const fetchAnalysis = async () => {
      setIsLoadingAnalysis(true);
      try {
        const response = await fetch('/api/travel/ai/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'videoAnalysis',
            videoId: currentVideo.videoId,
            videoTitle: currentVideo.title,
            videoDescription: currentVideo.description || '',
            city: place.area || place.name,
          }),
        });

        const data = await response.json();
        if (data.analysis) {
          setAnalysis(data.analysis);
        } else {
          // Fallback summary
          setAnalysis({
            summary: `This video features ${place.name}${place.area ? ` in ${place.area}` : ''}. Watch to discover what makes this place special and get insider tips from the creator.`,
            places: [{ name: place.name, type: place.categories[0] || 'attraction' }],
            highlights: [
              'Local insights and recommendations',
              'Visual tour of the location',
              'Tips for visitors',
            ],
            analyzedAt: Date.now(),
          });
        }
      } catch (error) {
        console.error('Failed to fetch video analysis:', error);
        // Set fallback on error
        setAnalysis({
          summary: `Explore ${place.name} through this video. Discover the atmosphere, offerings, and what visitors love about this place.`,
          places: [{ name: place.name, type: place.categories[0] || 'attraction' }],
          highlights: [],
          analyzedAt: Date.now(),
        });
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    fetchAnalysis();
  }, [currentVideo, place.name, place.area, place.categories]);

  // Loading state
  if (isLoadingVideos) {
    return (
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Video skeleton */}
            <div className="w-full lg:w-[60%]">
              <div className="aspect-video rounded-2xl bg-purple-100 dark:bg-purple-900/30 animate-pulse" />
            </div>
            {/* Summary skeleton */}
            <div className="w-full lg:w-[40%]">
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <div className="h-4 bg-purple-100 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-purple-100 rounded w-full animate-pulse" />
                <div className="h-4 bg-purple-100 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // No videos found - show placeholder
  if (!currentVideo) {
    return (
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-purple-100/50 text-center">
            <Video className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No videos available yet
            </h3>
            <p className="text-gray-500 text-sm">
              We&apos;re working on finding great videos about {place.name}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-6"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Video Player with purple glow */}
          <div className="w-full lg:w-[60%]">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur-lg opacity-30" />
              <div className="relative ring-2 ring-purple-400/60 shadow-2xl shadow-purple-500/30 rounded-2xl overflow-hidden">
                <VideoPlayer
                  videoId={currentVideo.videoId}
                  title={currentVideo.title}
                  channelTitle={currentVideo.channelTitle}
                />
              </div>
            </div>
          </div>

          {/* Right: AI Video Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full lg:w-[40%]"
          >
            <VideoSummary
              analysis={analysis}
              isLoading={isLoadingAnalysis}
              variant="card"
            />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
