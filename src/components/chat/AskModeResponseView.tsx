'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MessageSquare,
  Lightbulb,
  MapPin,
  CheckCircle2,
  XCircle,
  Info,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { WhyPlaceCard } from './WhyPlaceCard';
import { PlaceWithWhy } from './PlaceCardGroup';
import { VideoFeaturedCard } from './VideoFeaturedCard';
import { VideoSearchResults } from './VideoSearchResults';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { PlaceCard } from '@/types';
import type { ChatVideoResult, VideoAnalysis, SmartVideoResult } from '@/types/video';
import type { TravelPlace } from '@/lib/travel/types';
import { cn } from '@/lib/utils';
import { extractWhyFromMarkdown, enrichCardsWithWhy } from '@/lib/ai/whyExtractor';
import { buildEmbedUrl, sendYouTubeCommand } from '@/lib/video/youtube';

export interface AskModeResponseViewProps {
  markdown: string;
  cards?: PlaceWithWhy[];
  videos?: ChatVideoResult[];
  videoAnalysis?: VideoAnalysis;
  smartVideoResult?: SmartVideoResult;
  cityName?: string;
  onAskFollowUp?: (question: string) => void;
  savedPlaceIds?: Set<string>;
  onSavePlace?: (place: PlaceCard) => void;
  onViewDetails?: (place: PlaceCard) => void;
  onVideoPlaceClick?: (place: TravelPlace) => void;
  className?: string;
}

/**
 * Card-first response renderer for Ask mode
 *
 * Design: Video-first layout with featured video, summary, places, and follow-ups
 * Visual-first approach for travel discovery
 */
