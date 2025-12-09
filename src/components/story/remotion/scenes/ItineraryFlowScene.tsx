'use client';

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { MapMarker, StoryTemplate, DayPlan } from '@/types/story';
import {
  projectToSvg,
  calculateBounds,
  getCurvedPath,
  getMapBackground,
  getMarkerColor,
  easings,
  Bounds,
  Point,
} from '@/lib/story/mapUtils';

type ItineraryFlowSceneProps = {
  days: DayPlan[];
  allMarkers: MapMarker[];
  bounds?: Bounds;
  template: StoryTemplate;
  // Animation timing
  flowDuration?: number; // frames for the entire flow animation
};

/**
 * Animated itinerary flow scene - shows the journey flowing on a map
 * with animated route drawing and stop highlighting
 */
export const ItineraryFlowScene: React.FC<ItineraryFlowSceneProps> = ({
  days,
  allMarkers,
  bounds: providedBounds,
  template,
  flowDuration,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const styles = getTemplateStyles(template);
  const mapBg = getMapBackground(template);

  // Calculate bounds from markers
  const bounds = providedBounds || calculateBounds(allMarkers);

  // Sort markers by order
  const sortedMarkers = [...allMarkers].sort((a, b) => a.order - b.order);
  const totalStops = sortedMarkers.length;

  // Calculate positions for all markers
  const padding = 80;
  const positions = sortedMarkers.map((marker) =>
    projectToSvg(marker.lat, marker.lng, bounds, width, height, padding)
  );

  // Animation timing
  const animDuration = flowDuration || durationInFrames;
  const stopDuration = animDuration / Math.max(totalStops, 1);

  // Calculate current active stop based on frame
  const rawActiveIndex = (frame / stopDuration);
  const activeIndex = Math.min(Math.floor(rawActiveIndex), totalStops - 1);
  const progress = rawActiveIndex - activeIndex; // 0-1 progress towards next stop

  // Calculate the "traveler" position (animated dot moving along the route)
  let travelerPosition: Point = positions[0] || { x: width / 2, y: height / 2 };
  if (activeIndex < totalStops - 1 && positions[activeIndex] && positions[activeIndex + 1]) {
    const from = positions[activeIndex];
    const to = positions[activeIndex + 1];
    const easedProgress = easings.easeInOutCubic(Math.min(progress, 1));
    travelerPosition = {
      x: from.x + (to.x - from.x) * easedProgress,
      y: from.y + (to.y - from.y) * easedProgress,
    };
  } else if (positions[activeIndex]) {
    travelerPosition = positions[activeIndex];
  }

  // Get current day info
  const getCurrentDayInfo = () => {
    if (sortedMarkers.length === 0) return { dayIndex: 1, dayLabel: 'Day 1' };

    let stopCount = 0;
    for (const day of days) {
      const dayStops = day.places.filter((p) => p.coordinates).length;
      if (activeIndex < stopCount + dayStops) {
        return { dayIndex: day.dayIndex, dayLabel: `Day ${day.dayIndex}` };
      }
      stopCount += dayStops;
    }
    return { dayIndex: days.length, dayLabel: `Day ${days.length}` };
  };

  const { dayLabel } = getCurrentDayInfo();
  const currentMarker = sortedMarkers[activeIndex];

  // Title animation
  const titleOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: styles.backgroundColor }}>
      {/* SVG Map */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id={`flowBg-${template}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={mapBg.gradient[0]} />
            <stop offset="100%" stopColor={mapBg.gradient[1]} />
          </linearGradient>

          {/* Glow filter for traveler */}
          <filter id="travelerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pulse animation for active stop */}
          <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect x={0} y={0} width={width} height={height} fill={`url(#flowBg-${template})`} />

        {/* Decorative grid */}
        <g opacity={0.3}>
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={(i + 1) * (height / 9)}
              x2={width}
              y2={(i + 1) * (height / 9)}
              stroke={mapBg.gridColor}
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={(i + 1) * (width / 5)}
              y1={0}
              x2={(i + 1) * (width / 5)}
              y2={height}
              stroke={mapBg.gridColor}
              strokeWidth={1}
            />
          ))}
        </g>

        {/* Draw route lines - animated reveal */}
        {positions.length > 1 && (
          <g>
            {positions.slice(0, -1).map((from, index) => {
              const to = positions[index + 1];
              const pathD = getCurvedPath(from, to, index % 2 === 0 ? 0.2 : -0.2);

              // Calculate line draw progress
              const lineStartFrame = index * stopDuration;
              const lineEndFrame = (index + 1) * stopDuration;
              const lineProgress = interpolate(
                frame,
                [lineStartFrame, lineEndFrame],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );

              // Line opacity - show completed lines
              const isCompleted = frame >= lineEndFrame;
              const isActive = frame >= lineStartFrame && frame < lineEndFrame;

              return (
                <g key={`line-${index}`}>
                  {/* Background trace (faded) */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={mapBg.lineColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={0.2}
                  />

                  {/* Animated line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isActive ? styles.accentColor : mapBg.lineColor}
                    strokeWidth={isActive ? 5 : 4}
                    strokeLinecap="round"
                    strokeDasharray="1000"
                    strokeDashoffset={1000 * (1 - lineProgress)}
                    opacity={isCompleted ? 0.8 : 1}
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* Draw all stops */}
        {positions.map((pos, index) => {
          const marker = sortedMarkers[index];
          const isVisited = index <= activeIndex;
          const isActive = index === activeIndex;
          const isPending = index > activeIndex;

          // Calculate reveal animation for each stop
          const revealFrame = index * stopDuration * 0.8;
          const revealProgress = interpolate(
            frame,
            [revealFrame, revealFrame + fps * 0.3],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          const scale = isActive
            ? 1 + Math.sin(frame * 0.15) * 0.1
            : isPending
            ? 0.7
            : 1;

          const pinColor = getMarkerColor(marker.type, template);

          return (
            <g
              key={`stop-${index}`}
              transform={`translate(${pos.x}, ${pos.y})`}
              opacity={revealProgress}
            >
              {/* Pulse ring for active stop */}
              {isActive && (
                <>
                  <circle
                    cx={0}
                    cy={0}
                    r={35 + Math.sin(frame * 0.2) * 8}
                    fill="none"
                    stroke={styles.accentColor}
                    strokeWidth={2}
                    opacity={0.3 + Math.sin(frame * 0.15) * 0.2}
                  />
                  <circle
                    cx={0}
                    cy={0}
                    r={50 + Math.sin(frame * 0.15) * 10}
                    fill="none"
                    stroke={styles.accentColor}
                    strokeWidth={1}
                    opacity={0.15}
                  />
                </>
              )}

              {/* Stop marker */}
              <g transform={`scale(${scale})`}>
                {/* Shadow */}
                <ellipse
                  cx={0}
                  cy={18}
                  rx={12}
                  ry={5}
                  fill="rgba(0,0,0,0.2)"
                />

                {/* Pin circle */}
                <circle
                  cx={0}
                  cy={0}
                  r={isActive ? 22 : isPending ? 16 : 20}
                  fill={isPending ? 'rgba(128,128,128,0.5)' : pinColor}
                  stroke={styles.ringColor}
                  strokeWidth={3}
                  filter={isActive ? 'url(#pulseGlow)' : undefined}
                />

                {/* Order number */}
                <text
                  x={0}
                  y={5}
                  textAnchor="middle"
                  fontSize={isActive ? 16 : 14}
                  fontWeight={700}
                  fill={styles.pinTextColor}
                >
                  {marker.order}
                </text>
              </g>
            </g>
          );
        })}

        {/* Animated traveler dot */}
        {sortedMarkers.length > 0 && (
          <g transform={`translate(${travelerPosition.x}, ${travelerPosition.y})`}>
            {/* Outer glow */}
            <circle
              cx={0}
              cy={0}
              r={15 + Math.sin(frame * 0.3) * 3}
              fill={styles.accentColor}
              opacity={0.3}
              filter="url(#travelerGlow)"
            />
            {/* Inner dot */}
            <circle cx={0} cy={0} r={8} fill={styles.accentColor} />
            <circle cx={0} cy={0} r={4} fill="#FFFFFF" />
          </g>
        )}

        {/* Vignette */}
        <defs>
          <radialGradient id="flowVignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor={styles.vignetteColor} />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={width} height={height} fill="url(#flowVignette)" opacity={0.4} />
      </svg>

      {/* Overlay UI */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 60,
          pointerEvents: 'none',
        }}
      >
        {/* Top: Day indicator */}
        <div
          style={{
            opacity: titleOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              backgroundColor: styles.badgeBg,
              borderRadius: 20,
              padding: '10px 24px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span
              style={{
                color: styles.accentColor,
                fontSize: 20,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {dayLabel}
            </span>
          </div>
        </div>

        {/* Bottom: Current stop info */}
        {currentMarker && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              textAlign: 'center',
            }}
          >
            {/* Progress bar */}
            <div
              style={{
                width: '80%',
                height: 4,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${((activeIndex + progress) / totalStops) * 100}%`,
                  backgroundColor: styles.accentColor,
                  borderRadius: 2,
                  transition: 'width 0.1s ease-out',
                }}
              />
            </div>

            {/* Stop counter */}
            <div
              style={{
                color: styles.subtitleColor,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Stop {activeIndex + 1} of {totalStops}
            </div>

            {/* Stop name */}
            <div
              style={{
                backgroundColor: styles.cardBg,
                borderRadius: 16,
                padding: '16px 32px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  color: styles.textColor,
                  fontSize: 28,
                  fontWeight: 700,
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}
              >
                {currentMarker.label}
              </div>
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function getTemplateStyles(template: StoryTemplate) {
  const styles: Record<
    StoryTemplate,
    {
      backgroundColor: string;
      textColor: string;
      subtitleColor: string;
      accentColor: string;
      badgeBg: string;
      cardBg: string;
      ringColor: string;
      pinTextColor: string;
      vignetteColor: string;
    }
  > = {
    minimal: {
      backgroundColor: '#F8F9FA',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.8)',
      accentColor: '#58A6C1',
      badgeBg: 'rgba(0,0,0,0.5)',
      cardBg: 'rgba(0,0,0,0.5)',
      ringColor: '#FFFFFF',
      pinTextColor: '#FFFFFF',
      vignetteColor: '#374151',
    },
    aesthetic: {
      backgroundColor: '#F5E6D3',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.85)',
      accentColor: '#D4A574',
      badgeBg: 'rgba(139,90,43,0.6)',
      cardBg: 'rgba(80,50,25,0.7)',
      ringColor: '#FDF8F3',
      pinTextColor: '#FFFFFF',
      vignetteColor: '#5C4033',
    },
    trendy: {
      backgroundColor: '#1A1A2E',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.8)',
      accentColor: '#E94560',
      badgeBg: 'rgba(233,69,96,0.3)',
      cardBg: 'rgba(26,26,46,0.8)',
      ringColor: '#1A1A2E',
      pinTextColor: '#FFFFFF',
      vignetteColor: '#000000',
    },
    luxury: {
      backgroundColor: '#0D0D0D',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.8)',
      accentColor: '#D4AF37',
      badgeBg: 'rgba(212,175,55,0.2)',
      cardBg: 'rgba(13,13,13,0.8)',
      ringColor: '#0D0D0D',
      pinTextColor: '#0D0D0D',
      vignetteColor: '#000000',
    },
  };

  return styles[template];
}
