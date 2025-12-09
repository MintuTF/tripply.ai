'use client';

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { TripSummary, TripStats, StoryTemplate, MapMarker } from '@/types/story';
import { AnimatedMap } from '../AnimatedMap';
import { calculateBounds, Bounds } from '@/lib/story/mapUtils';
import { format } from 'date-fns';

type IntroSceneProps = {
  tripSummary: TripSummary;
  stats: TripStats;
  template: StoryTemplate;
  // New props for animated map
  allMarkers?: MapMarker[];
  bounds?: Bounds;
};

export const IntroScene: React.FC<IntroSceneProps> = ({
  tripSummary,
  stats,
  template,
  allMarkers = [],
  bounds,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Animation values
  const titleOpacity = interpolate(frame, [fps * 0.8, fps * 1.3], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const titleY = interpolate(frame, [fps * 0.8, fps * 1.3], [30, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const subtitleOpacity = interpolate(frame, [fps * 1.0, fps * 1.5], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const statsOpacity = interpolate(frame, [fps * 1.3, fps * 1.8], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Map overlay fades in as title appears
  const overlayOpacity = interpolate(frame, [fps * 0.5, fps * 1.2], [0.1, 0.65], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const styles = getTemplateStyles(template);
  const formattedDates = formatDateRange(tripSummary.startDate, tripSummary.endDate);

  // Calculate bounds if we have markers
  const mapBounds = bounds || (allMarkers.length > 0 ? calculateBounds(allMarkers) : undefined);

  // Determine whether to show animated map or fallback to cover image
  const showAnimatedMap = allMarkers.length > 0;

  return (
    <AbsoluteFill>
      {/* Animated Map Background with zoom effect */}
      {showAnimatedMap && mapBounds && (
        <AbsoluteFill>
          <AnimatedMap
            markers={allMarkers}
            bounds={mapBounds}
            template={template}
            initialZoom={3} // Start zoomed out
            targetZoom={1} // Zoom in to destination
            pinRevealStart={Math.floor(fps * 0.3)} // Start showing pins early
            pinRevealDelay={Math.floor(fps * 0.15)} // Stagger pins
            showConnectorLines={true}
            connectorRevealStart={Math.floor(fps * 0.5)}
            width={1080}
            height={1920}
          />
        </AbsoluteFill>
      )}

      {/* Fallback: Cover image if no markers */}
      {!showAnimatedMap && tripSummary.coverImage && (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <img
            src={tripSummary.coverImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${interpolate(frame, [0, durationInFrames], [1, 1.1])})`,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Gradient overlay for text readability */}
      <AbsoluteFill
        style={{
          background: styles.overlayGradient,
          opacity: overlayOpacity,
        }}
      />

      {/* Content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
          textAlign: 'center',
        }}
      >
        {/* Destination */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            color: styles.textColor,
            fontSize: 72,
            fontWeight: 800,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          {tripSummary.destination}
        </div>

        {/* Trip Title */}
        <div
          style={{
            opacity: subtitleOpacity,
            color: styles.subtitleColor,
            fontSize: 28,
            fontWeight: 500,
            textShadow: '0 2px 10px rgba(0,0,0,0.4)',
            marginBottom: 32,
          }}
        >
          {tripSummary.title}
        </div>

        {/* Date Range */}
        <div
          style={{
            opacity: subtitleOpacity,
            color: styles.subtitleColor,
            fontSize: 22,
            fontWeight: 400,
            textShadow: '0 2px 10px rgba(0,0,0,0.4)',
            marginBottom: 48,
          }}
        >
          {formattedDates}
        </div>

        {/* Quick Stats */}
        <div
          style={{
            opacity: statsOpacity,
            display: 'flex',
            gap: 40,
            justifyContent: 'center',
          }}
        >
          <StatBadge
            value={stats.totalDays}
            label="Days"
            template={template}
          />
          <StatBadge
            value={stats.totalPlaces}
            label="Places"
            template={template}
          />
          {stats.cities.length > 0 && (
            <StatBadge
              value={stats.cities.length}
              label={stats.cities.length === 1 ? 'City' : 'Cities'}
              template={template}
            />
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type StatBadgeProps = {
  value: number;
  label: string;
  template: StoryTemplate;
};

const StatBadge: React.FC<StatBadgeProps> = ({ value, label, template }) => {
  const styles = getTemplateStyles(template);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: styles.badgeBg,
        borderRadius: 16,
        padding: '16px 24px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          color: styles.textColor,
          fontSize: 36,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: styles.subtitleColor,
          fontSize: 14,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </div>
    </div>
  );
};

function getTemplateStyles(template: StoryTemplate) {
  const styles: Record<StoryTemplate, {
    textColor: string;
    subtitleColor: string;
    overlayGradient: string;
    badgeBg: string;
  }> = {
    minimal: {
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.9)',
      overlayGradient: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))',
      badgeBg: 'rgba(255,255,255,0.15)',
    },
    aesthetic: {
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.85)',
      overlayGradient: 'linear-gradient(to bottom, rgba(139,90,43,0.2), rgba(80,50,25,0.7))',
      badgeBg: 'rgba(245,230,211,0.2)',
    },
    trendy: {
      textColor: '#E94560',
      subtitleColor: '#FFFFFF',
      overlayGradient: 'linear-gradient(to bottom, rgba(26,26,46,0.5), rgba(26,26,46,0.9))',
      badgeBg: 'rgba(233,69,96,0.2)',
    },
    luxury: {
      textColor: '#D4AF37',
      subtitleColor: 'rgba(255,255,255,0.9)',
      overlayGradient: 'linear-gradient(to bottom, rgba(13,13,13,0.3), rgba(13,13,13,0.85))',
      badgeBg: 'rgba(212,175,55,0.15)',
    },
  };

  return styles[template];
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
  }

  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
}