export function AskModeResponseView({
  markdown,
  cards,
  videos,
  videoAnalysis,
  smartVideoResult,
  cityName,
  onAskFollowUp,
  savedPlaceIds = new Set(),
  onSavePlace,
  onViewDetails,
  onVideoPlaceClick,
  className,
}: AskModeResponseViewProps) {
  // State for featured video selection
  const [featuredVideoId, setFeaturedVideoId] = useState<string | null>(null);

  // Extract insight text from markdown
  const insightText = useMemo(() => extractInsight(markdown), [markdown]);

  // Extract key highlights from markdown
  const highlights = useMemo(() => extractHighlights(markdown), [markdown]);

  // Extract pro tip from markdown
  const proTip = useMemo(() => extractProTip(markdown), [markdown]);

  // Extract dynamic follow-up suggestions from markdown
  const followUpSuggestions = useMemo(() => extractFollowUps(markdown), [markdown]);

  // Extract "why" information from AI markdown
  const extractedWhy = useMemo(() => extractWhyFromMarkdown(markdown), [markdown]);

  // Enrich cards with AI-extracted why information
  const enrichedCards = useMemo(
    () => enrichCardsWithWhy(cards || [], extractedWhy),
    [cards, extractedWhy]
  );

  // Group enriched cards by type for display
  const groupedCards = useMemo(() => groupCardsByType(enrichedCards), [enrichedCards]);

  // Get category entries
  const categoryEntries = Object.entries(groupedCards);

  // Get featured video (first one or selected)
  const featuredVideo = useMemo(() => {
    if (!videos || videos.length === 0) return null;
    if (featuredVideoId) {
      return videos.find(v => v.videoId === featuredVideoId) || videos[0];
    }
    return videos[0];
  }, [videos, featuredVideoId]);

  // Get remaining videos for carousel
  const remainingVideos = useMemo(() => {
    if (!videos || videos.length <= 1) return [];
    return videos.filter(v => v.videoId !== featuredVideo?.videoId);
  }, [videos, featuredVideo]);

  // Handle video selection from carousel
  const handleVideoSelect = (video: ChatVideoResult) => {
    setFeaturedVideoId(video.videoId);
  };

  // If no content, show nothing
  if (categoryEntries.length === 0 && !insightText && (!videos || videos.length === 0) && !smartVideoResult) {
    return null;
  }

  // If we have smart video result, use natural AI response layout
  if (smartVideoResult && smartVideoResult.videos.length > 0) {
    return (
      <div className={cn('w-full space-y-6', className)}>
        {/* SMART VIDEO RESULT: Natural AI Response with Beautiful Markdown */}
        {smartVideoResult.aiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Travel Insights
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Based on {smartVideoResult.videos.length} travel videos
                  </p>
                </div>
              </div>
            </div>

            {/* Content with Markdown */}
            <div className="p-5">
              <MarkdownRenderer
                content={smartVideoResult.aiResponse}
                className="text-gray-700 dark:text-gray-300"
              />
            </div>
          </motion.div>
        )}

        {/* SMART VIDEO RESULT: Video Grid */}
        <SmartVideoGrid videos={smartVideoResult.videos} />

        {/* SECTION: Places Mentioned from Cards */}
        {categoryEntries.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Places Mentioned
              </h3>
            </div>
            {categoryEntries.map(([category, places]) => (
              <CardSection
                key={category}
                title={category}
                places={places}
                savedPlaceIds={savedPlaceIds}
                onSavePlace={onSavePlace}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        )}

        {/* Follow-up Suggestions */}
        <FollowUpChips suggestions={followUpSuggestions} onSelect={onAskFollowUp} />
      </div>
    );
  }

  // Original layout for non-smart video results
  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* SECTION 1: Featured Video - Compact embed with AI analysis */}
      {featuredVideo && (
        <VideoFeaturedCard
          video={featuredVideo}
          analysis={videoAnalysis}
          autoPlay={true}
        />
      )}

      {/* SECTION 2: Summary with Highlights - Only show if there's no video analysis */}
      {!videoAnalysis && insightText && insightText.length > 20 && (
        <SummarySection
          insight={insightText}
          highlights={highlights}
          proTip={proTip}
        />
      )}

      {/* SECTION 3: More Videos Carousel */}
      {remainingVideos.length > 0 && (
        <VideoSearchResults
          videos={remainingVideos}
          title="More Videos"
          onVideoSelect={handleVideoSelect}
          selectedVideoId={featuredVideo?.videoId}
        />
      )}

      {/* SECTION 4: Places Mentioned */}
      {categoryEntries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Places Mentioned
            </h3>
          </div>
          {categoryEntries.map(([category, places]) => (
            <CardSection
              key={category}
              title={category}
              places={places}
              savedPlaceIds={savedPlaceIds}
              onSavePlace={onSavePlace}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}

      {/* SECTION 5: Follow-up Suggestions */}
      <FollowUpChips suggestions={followUpSuggestions} onSelect={onAskFollowUp} />
    </div>
  );
}

/**
 * Extract insight text from AI markdown response
 */
function extractInsight(markdown: string): string {
  if (!markdown?.trim()) return '';

  // Try to find AI Insight section
  const insightMatch = markdown.match(/###?\s*🤖?\s*AI Insight\s*\n+(.+?)(?=\n\n|---|###|$)/i);
  if (insightMatch) {
    return insightMatch[1].trim();
  }

  // Fallback: first non-empty line that's not a header or separator
  const lines = markdown.split('\n').filter(l => {
    const trimmed = l.trim();
    return trimmed &&
           !trimmed.startsWith('#') &&
           !trimmed.startsWith('---') &&
           !trimmed.startsWith('- ');
  });

  const firstLine = lines[0]?.trim() || '';

  // Clean up any remaining markdown artifacts
  return firstLine
    .replace(/^\*\*(.+)\*\*$/, '$1')  // Remove bold
    .replace(/^_(.+)_$/, '$1')         // Remove italic
    .slice(0, 150);                     // Limit length
}

/**
 * Default follow-up suggestions when AI doesn't provide any
 */
const DEFAULT_FOLLOW_UPS = [
  'Show more options',
  'Compare prices',
  'Hidden gems nearby',
];

/**
 * Extract follow-up suggestions from AI markdown response
 */
function extractFollowUps(markdown: string): string[] {
  if (!markdown?.trim()) return DEFAULT_FOLLOW_UPS;

  // Try to find "Want more?" section
  const followUpMatch = markdown.match(/###?\s*💬?\s*Want more\??\s*\n+([\s\S]*?)(?=\n\n---|$)/i);

  if (followUpMatch) {
    const content = followUpMatch[1];
    const suggestions: string[] = [];

    // Parse bullet points
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        const suggestion = trimmed
          .replace(/^[-•]\s*/, '')
          .replace(/^\[(.+)\]$/, '$1')  // Remove brackets if wrapped
          .trim();
        if (suggestion && suggestion.length < 50) {
          suggestions.push(suggestion);
        }
      }
    }

    if (suggestions.length > 0) {
      return suggestions.slice(0, 4); // Max 4 suggestions
    }
  }

  // Fallback to defaults
  return DEFAULT_FOLLOW_UPS;
}

/**
 * Extract key highlights/bullet points from markdown
 * Only extracts actual highlight content, not section headers
 */
function extractHighlights(markdown: string): string[] {
  if (!markdown?.trim()) return [];

  const highlights: string[] = [];

  // Skip patterns - these are section headers, not highlights
  const skipPatterns = [
    /restaurants?\s*\(\d+\)/i,
    /hotels?\s*\(\d+\)/i,
    /activities?\s*\(\d+\)/i,
    /places?\s*\(\d+\)/i,
    /want\s*more/i,
    /ask\s*me/i,
    /follow\s*up/i,
  ];

  const shouldSkip = (text: string): boolean => {
    return skipPatterns.some(pattern => pattern.test(text));
  };

  // Look for explicit highlight sections with bullet points
  const highlightSectionMatch = markdown.match(
    /###?\s*(?:🎯|Top|Key|Best)\s*(?:Picks?|Highlights?|Spots?|Experiences?)?\s*:?\s*\n+([\s\S]*?)(?=\n\n###|\n\n---|\n\n💬|$)/i
  );

  if (highlightSectionMatch) {
    const lines = highlightSectionMatch[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Only process actual bullet points
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        const text = trimmed
          .replace(/^[-•*]\s*/, '')
          .replace(/^\*\*(.+)\*\*/, '$1') // Remove bold
          .trim();
        if (text && text.length > 10 && text.length < 150 && !shouldSkip(text) && !highlights.includes(text)) {
          highlights.push(text);
        }
      }
    }
  }

  // If no explicit section, look for numbered recommendations
  if (highlights.length === 0) {
    const numberedMatches = markdown.matchAll(/^\d+\.\s*\*\*(.+?)\*\*\s*[-–]\s*(.+?)$/gm);
    for (const match of numberedMatches) {
      const text = `${match[1]} - ${match[2]}`.trim();
      if (text && text.length > 10 && !shouldSkip(text)) {
        highlights.push(text);
      }
    }
  }

  return highlights.slice(0, 5); // Max 5 highlights
}

/**
 * Extract pro tip from markdown
 */
function extractProTip(markdown: string): string | null {
  if (!markdown?.trim()) return null;

  // Look for pro tip patterns
  const tipPatterns = [
    /[💡⏰🔑]\s*(?:Pro\s*)?Tip:?\s*(.+?)(?=\n\n|$)/i,
    /###?\s*(?:💡|Pro\s*Tip|Local\s*Tip)\s*\n+(.+?)(?=\n\n|###|$)/i,
  ];

  for (const pattern of tipPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Summary Section - Structured insight with highlights and pro tip
 */
function SummarySection({
  insight,
  highlights,
  proTip,
}: {
  insight?: string;
  highlights: string[];
  proTip?: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
    >
      {/* Main Insight */}
      {insight && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
            {insight}
          </p>
        </div>
      )}

      {/* Key Highlights */}
      {highlights.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
            <span className="text-base">🎯</span> Key Highlights
          </p>
          <ul className="space-y-1.5 pl-6">
            {highlights.map((highlight, index) => (
              <li
                key={index}
                className="text-sm text-gray-700 dark:text-gray-300 list-disc"
              >
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pro Tip */}
      {proTip && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Pro Tip:</span> {proTip}
          </p>
        </div>
      )}
    </motion.div>
  );
}

/**
 * AI Insight Section - Clean, minimal text with icon (legacy, kept for compatibility)
 */
function InsightSection({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
        {text}
      </p>
    </motion.div>
  );
}

/**
 * Group cards by their type for display
 */
function groupCardsByType(cards?: PlaceWithWhy[]): Record<string, PlaceWithWhy[]> {
  if (!cards?.length) return {};

  return cards.reduce((acc, card) => {
    const category = getCategoryName(card.type);
    if (!acc[category]) acc[category] = [];
    acc[category].push(card);
    return acc;
  }, {} as Record<string, PlaceWithWhy[]>);
}

/**
 * Get display category name from card type
 */
function getCategoryName(type: string): string {
  const map: Record<string, string> = {
    restaurant: 'Restaurants',
    hotel: 'Hotels',
    activity: 'Activities',
    location: 'Places',
  };
  return map[type] || 'Recommendations';
}

/**
 * Get emoji for category
 */
function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    Restaurants: '🍽️',
    Hotels: '🏨',
    Activities: '🎯',
    Places: '📍',
    Recommendations: '✨',
  };
  return map[category] || '✨';
}

/**
 * Card Section - Category header + horizontal scroll of cards
 */
function CardSection({
  title,
  places,
  savedPlaceIds,
  onSavePlace,
  onViewDetails,
}: {
  title: string;
  places: PlaceWithWhy[];
  savedPlaceIds: Set<string>;
  onSavePlace?: (place: PlaceCard) => void;
  onViewDetails?: (place: PlaceCard) => void;
}) {
  const emoji = getCategoryEmoji(title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({places.length})
        </span>
      </div>

      {/* Horizontal Scroll Cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scroll-smooth snap-x snap-mandatory scrollbar-hide">
        {places.map((place) => (
          <WhyPlaceCard
            key={place.id}
            place={place}
            compact
            isSaved={savedPlaceIds.has(place.id)}
            onSave={() => onSavePlace?.(place)}
            onViewDetails={() => onViewDetails?.(place)}
            className="snap-start flex-shrink-0 w-72"
          />
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Follow-up Chips - Dynamic suggested questions from AI response
 */
function FollowUpChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect?: (question: string) => void;
}) {
  if (!suggestions.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="pt-4"
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
        <MessageSquare className="w-4 h-4" />
        Ask me more
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSelect?.(suggestion)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium',
              'bg-purple-50 dark:bg-purple-900/20',
              'text-purple-700 dark:text-purple-300',
              'hover:bg-purple-100 dark:hover:bg-purple-900/40',
              'transition-colors'
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Smart Video Grid - Grid of video thumbnails with playback
 * Clicking a video plays it at the top with analysis panel on the side
 */
function SmartVideoGrid({
  videos,
}: {
  videos: SmartVideoResult['videos'];
}) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (videos.length === 0) return null;

  // Find playing video and its analysis
  const playingVideo = videos.find(v => v.video.videoId === playingVideoId);
  const remainingVideos = playingVideoId
    ? videos.filter(v => v.video.videoId !== playingVideoId)
    : videos;

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (iframeRef.current) {
      sendYouTubeCommand(iframeRef.current, isMuted ? 'unMute' : 'mute');
    }
    setIsMuted(!isMuted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      {/* PLAYING VIDEO AT TOP */}
      <AnimatePresence>
        {playingVideo && (
          <PlayingVideoSection
            video={playingVideo.video}
            isMuted={isMuted}
            iframeRef={iframeRef}
            onMuteToggle={handleMuteToggle}
            onClose={() => setPlayingVideoId(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Play className="w-5 h-5 text-purple-500" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {playingVideoId ? 'More Videos' : 'Videos Analyzed'}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({remainingVideos.length})
        </span>
      </div>

      {/* VIDEO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {remainingVideos.map(({ video }) => (
          <motion.div
            key={video.videoId}
            whileHover={{ scale: 1.02 }}
            className="group cursor-pointer"
            onClick={() => setPlayingVideoId(video.videoId)}
          >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              {/* Duration Badge */}
              {video.duration && (
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
                  {video.duration}
                </div>
              )}
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-5 h-5 text-gray-900 fill-gray-900 ml-0.5" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
              {video.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {video.channelTitle}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Playing Video Section - Shows video player (60%) with summary panel (40%)
 * Matches the Explore page VideoContentPanel design
 */
function PlayingVideoSection({
  video,
  isMuted,
  iframeRef,
  onMuteToggle,
  onClose,
}: {
  video: SmartVideoResult['videos'][0]['video'];
  isMuted: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onMuteToggle: () => void;
  onClose: () => void;
}) {
  const [videoAnalysis, setVideoAnalysis] = useState<{
    summary: string;
    places: Array<{ name: string; type: string }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch video analysis when component mounts
  useEffect(() => {
    async function fetchAnalysis() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/chat/analyze-video-deep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.videoId,
            title: video.title,
            description: video.description || '',
            destination: video.title, // Use video title as context for destination
            userQuery: 'Summarize this video and extract places mentioned for travelers',
          }),
        });

        // Parse response even if not ok (API returns fallback data on error)
        const data = await response.json();
        setVideoAnalysis({
          summary: data.summary || 'Watch this video to learn more about this destination.',
          places: data.places || [],
        });
      } catch (error) {
        console.error('Failed to fetch video analysis:', error);
        setVideoAnalysis({
          summary: 'Watch this video to learn more about this destination.',
          places: [],
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalysis();
  }, [video.videoId, video.title, video.description]);

  // Get icon for place type
  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'restaurant':
        return '🍽️';
      case 'hotel':
        return '🏨';
      case 'landmark':
        return '🏛️';
      case 'attraction':
        return '📸';
      default:
        return '📍';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700"
    >
      <div className="flex flex-col md:flex-row">
        {/* Video Player (60%) */}
        <div className="relative aspect-video md:w-[60%] bg-black">
          <iframe
            ref={iframeRef}
            src={buildEmbedUrl(video.videoId, { autoplay: true, muted: isMuted })}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />

          {/* Top-left: Channel badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
            <div className="text-white text-xs">
              <p className="font-medium line-clamp-1 max-w-[120px]">{video.channelTitle}</p>
            </div>
          </div>

          {/* Top-right: Controls */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={onMuteToggle}
              className="p-2 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors text-white"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-pink-500 hover:bg-pink-600 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom-left: Title overlay */}
          <div className="absolute bottom-3 left-3 right-16">
            <p className="text-white text-sm font-medium line-clamp-1 drop-shadow-lg">
              {video.title}
            </p>
          </div>
        </div>

        {/* Summary Panel (40%) - Matches Explore VideoContentPanel */}
        <div className="md:w-[40%] p-5 bg-white dark:bg-gray-900 overflow-y-auto max-h-[400px]">
          {isLoading ? (
            // Loading skeleton - matches Explore page
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Analyzing video content...</span>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
              </div>
              <div className="flex gap-2 mt-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                ))}
              </div>
            </div>
          ) : videoAnalysis ? (
            // Content - matches Explore page VideoContentPanel
            <div className="space-y-4">
              {/* Summary */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {videoAnalysis.summary}
                </p>
              </div>

              {/* Places Mentioned */}
              {videoAnalysis.places.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Places Mentioned
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {videoAnalysis.places.map((place, index) => (
                      <motion.button
                        key={place.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-sm bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 hover:scale-105 active:scale-95 border border-purple-100 dark:border-purple-800"
                      >
                        <span>{getPlaceIcon(place.type)}</span>
                        <span>{place.name}</span>
                        <span className="text-purple-400">↗</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration */}
              {video.duration && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Duration: {video.duration}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
