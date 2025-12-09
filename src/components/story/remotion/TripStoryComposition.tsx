'use client';

import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { StoryData, StoryTemplate, MapMarker } from '@/types/story';
import { IntroScene } from './scenes/IntroScene';
import { MapOverviewScene } from './scenes/MapOverviewScene';
import { ItineraryFlowScene } from './scenes/ItineraryFlowScene';
import { DayScene } from './scenes/DayScene';
import { OutroScene } from './scenes/OutroScene';
import { calculateBounds, Bounds } from '@/lib/story/mapUtils';

export type TripStoryProps = {
  storyData: StoryData;
  template: StoryTemplate;
};

// Timing constants (in seconds)
const TIMING = {
  intro: 3,
  mapOverview: 3,
  itineraryFlow: 8, // Main flowing itinerary animation
  dayHeader: 2,
  placeCard: 2,
  outro: 3,
};

/**
 * Extract all markers from story data
 */
function getAllMarkers(storyData: StoryData): MapMarker[] {
  const allMarkers: MapMarker[] = [];
  let globalOrder = 1;

  storyData.days.forEach((day) => {
    day.places.forEach((place) => {
      if (place.coordinates) {
        allMarkers.push({
          lat: place.coordinates.lat,
          lng: place.coordinates.lng,
          label: place.name,
          type: place.type,
          order: globalOrder++,
        });
      }
    });
  });

  return allMarkers;
}

/**
 * Get markers for a specific day
 */
function getDayMarkers(storyData: StoryData, dayIndex: number): MapMarker[] {
  const day = storyData.days.find((d) => d.dayIndex === dayIndex);
  if (!day) return [];

  return day.places
    .filter((place) => place.coordinates)
    .map((place, index) => ({
      lat: place.coordinates!.lat,
      lng: place.coordinates!.lng,
      label: place.name,
      type: place.type,
      order: index + 1,
    }));
}

/**
 * Calculates the total frames and scene timings for the video
 */
export function calculateSceneTimings(
  storyData: StoryData,
  fps: number
): {
  totalFrames: number;
  introStart: number;
  introEnd: number;
  mapStart: number;
  mapEnd: number;
  flowStart: number;
  flowEnd: number;
  dayScenes: { dayIndex: number; start: number; end: number }[];
  outroStart: number;
  outroEnd: number;
} {
  let currentFrame = 0;

  const introStart = currentFrame;
  const introEnd = currentFrame + TIMING.intro * fps;
  currentFrame = introEnd;

  const mapStart = currentFrame;
  const mapEnd = currentFrame + TIMING.mapOverview * fps;
  currentFrame = mapEnd;

  // Itinerary flow scene - the main animated journey
  const flowStart = currentFrame;
  const flowEnd = currentFrame + TIMING.itineraryFlow * fps;
  currentFrame = flowEnd;

  const dayScenes: { dayIndex: number; start: number; end: number }[] = [];
  storyData.days.forEach((day) => {
    const dayStart = currentFrame;
    // Day header + place cards
    const dayDuration =
      TIMING.dayHeader * fps + day.places.length * TIMING.placeCard * fps;
    const dayEnd = currentFrame + dayDuration;
    dayScenes.push({ dayIndex: day.dayIndex, start: dayStart, end: dayEnd });
    currentFrame = dayEnd;
  });

  const outroStart = currentFrame;
  const outroEnd = currentFrame + TIMING.outro * fps;
  currentFrame = outroEnd;

  return {
    totalFrames: currentFrame,
    introStart,
    introEnd,
    mapStart,
    mapEnd,
    flowStart,
    flowEnd,
    dayScenes,
    outroStart,
    outroEnd,
  };
}

/**
 * Main composition component for trip story video
 */
