'use client';

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { TripSummary, TripStats, StoryTemplate } from '@/types/story';

type OutroSceneProps = {
  tripSummary: TripSummary;
  tripSummaryCaption?: string;
  stats: TripStats;
  template: StoryTemplate;
};

export const OutroScene: React.FC<OutroSceneProps> = ({
  tripSummary,
  tripSummaryCaption,
  stats,
  template,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const contentOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const contentY = interpolate(frame, [0, fps * 0.5], [40, 0], {
    extrapolateRight: 'clamp',
  });

  const statsOpacity = interpolate(frame, [fps * 0.4, fps * 0.8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const ctaOpacity = interpolate(frame, [fps * 0.8, fps * 1.2], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const ctaScale = interpolate(frame, [fps * 0.8, fps * 1.2], [0.9, 1], {
    extrapolateRight: 'clamp',
  });

  const styles = getTemplateStyles(template);

  return (
    <AbsoluteFill style={{ background: styles.background }}>
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
        {/* Thanks message or summary caption */}
        <div
          style={{
            opacity: contentOpacity,
            transform: `translateY(${contentY}px)`,
            color: styles.textColor,
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 24,
          }}
        >
          {tripSummaryCaption || `${stats.totalDays} amazing days`}
        </div>

        {/* Destination reminder */}
        <div
          style={{
            opacity: contentOpacity,
            transform: `translateY(${contentY}px)`,
            color: styles.subtitleColor,
            fontSize: 24,
            fontWeight: 500,
            marginBottom: 48,
          }}
        >
          {tripSummary.destination}
        </div>

        {/* Stats recap */}
        <div
          style={{
            opacity: statsOpacity,
            display: 'flex',
            gap: 32,
            marginBottom: 64,
          }}
        >
          <StatItem
            value={stats.totalDays}
            label="Days"
            template={template}
          />
          <StatItem
            value={stats.totalPlaces}
            label="Places"
            template={template}
          />
          {stats.categories.length > 0 && (
            <StatItem
              value={stats.categories.length}
              label="Categories"
              template={template}
            />
          )}
        </div>

        {/* CTA */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              backgroundColor: styles.ctaBg,
              color: styles.ctaTextColor,
              fontSize: 18,
              fontWeight: 600,
              padding: '16px 32px',
              borderRadius: 30,
            }}
          >
            Plan your trip at voyagr.app
          </div>

          <div
            style={{
              color: styles.mutedColor,
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            Made with Voyagr
          </div>
        </div>
      </AbsoluteFill>

      {/* Decorative elements based on template */}
      {template === 'trendy' && (
        <TrendyDecorations />
      )}
      {template === 'luxury' && (
        <LuxuryDecorations />
      )}
    </AbsoluteFill>
  );
};

type StatItemProps = {
  value: number;
  label: string;
  template: StoryTemplate;
};

const StatItem: React.FC<StatItemProps> = ({ value, label, template }) => {
  const styles = getTemplateStyles(template);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          color: styles.accentColor,
          fontSize: 48,
          fontWeight: 800,
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

const TrendyDecorations: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animated gradient blob
  const rotation = interpolate(frame, [0, fps * 3], [0, 360], {
    extrapolateRight: 'extend',
  });

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: -200,
          right: -200,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(233,69,96,0.3) 0%, rgba(83,52,131,0.1) 70%)',
          filter: 'blur(60px)',
          transform: `rotate(${rotation}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(83,52,131,0.4) 0%, rgba(26,26,46,0.1) 70%)',
          filter: 'blur(50px)',
          transform: `rotate(${-rotation}deg)`,
        }}
      />
    </>
  );
};

const LuxuryDecorations: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle shimmer
  const shimmer = interpolate(
    frame,
    [0, fps * 2, fps * 4],
    [0.3, 0.5, 0.3],
    { extrapolateRight: 'extend' }
  );

  return (
    <>
      {/* Gold accent lines */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          right: 60,
          height: 1,
          background: `linear-gradient(to right, transparent, rgba(212,175,55,${shimmer}), transparent)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 60,
          right: 60,
          height: 1,
          background: `linear-gradient(to right, transparent, rgba(212,175,55,${shimmer}), transparent)`,
        }}
      />
    </>
  );
};

function getTemplateStyles(template: StoryTemplate) {
  const styles: Record<StoryTemplate, {
    background: string;
    textColor: string;
    subtitleColor: string;
    accentColor: string;
    mutedColor: string;
    ctaBg: string;
    ctaTextColor: string;
  }> = {
    minimal: {
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
      textColor: '#212529',
      subtitleColor: '#6C757D',
      accentColor: '#58A6C1',
      mutedColor: '#ADB5BD',
      ctaBg: '#58A6C1',
      ctaTextColor: '#FFFFFF',
    },
    aesthetic: {
      background: 'linear-gradient(135deg, #F5E6D3 0%, #E8D5C4 100%)',
      textColor: '#5D4037',
      subtitleColor: '#8B5A2B',
      accentColor: '#D4A574',
      mutedColor: '#A1887F',
      ctaBg: '#8B5A2B',
      ctaTextColor: '#FFFFFF',
    },
    trendy: {
      background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.7)',
      accentColor: '#E94560',
      mutedColor: 'rgba(255,255,255,0.4)',
      ctaBg: '#E94560',
      ctaTextColor: '#FFFFFF',
    },
    luxury: {
      background: 'linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%)',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.7)',
      accentColor: '#D4AF37',
      mutedColor: 'rgba(255,255,255,0.4)',
      ctaBg: '#D4AF37',
      ctaTextColor: '#0D0D0D',
    },
  };

  return styles[template];
}
