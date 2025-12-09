import { CardType } from './index';

// ============================================
// Story Generator Types
// ============================================

/**
 * Story generation configuration options
 */
export type StoryConfig = {
  template: StoryTemplate;
  duration: StoryDuration;
  includePhotos: boolean;
  musicTrack: string | null;
};

export type StoryTemplate = 'minimal' | 'aesthetic' | 'trendy' | 'luxury';
export type StoryDuration = 'auto' | 15 | 30 | 45;

/**
 * Complete story data for video generation
 */
export type StoryData = {
  trip: TripSummary;
  days: DayPlan[];
  stats: TripStats;
  captions: DayCaptions[];
  mapSnapshots: MapSnapshot[];
};

/**
 * Simplified trip information for story display
 */
export type TripSummary = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  partySize: number;
};

/**
 * A single day's itinerary for the story
 */
export type DayPlan = {
  dayIndex: number;
  date: string;
  places: PlaceItem[];
};

/**
 * Individual place/stop in the itinerary
 */
export type PlaceItem = {
  id: string;
  name: string;
  type: CardType;
  timeSlot?: string;
  coordinates?: { lat: number; lng: number };
  photo?: string;
  address?: string;
  rating?: number;
};

/**
 * Trip statistics for story intro/outro
 */
export type TripStats = {
  totalDays: number;
  totalPlaces: number;
  cities: string[];
  categories: CategoryCount[];
};

export type CategoryCount = {
  type: CardType;
  count: number;
  icon: string;
};

/**
 * AI-generated captions for each day
 */
export type DayCaptions = {
  dayIndex: number;
  headline: string; // e.g., "Day 1 in Seattle"
  description: string; // AI-generated 1-2 sentence summary
  placeHighlights: string[]; // Key place names to display
};

/**
 * Map snapshot image data for a day
 */
export type MapSnapshot = {
  dayIndex: number;
  imageUrl: string;
  bounds: {
    ne: [number, number]; // Northeast corner [lng, lat]
    sw: [number, number]; // Southwest corner [lng, lat]
  };
  markers: MapMarker[];
  routeCoordinates?: [number, number][]; // Path between places
};

export type MapMarker = {
  lat: number;
  lng: number;
  label: string;
  type: CardType;
  order: number;
};

// ============================================
// Video Composition Types
// ============================================

/**
 * Video scene timing configuration
 */
export type SceneTiming = {
  intro: number; // frames
  mapOverview: number;
  dayScene: number; // per day
  placeCard: number; // per place within day
  outro: number;
};

/**
 * Default timing at 30fps
 */
export const DEFAULT_TIMING: SceneTiming = {
  intro: 90, // 3 seconds
  mapOverview: 120, // 4 seconds
  dayScene: 180, // 6 seconds per day
  placeCard: 45, // 1.5 seconds per place
  outro: 60, // 2 seconds
};

/**
 * Video dimensions for different platforms
 */
export type VideoFormat = {
  width: number;
  height: number;
  fps: number;
  name: string;
};

export const VIDEO_FORMATS: Record<string, VideoFormat> = {
  tiktok: { width: 1080, height: 1920, fps: 30, name: 'TikTok / Reels' },
  story: { width: 1080, height: 1920, fps: 30, name: 'Instagram Story' },
  square: { width: 1080, height: 1080, fps: 30, name: 'Square Post' },
  landscape: { width: 1920, height: 1080, fps: 30, name: 'YouTube' },
};

// ============================================
// Template Style Types
// ============================================

/**
 * Style configuration for each template
 */
export type TemplateStyle = {
  name: StoryTemplate;
  displayName: string;
  description: string;
  colors: TemplateColors;
  fonts: TemplateFonts;
  effects: TemplateEffects;
};

export type TemplateColors = {
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentSecondary: string;
  overlay: string;
};

export type TemplateFonts = {
  heading: string;
  body: string;
  accent: string;
  headingWeight: number;
  bodyWeight: number;
};

export type TemplateEffects = {
  grain: boolean;
  grainOpacity: number;
  blur: boolean;
  shadow: boolean;
  gradient: boolean;
  animationStyle: 'subtle' | 'moderate' | 'bold';
};

// ============================================
// Rendering State Types
// ============================================

export type RenderStatus = 'idle' | 'preparing' | 'rendering' | 'complete' | 'error';

export type RenderProgress = {
  status: RenderStatus;
  percent: number;
  currentStage: string;
  error?: string;
};

export type StoryRenderResult = {
  success: boolean;
  videoBlob?: Blob;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  error?: string;
};

// ============================================
// Storage Types
// ============================================

export type SavedStory = {
  id: string;
  tripId: string;
  userId: string;
  config: StoryConfig;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
};
