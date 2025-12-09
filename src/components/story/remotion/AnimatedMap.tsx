'use client';

import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { MapMarker, StoryTemplate } from '@/types/story';
import { AnimatedPin } from './AnimatedPin';
import {
  projectToSvg,
  calculateBounds,
  interpolateBounds,
  getWideBounds,
  getAllConnectorPaths,
  getMapBackground,
  easings,
  Bounds,
} from '@/lib/story/mapUtils';

type AnimatedMapProps = {
  markers: MapMarker[];
  bounds?: Bounds;
  template: StoryTemplate;
  // Animation controls
  initialZoom?: number; // 1 = normal, 3 = zoomed out
  targetZoom?: number;
  // Pin animation
  pinRevealStart?: number; // Frame to start revealing pins
  pinRevealDelay?: number; // Frames between each pin reveal
  pinsVisible?: boolean; // Whether pins should be shown
  // Connector lines
  showConnectorLines?: boolean;
  connectorRevealStart?: number;
  // Active marker (for highlighting)
  activeMarkerIndex?: number;
  // Sizing
  width?: number;
  height?: number;
  padding?: number;
};

export const AnimatedMap: React.FC<AnimatedMapProps> = ({
  markers,
  bounds: providedBounds,
  template,
  initialZoom = 1,
  targetZoom = 1,
  pinRevealStart = 0,
  pinRevealDelay = 5,
  pinsVisible = true,
  showConnectorLines = true,
  connectorRevealStart = 0,
  activeMarkerIndex,
  width = 1080,
  height = 1920,
  padding = 60,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate bounds from markers if not provided
  const calculatedBounds = providedBounds || calculateBounds(markers);

  // Create wide bounds for zoom effect
  const wideBounds = getWideBounds(calculatedBounds, initialZoom);

  // Interpolate bounds based on zoom animation
  const zoomProgress = interpolate(
    frame,
    [0, durationInFrames * 0.6],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const easedZoomProgress = easings.easeOutCubic(zoomProgress);

  // Current bounds (interpolated between wide and target)
  const currentBounds =
    initialZoom !== targetZoom
      ? interpolateBounds(wideBounds, calculatedBounds, easedZoomProgress)
      : calculatedBounds;

  // Get background styling
  const mapBg = getMapBackground(template);

  // Sort markers by order for drawing
  const sortedMarkers = [...markers].sort((a, b) => a.order - b.order);

  // Calculate connector paths
  const connectorPaths = showConnectorLines
    ? getAllConnectorPaths(sortedMarkers, currentBounds, width, height, padding)
    : [];

  // Calculate line draw progress (stroke-dashoffset animation)
  const lineDrawProgress = interpolate(
    frame,
    [connectorRevealStart, connectorRevealStart + fps * 2],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'hidden' }}
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id={`mapBg-${template}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={mapBg.gradient[0]} />
          <stop offset="100%" stopColor={mapBg.gradient[1]} />
        </linearGradient>

        {/* Glow filter for active pins */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={`url(#mapBg-${template})`}
      />

      {/* Decorative grid pattern */}
      <g opacity={0.5}>
        {/* Horizontal lines */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={(i + 1) * (height / 13)}
            x2={width}
            y2={(i + 1) * (height / 13)}
            stroke={mapBg.gridColor}
            strokeWidth={1}
          />
        ))}
        {/* Vertical lines */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={(i + 1) * (width / 7)}
            y1={0}
            x2={(i + 1) * (width / 7)}
            y2={height}
            stroke={mapBg.gridColor}
            strokeWidth={1}
          />
        ))}
      </g>

      {/* Connector lines */}
      {showConnectorLines && frame >= connectorRevealStart && (
        <g>
          {connectorPaths.map((pathD, index) => {
            // Stagger line reveal
            const lineDelay = index * (fps * 0.3);
            const lineProgress = interpolate(
              frame,
              [connectorRevealStart + lineDelay, connectorRevealStart + lineDelay + fps * 0.8],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            return (
              <path
                key={`line-${index}`}
                d={pathD}
                fill="none"
                stroke={mapBg.lineColor}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="1000"
                strokeDashoffset={1000 * (1 - lineProgress)}
                opacity={0.7}
              />
            );
          })}
        </g>
      )}

      {/* Pins */}
      {pinsVisible && (
        <g>
          {sortedMarkers.map((marker, index) => {
            const position = projectToSvg(
              marker.lat,
              marker.lng,
              currentBounds,
              width,
              height,
              padding
            );

            const revealFrame = pinRevealStart + index * pinRevealDelay;

            return (
              <AnimatedPin
                key={`pin-${marker.order}`}
                position={position}
                type={marker.type}
                label={marker.label}
                order={marker.order}
                template={template}
                revealFrame={revealFrame}
                isActive={activeMarkerIndex === index}
                showLabel={sortedMarkers.length <= 6}
                size={sortedMarkers.length <= 4 ? 'large' : sortedMarkers.length <= 8 ? 'medium' : 'small'}
              />
            );
          })}
        </g>
      )}

      {/* Subtle vignette effect */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="url(#vignette)"
        opacity={0.3}
      />
      <defs>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor={template === 'trendy' || template === 'luxury' ? '#000000' : '#374151'} />
        </radialGradient>
      </defs>
    </svg>
  );
};

/**
 * Simplified map for small display (day headers, thumbnails)
 */
export const MiniAnimatedMap: React.FC<{
  markers: MapMarker[];
  bounds?: Bounds;
  template: StoryTemplate;
  activeMarkerIndex?: number;
  showLines?: boolean;
}> = ({
  markers,
  bounds,
  template,
  activeMarkerIndex,
  showLines = true,
}) => {
  return (
    <AnimatedMap
      markers={markers}
      bounds={bounds}
      template={template}
      width={400}
      height={400}
      padding={30}
      pinRevealStart={0}
      pinRevealDelay={3}
      showConnectorLines={showLines}
      activeMarkerIndex={activeMarkerIndex}
    />
  );
};
