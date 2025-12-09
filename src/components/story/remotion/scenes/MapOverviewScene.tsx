'use client';

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { TripStats, StoryTemplate, MapMarker } from '@/types/story';
import { AnimatedMap } from '../AnimatedMap';
import { calculateBounds, Bounds } from '@/lib/story/mapUtils';

type MapOverviewSceneProps = {
  mapUrl?: string;
  stats: TripStats;
  template: StoryTemplate;
  // New props for animated map
  allMarkers?: MapMarker[];
  bounds?: Bounds;
};

export const MapOverviewScene: React.FC<MapOverviewSceneProps> = ({
  mapUrl,
  stats,
  template,
  allMarkers = [],
  bounds,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title animations
  const titleOpacity = interpolate(frame, [fps * 0.3, fps * 0.8], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const titleY = interpolate(frame, [fps * 0.3, fps * 0.8], [-20, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const categoriesOpacity = interpolate(frame, [fps * 1.5, fps * 2.0], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const styles = getTemplateStyles(template);

  // Calculate bounds if we have markers
  const mapBounds = bounds || (allMarkers.length > 0 ? calculateBounds(allMarkers) : undefined);

  // Determine whether to use animated map
  const showAnimatedMap = allMarkers.length > 0;

  return (
    <AbsoluteFill style={{ backgroundColor: styles.backgroundColor }}>
      {/* Animated SVG Map with pin reveal */}
      {showAnimatedMap && mapBounds && (
        <AbsoluteFill>
          <AnimatedMap
            markers={allMarkers}
            bounds={mapBounds}
            template={template}
            initialZoom={1}
            targetZoom={1}
            pinRevealStart={Math.floor(fps * 0.5)} // Start revealing pins
            pinRevealDelay={Math.floor(fps * 0.12)} // Stagger each pin
            showConnectorLines={true}
            connectorRevealStart={Math.floor(fps * 0.8)} // Lines appear after first few pins
            width={1080}
            height={1920}
          />
        </AbsoluteFill>
      )}

      {/* Fallback: Static map image */}
      {!showAnimatedMap && mapUrl && (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <img
            src={mapUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: interpolate(frame, [0, fps * 0.5], [0, 1], {
                extrapolateRight: 'clamp',
              }),
              transform: `scale(${interpolate(frame, [0, durationInFrames], [1.05, 1])})`,
            }}
          />
          <AbsoluteFill style={{ background: styles.mapOverlay }} />
        </AbsoluteFill>
      )}

      {/* Fallback gradient if no map */}
      {!showAnimatedMap && !mapUrl && (
        <AbsoluteFill style={{ background: styles.fallbackGradient }} />
      )}

      {/* Content overlay - appears at bottom */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 60,
          paddingBottom: 120,
        }}
      >
        {/* Gradient overlay for readability */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: styles.bottomGradient,
            pointerEvents: 'none',
          }}
        />

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            color: styles.textColor,
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 24,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Your Journey
        </div>

        {/* Categories */}
        <div
          style={{
            opacity: categoriesOpacity,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {stats.categories.map((category, index) => (
            <CategoryBadge
              key={category.type}
              icon={category.icon}
              count={category.count}
              label={formatCategoryLabel(category.type, category.count)}
              template={template}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Cities visited */}
        {stats.cities.length > 0 && (
          <div
            style={{
              opacity: categoriesOpacity,
              marginTop: 24,
              color: styles.subtitleColor,
              fontSize: 18,
              fontWeight: 500,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {stats.cities.length === 1
              ? stats.cities[0]
              : stats.cities.slice(0, 3).join(' • ')}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type CategoryBadgeProps = {
  icon: string;
  count: number;
  label: string;
  template: StoryTemplate;
  delay: number;
};

const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  icon,
  count,
  label,
  template,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeOpacity = interpolate(
    frame,
    [fps * (1.5 + delay), fps * (1.8 + delay)],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const badgeScale = interpolate(
    frame,
    [fps * (1.5 + delay), fps * (1.8 + delay)],
    [0.8, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const styles = getTemplateStyles(template);

  return (
    <div
      style={{
        opacity: badgeOpacity,
        transform: `scale(${badgeScale})`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        backgroundColor: styles.badgeBg,
        borderRadius: 12,
        padding: '12px 20px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span
        style={{
          color: styles.textColor,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {count} {label}
      </span>
    </div>
  );
};

function getTemplateStyles(template: StoryTemplate) {
  const styles: Record<StoryTemplate, {
    backgroundColor: string;
    textColor: string;
    subtitleColor: string;
    badgeBg: string;
    mapOverlay: string;
    fallbackGradient: string;
    bottomGradient: string;
  }> = {
    minimal: {
      backgroundColor: '#F8F9FA',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.8)',
      badgeBg: 'rgba(0,0,0,0.5)',
      mapOverlay: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)',
      fallbackGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      bottomGradient: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
    },
    aesthetic: {
      backgroundColor: '#F5E6D3',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.85)',
      badgeBg: 'rgba(139,90,43,0.6)',
      mapOverlay: 'linear-gradient(to top, rgba(80,50,25,0.8) 0%, rgba(139,90,43,0.1) 60%)',
      fallbackGradient: 'linear-gradient(135deg, #D4A574 0%, #8B5A2B 100%)',
      bottomGradient: 'linear-gradient(to top, rgba(80,50,25,0.8) 0%, transparent 100%)',
    },
    trendy: {
      backgroundColor: '#1A1A2E',
      textColor: '#E94560',
      subtitleColor: 'rgba(255,255,255,0.8)',
      badgeBg: 'rgba(233,69,96,0.3)',
      mapOverlay: 'linear-gradient(to top, rgba(26,26,46,0.9) 0%, rgba(26,26,46,0.2) 60%)',
      fallbackGradient: 'linear-gradient(135deg, #E94560 0%, #533483 100%)',
      bottomGradient: 'linear-gradient(to top, rgba(26,26,46,0.9) 0%, transparent 100%)',
    },
    luxury: {
      backgroundColor: '#0D0D0D',
      textColor: '#D4AF37',
      subtitleColor: 'rgba(255,255,255,0.8)',
      badgeBg: 'rgba(212,175,55,0.2)',
      mapOverlay: 'linear-gradient(to top, rgba(13,13,13,0.9) 0%, rgba(13,13,13,0.1) 60%)',
      fallbackGradient: 'linear-gradient(135deg, #3D3D3D 0%, #0D0D0D 100%)',
      bottomGradient: 'linear-gradient(to top, rgba(13,13,13,0.9) 0%, transparent 100%)',
    },
  };

  return styles[template];
}

function formatCategoryLabel(type: string, count: number): string {
  const labels: Record<string, { singular: string; plural: string }> = {
    hotel: { singular: 'Hotel', plural: 'Hotels' },
    spot: { singular: 'Spot', plural: 'Spots' },
    food: { singular: 'Restaurant', plural: 'Restaurants' },
    activity: { singular: 'Activity', plural: 'Activities' },
  };

  const label = labels[type] || { singular: type, plural: type + 's' };
  return count === 1 ? label.singular : label.plural;
}
