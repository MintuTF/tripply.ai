'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Search } from 'lucide-react';

import { VideoPlayer, VideoSummary, RelatedVideosList } from '@/components/video';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/adsense/config';
import type { VideoDetails, VideoPageAnalysis } from '@/lib/video/types';
import type { YouTubeVideo } from '@/types/video';

interface VideoPageProps {
  params: Promise<{ videoId: string }>;
}

export default function VideoPage({ params }: VideoPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { videoId } = use(params);
  const city = searchParams.get('city') || '';

  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [analysis, setAnalysis] = useState<VideoPageAnalysis | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);
  const [addedPlaces, setAddedPlaces] = useState<string[]>([]);

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

  // Fetch video analysis (AI summary)
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!videoDetails) return;

      try {
        const response = await fetch('/api/travel/ai/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'videoAnalysis',
            videoId,
            videoTitle: videoDetails.title,
            videoDescription: videoDetails.description,
            city,
          }),
        });

        const data = await response.json();
        if (data.analysis) {
          setAnalysis(data.analysis);
        } else {
          setAnalysis({
            summary: `This video explores ${city || 'travel destinations'} and showcases various points of interest. ${videoDetails.description.slice(0, 200)}...`,
            places: [],
            highlights: [
              'Discover local attractions and hidden gems',
              'Get insider tips from experienced travelers',
              'Experience the culture through stunning visuals',
            ],
            analyzedAt: Date.now(),
          });
        }
      } catch (error) {
        console.error('Failed to fetch analysis:', error);
        setAnalysis({
          summary: videoDetails?.description?.slice(0, 300) || 'Explore this travel destination.',
          places: [],
          highlights: [],
          analyzedAt: Date.now(),
        });
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    if (videoDetails) {
      fetchAnalysis();
    }
  }, [videoDetails, videoId, city]);

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

  const handleAddPlace = (placeName: string, placeType: string) => {
    if (!addedPlaces.includes(placeName)) {
      setAddedPlaces([...addedPlaces, placeName]);
      console.log(`Adding place: ${placeName} (${placeType})`);
    }
  };

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
          <div className="w-full lg:w-[60%] xl:w-[65%]">
            {/* Video Player with Purple Glow */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur-lg opacity-30" />
              <div className="relative ring-2 ring-purple-400/60 shadow-2xl shadow-purple-500/30 rounded-2xl overflow-hidden">
                <VideoPlayer
                  videoId={videoId}
                  title={videoDetails?.title}
                  channelTitle={videoDetails?.channelTitle}
                  durationSeconds={videoDetails?.durationSeconds}
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
            <VideoSummary
              analysis={analysis}
              isLoading={isLoadingAnalysis}
              onAddPlace={handleAddPlace}
              addedPlaces={addedPlaces}
              variant="card"
            />

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

      {/* Floating Find Place Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 rounded-full shadow-lg shadow-purple-500/20 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 font-medium hover:shadow-xl hover:shadow-purple-500/30 transition-all z-40"
      >
        <Search className="w-4 h-4" />
        <span>Find Place</span>
      </motion.button>
    </div>
  );
}
