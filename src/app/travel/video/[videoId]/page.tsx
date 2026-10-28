'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin } from 'lucide-react';

import { VideoPlayer, VideoPlacesPanel, VideoOverviewCard, VideoGoodToKnowCard, RelatedVideosList } from '@/components/video';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/adsense/config';
import type { VideoDetails } from '@/lib/video/types';
import type { YouTubeVideo } from '@/types/video';
import { useVideoInsights } from '@/hooks/useVideoInsights';

interface VideoPageProps {
  params: Promise<{ videoId: string }>;
}

export default function VideoPage({ params }: VideoPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { videoId } = use(params);
  const city = searchParams.get('city') || '';

  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);
  const [seekRequest, setSeekRequest] = useState<{ sec: number; nonce: number } | null>(null);

  // Fetch video details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/travel/videos/${videoId}`);
        const data = await response.json();
        if (data.video) {
          setVideoDetails(data.video);
        }
      } catch (error) {
        console.error('Failed to fetch video details:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [videoId]);

  // Read the video itself (captions): summary, key points, tips and the places it names
  const { result: insights, status: insightsStatus, retry: retryInsights } = useVideoInsights({
    videoId,
    title: videoDetails?.title,
    description: videoDetails?.description,
    city,
  });

  // Fetch related videos
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const params = new URLSearchParams({
          title: videoDetails?.title || '',
          limit: '25',
        });
        if (city) {
          params.set('city', city);
        }

        const response = await fetch(`/api/travel/videos/${videoId}/related?${params}`);
        const data = await response.json();
        if (data.videos) {
          setRelatedVideos(data.videos);
        }
      } catch (error) {
        console.error('Failed to fetch related videos:', error);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    if (videoDetails) {
      fetchRelated();
    }
  }, [videoId, videoDetails, city]);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-900">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-b border-purple-100/50 dark:border-purple-900/30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Back</span>
          </button>

          {city && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{city}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Pre-Video Ad Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex justify-center"
        >
          <AdSlot
            slot={AD_SLOTS.VIDEO_CONTENT_PRE}
            format="horizontal"
            responsive={true}
            layout="display"
            priority="high"
          />
        </motion.section>

        {/* Hero Section - Two Column Layout */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row gap-6 items-start"
        >
          {/* Left Column - Video Player (60%) */}
          <div className="w-full lg:w-[60%] xl:w-[65%] lg:sticky lg:top-20 lg:self-start">
            {/* Video Player with Purple Glow */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur-lg opacity-30" />
              <div className="relative ring-2 ring-purple-400/60 shadow-2xl shadow-purple-500/30 rounded-2xl overflow-hidden">
                <VideoPlayer
                  videoId={videoId}
                  durationSeconds={videoDetails?.durationSeconds}
                  seekRequest={seekRequest}
                  className=""
                />
              </div>
            </div>
          </div>

          {/* Right Column - Summary Card (40%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full lg:w-[40%] xl:w-[35%] space-y-6"
          >
            {(() => {
              const seek = (sec: number) => setSeekRequest({ sec, nonce: Date.now() });
              return (
                <>
                  <VideoOverviewCard result={insights} status={insightsStatus} onSeek={seek} />
                  {videoDetails && (
                    <VideoPlacesPanel
                      videoId={videoId}
                      title={videoDetails.title}
                      channel={videoDetails.channelTitle}
                      city={city}
                      result={insights}
                      status={insightsStatus}
                      onRetry={retryInsights}
                      onSeek={seek}
                    />
                  )}
                  <VideoGoodToKnowCard result={insights} status={insightsStatus} onSeek={seek} />
                </>
              );
            })()}

            {/* Sticky Sidebar Ad - Desktop only */}
            <div className="hidden lg:block sticky top-24">
              <AdSlot
                slot={AD_SLOTS.CITY_EXPLORE_SIDEBAR}
                format="rectangle"
                layout="display"
                priority="high"
              />
            </div>
          </motion.div>
        </motion.section>

        {/* Related Videos Section - Horizontal Carousel */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          <RelatedVideosList
            videos={relatedVideos}
            city={city}
            isLoading={isLoadingRelated}
            variant="carousel"
          />
        </motion.section>

        {/* Post-Video Ad Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex justify-center"
        >
          <AdSlot
            slot={AD_SLOTS.VIDEO_CONTENT_POST}
            format="rectangle"
            layout="display"
            priority="low"
          />
        </motion.section>
      </main>
    </div>
  );
}