export const TripStoryComposition: React.FC<TripStoryProps> = ({
  storyData,
  template,
}) => {
  const { fps } = useVideoConfig();
  const timings = calculateSceneTimings(storyData, fps);

  // Get all markers from the story data
  const allMarkers = getAllMarkers(storyData);
  const allBounds: Bounds | undefined = allMarkers.length > 0 ? calculateBounds(allMarkers) : undefined;

  // Get captions for each day
  const getDayCaptions = (dayIndex: number) => {
    return storyData.captions.find((c) => c.dayIndex === dayIndex);
  };

  // Get map snapshot for each day
  const getDayMapSnapshot = (dayIndex: number) => {
    return storyData.mapSnapshots.find((m) => m.dayIndex === dayIndex);
  };

  // Get overview map snapshot (use first one or generate overview)
  const overviewMapUrl = storyData.mapSnapshots[0]?.imageUrl;

  // Prepare day markers and bounds
  const dayMarkersData = storyData.days.map((day) => {
    const markers = getDayMarkers(storyData, day.dayIndex);
    const bounds = markers.length > 0 ? calculateBounds(markers) : undefined;
    return { dayIndex: day.dayIndex, markers, bounds };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: getBackgroundColor(template),
      }}
    >
      {/* Intro Scene - Animated map with zoom from wide to destination */}
      <Sequence from={timings.introStart} durationInFrames={timings.introEnd - timings.introStart}>
        <IntroScene
          tripSummary={storyData.trip}
          stats={storyData.stats}
          template={template}
          allMarkers={allMarkers}
          bounds={allBounds}
        />
      </Sequence>

      {/* Map Overview Scene - All pins revealed with connectors */}
      <Sequence from={timings.mapStart} durationInFrames={timings.mapEnd - timings.mapStart}>
        <MapOverviewScene
          mapUrl={overviewMapUrl}
          stats={storyData.stats}
          template={template}
          allMarkers={allMarkers}
          bounds={allBounds}
        />
      </Sequence>

      {/* Itinerary Flow Scene - Animated journey across all stops */}
      <Sequence from={timings.flowStart} durationInFrames={timings.flowEnd - timings.flowStart}>
        <ItineraryFlowScene
          days={storyData.days}
          allMarkers={allMarkers}
          bounds={allBounds}
          template={template}
          flowDuration={timings.flowEnd - timings.flowStart}
        />
      </Sequence>

      {/* Day Scenes - Each day with its own animated map */}
      {timings.dayScenes.map((dayTiming, index) => {
        const day = storyData.days[index];
        const captions = getDayCaptions(day.dayIndex);
        const mapSnapshot = getDayMapSnapshot(day.dayIndex);
        const dayData = dayMarkersData.find((d) => d.dayIndex === day.dayIndex);
        const previousDayData = index > 0 ? dayMarkersData[index - 1] : undefined;

        return (
          <Sequence
            key={day.dayIndex}
            from={dayTiming.start}
            durationInFrames={dayTiming.end - dayTiming.start}
          >
            <DayScene
              day={day}
              captions={captions}
              mapSnapshot={mapSnapshot}
              totalDays={storyData.days.length}
              template={template}
              headerDuration={TIMING.dayHeader * fps}
              placeDuration={TIMING.placeCard * fps}
              dayMarkers={dayData?.markers}
              dayBounds={dayData?.bounds}
              previousDayBounds={previousDayData?.bounds}
            />
          </Sequence>
        );
      })}

      {/* Outro Scene */}
      <Sequence from={timings.outroStart} durationInFrames={timings.outroEnd - timings.outroStart}>
        <OutroScene
          tripSummary={storyData.trip}
          tripSummaryCaption={storyData.captions[0]?.headline} // Use first day headline as fallback
          stats={storyData.stats}
          template={template}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Get background color based on template
 */
function getBackgroundColor(template: StoryTemplate): string {
  const colors: Record<StoryTemplate, string> = {
    minimal: '#FFFFFF',
    aesthetic: '#F5E6D3',
    trendy: '#1A1A2E',
    luxury: '#0D0D0D',
  };
  return colors[template];
}

/**
 * Get the total duration in frames for the composition
 */
export function getTotalDurationInFrames(storyData: StoryData, fps: number = 30): number {
  return calculateSceneTimings(storyData, fps).totalFrames;
}
