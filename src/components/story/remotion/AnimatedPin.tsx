'use client';

import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { StoryTemplate } from '@/types/story';
import { getMarkerColor, getMarkerIcon, easings, Point } from '@/lib/story/mapUtils';

type AnimatedPinProps = {
  position: Point;
  type: string;
  label: string;
  order: number;
  template: StoryTemplate;
  revealFrame: number;
  isActive?: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
};

export const AnimatedPin: React.FC<AnimatedPinProps> = ({
  position,
  type,
  label,
  order,
  template,
  revealFrame,
  isActive = false,
  showLabel = false,
  size = 'medium',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation duration in frames
  const animDuration = fps * 0.4; // 0.4 seconds

  // Calculate animation progress
  const animProgress = Math.max(0, Math.min(1, (frame - revealFrame) / animDuration));

  // Apply easing for bouncy pop-in effect
  const easedProgress = easings.easeOutBack(animProgress);

  // Scale animation (0 -> 1 with overshoot)
  const scale = animProgress > 0 ? easedProgress : 0;

  // Opacity (fade in quickly)
  const opacity = interpolate(frame, [revealFrame, revealFrame + fps * 0.15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Active state pulse animation
  const pulseScale = isActive
    ? 1 + Math.sin((frame - revealFrame) * 0.15) * 0.08
    : 1;

  // Get styling based on template and type
  const pinColor = getMarkerColor(type, template);
  const icon = getMarkerIcon(type);

  // Size configurations
  const sizeConfig = {
    small: { pin: 32, icon: 16, label: 10, ring: 40 },
    medium: { pin: 44, icon: 22, label: 12, ring: 56 },
    large: { pin: 56, icon: 28, label: 14, ring: 72 },
  };

  const { pin: pinSize, icon: iconSize, label: labelSize, ring: ringSize } = sizeConfig[size];

  // Don't render if before reveal
  if (frame < revealFrame) {
    return null;
  }

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      style={{ opacity }}
    >
      {/* Active ring pulse */}
      {isActive && (
        <circle
          cx={0}
          cy={0}
          r={ringSize / 2}
          fill="none"
          stroke={pinColor}
          strokeWidth={2}
          opacity={0.4 + Math.sin((frame - revealFrame) * 0.2) * 0.3}
          style={{
            transform: `scale(${1 + Math.sin((frame - revealFrame) * 0.1) * 0.15})`,
            transformOrigin: 'center',
          }}
        />
      )}

      {/* Drop shadow */}
      <ellipse
        cx={0}
        cy={pinSize / 2 - 4}
        rx={pinSize / 3}
        ry={pinSize / 8}
        fill="rgba(0,0,0,0.2)"
        style={{
          transform: `scale(${scale * pulseScale})`,
          transformOrigin: 'center',
        }}
      />

      {/* Pin body */}
      <g
        style={{
          transform: `scale(${scale * pulseScale})`,
          transformOrigin: 'center',
        }}
      >
        {/* Main pin circle */}
        <circle
          cx={0}
          cy={0}
          r={pinSize / 2}
          fill={pinColor}
          stroke={getStrokeColor(template)}
          strokeWidth={2}
        />

        {/* Order number badge */}
        <circle
          cx={pinSize / 3}
          cy={-pinSize / 3}
          r={10}
          fill={getBadgeBackground(template)}
          stroke={pinColor}
          strokeWidth={1.5}
        />
        <text
          x={pinSize / 3}
          y={-pinSize / 3 + 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill={getBadgeTextColor(template)}
        >
          {order}
        </text>

        {/* Icon */}
        <text
          x={0}
          y={iconSize / 3}
          textAnchor="middle"
          fontSize={iconSize}
          style={{ pointerEvents: 'none' }}
        >
          {icon}
        </text>
      </g>

      {/* Label */}
      {showLabel && (
        <g
          style={{
            opacity: interpolate(
              frame,
              [revealFrame + fps * 0.2, revealFrame + fps * 0.4],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            ),
          }}
        >
          <rect
            x={-getLabelWidth(label, labelSize) / 2 - 8}
            y={pinSize / 2 + 8}
            width={getLabelWidth(label, labelSize) + 16}
            height={labelSize + 12}
            rx={4}
            fill={getLabelBackground(template)}
            opacity={0.9}
          />
          <text
            x={0}
            y={pinSize / 2 + 8 + labelSize + 2}
            textAnchor="middle"
            fontSize={labelSize}
            fontWeight={600}
            fill={getLabelTextColor(template)}
          >
            {truncateLabel(label, 20)}
          </text>
        </g>
      )}
    </g>
  );
};

// Helper functions for template-specific styling
function getStrokeColor(template: StoryTemplate): string {
  const colors: Record<StoryTemplate, string> = {
    minimal: '#FFFFFF',
    aesthetic: '#FDF8F3',
    trendy: '#1A1A2E',
    luxury: '#0D0D0D',
  };
  return colors[template];
}

function getBadgeBackground(template: StoryTemplate): string {
  const colors: Record<StoryTemplate, string> = {
    minimal: '#FFFFFF',
    aesthetic: '#FDF8F3',
    trendy: '#1A1A2E',
    luxury: '#0D0D0D',
  };
  return colors[template];
}

function getBadgeTextColor(template: StoryTemplate): string {
  const colors: Record<StoryTemplate, string> = {
    minimal: '#374151',
    aesthetic: '#8B5A2B',
    trendy: '#E94560',
    luxury: '#D4AF37',
  };
  return colors[template];
}

function getLabelBackground(template: StoryTemplate): string {
  const colors: Record<StoryTemplate, string> = {
    minimal: 'rgba(255, 255, 255, 0.95)',
    aesthetic: 'rgba(253, 248, 243, 0.95)',
    trendy: 'rgba(26, 26, 46, 0.95)',
    luxury: 'rgba(13, 13, 13, 0.95)',
  };
  return colors[template];
}

function getLabelTextColor(template: StoryTemplate): string {
  const colors: Record<StoryTemplate, string> = {
    minimal: '#374151',
    aesthetic: '#5C4033',
    trendy: '#FFFFFF',
    luxury: '#D4AF37',
  };
  return colors[template];
}

function getLabelWidth(text: string, fontSize: number): number {
  // Approximate width calculation (average char width * length)
  return text.length * fontSize * 0.6;
}

function truncateLabel(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
