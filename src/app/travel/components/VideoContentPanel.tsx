'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Utensils, Camera, Hotel, Landmark, ExternalLink } from 'lucide-react';
import type { VideoAnalysis, VideoPlace, YouTubeVideo } from '@/types/video';
import type { TravelPlace } from '@/lib/travel/types';

// Client-side cache for video analysis (persists during browser session)
const videoAnalysisCache = new Map<string, VideoAnalysis>();

interface VideoContentPanelProps {
  video: YouTubeVideo;
  cityName: string;
  onPlaceClick: (place: TravelPlace) => void;
}

// Get icon for place type
function getPlaceIcon(type: string) {
  switch (type) {
    case 'restaurant':
      return Utensils;
    case 'hotel':
      return Hotel;
    case 'landmark':
      return Landmark;
    case 'attraction':
    default:
      return Camera;
  }
}

export function VideoContentPanel({ video, cityName, onPlaceClick }: VideoContentPanelProps) {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPlace, setLoadingPlace] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cacheKey = `${video.videoId}:${cityName}`;

    // Check cache first
    const cached = videoAnalysisCache.get(cacheKey);
    if (cached) {
      setAnalysis(cached);
      setIsLoading(false);
      return;
    }

    const analyzeVideo = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/travel/videos/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.videoId,
            title: video.title,
            description: video.description,
            cityName,
          }),
        });

        const data = await response.json();

        if (data.error && !data.summary) {
          setError(data.error);
        } else {
          const analysisData: VideoAnalysis = {
            videoId: data.videoId || video.videoId,
            summary: data.summary,
            places: data.places || [],
            analyzedAt: data.analyzedAt || Date.now(),
          };
          // Cache the result
          videoAnalysisCache.set(cacheKey, analysisData);
          setAnalysis(analysisData);
        }
      } catch (err) {
        console.error('Failed to analyze video:', err);
        setError('Unable to analyze video content');
      } finally {
        setIsLoading(false);
      }
    };

    analyzeVideo();
  }, [video.videoId, video.title, video.description, cityName]);

  const handlePlaceClick = async (place: VideoPlace) => {
    setLoadingPlace(place.name);

    try {
      const response = await fetch(
        `/api/travel/videos/place-details?name=${encodeURIComponent(place.name)}&city=${encodeURIComponent(cityName)}`
      );
      const data = await response.json();

      if (data.place) {
        onPlaceClick(data.place);
      } else {
        // Show error toast or fallback
        console.error('Place not found:', place.name);
      }
    } catch (err) {
      console.error('Failed to fetch place details:', err);
    } finally {
      setLoadingPlace(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full"
    >
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-lg h-full">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing video content...</span>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
            <div className="flex gap-2 mt-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="text-center py-2 text-gray-500 text-sm">
            {error}
          </div>
        ) : analysis ? (
          // Content
          <div className="space-y-4">
            {/* Summary */}
            <div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Places */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <MapPin className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Places Mentioned
                </span>
              </div>

              {analysis.places.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {analysis.places.map((place, index) => {
                      const Icon = getPlaceIcon(place.type);
                      const isLoadingPlace = loadingPlace === place.name;

                      return (
                        <motion.button
                          key={place.name}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handlePlaceClick(place)}
                          disabled={isLoadingPlace}
                          className={`
                            inline-flex items-center gap-1.5 px-3 py-2 rounded-xl
                            text-sm font-medium transition-all shadow-sm
                            ${isLoadingPlace
                              ? 'bg-purple-100 text-purple-400 cursor-wait'
                              : 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 hover:scale-105 active:scale-95 border border-purple-100'
                            }
                          `}
                        >
                          {isLoadingPlace ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" />
                          )}
                          <span>{place.name}</span>
                          {!isLoadingPlace && (
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          )}
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No specific places mentioned in this video
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
