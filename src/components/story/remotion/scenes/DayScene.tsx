'use client';

import { AbsoluteFill, Img, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { DayPlan, DayCaptions, MapSnapshot, StoryTemplate, PlaceItem, MapMarker } from '@/types/story';
import { AnimatedMap } from '../AnimatedMap';
import { calculateBounds, Bounds } from '@/lib/story/mapUtils';
import { format } from 'date-fns';

type DaySceneProps = {
  day: DayPlan;
  captions?: DayCaptions;
  mapSnapshot?: MapSnapshot;
  totalDays: number;
  template: StoryTemplate;
  headerDuration: number;
  placeDuration: number;
  // New: markers for this day's places
  dayMarkers?: MapMarker[];
  dayBounds?: Bounds;
  // For pan effect: previous day's center
  previousDayBounds?: Bounds;
};

export const DayScene: React.FC<DaySceneProps> = ({
  day,
  captions,
  mapSnapshot,
  totalDays,
  template,
  headerDuration,
  placeDuration,
  dayMarkers,
  dayBounds,
  previousDayBounds,
}) => {
  const styles = getTemplateStyles(template);

  // Convert places to markers if not provided
  const markers: MapMarker[] = dayMarkers || day.places
    .filter(place => place.coordinates)
    .map((place, index) => ({
      lat: place.coordinates!.lat,
      lng: place.coordinates!.lng,
      label: place.name,
      type: place.type,
      order: index + 1,
    }));

  const bounds = dayBounds || (markers.length > 0 ? calculateBounds(markers) : undefined);

  return (
    <AbsoluteFill style={{ backgroundColor: styles.backgroundColor }}>
      {/* Day Header with animated map */}
      <Sequence from={0} durationInFrames={headerDuration}>
        <DayHeader
          dayIndex={day.dayIndex}
          date={day.date}
          headline={captions?.headline}
          description={captions?.description}
          totalDays={totalDays}
          template={template}
          mapUrl={mapSnapshot?.imageUrl}
          dayMarkers={markers}
          dayBounds={bounds}
          previousDayBounds={previousDayBounds}
        />
      </Sequence>

      {/* Place Cards */}
      {day.places.map((place, index) => (
        <Sequence
          key={place.id}
          from={headerDuration + index * placeDuration}
          durationInFrames={placeDuration}
        >
          <PlaceCard
            place={place}
            order={index + 1}
            totalPlaces={day.places.length}
            template={template}
            isHighlight={captions?.placeHighlights?.includes(place.name)}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

type DayHeaderProps = {
  dayIndex: number;
  date: string;
  headline?: string;
  description?: string;
  totalDays: number;
  template: StoryTemplate;
  mapUrl?: string;
  dayMarkers?: MapMarker[];
  dayBounds?: Bounds;
  previousDayBounds?: Bounds;
};

const DayHeader: React.FC<DayHeaderProps> = ({
  dayIndex,
  date,
  headline,
  description,
  totalDays,
  template,
  mapUrl,
  dayMarkers = [],
  dayBounds,
  previousDayBounds,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const dayOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const dayY = interpolate(frame, [0, fps * 0.3], [30, 0], {
    extrapolateRight: 'clamp',
  });

  const headlineOpacity = interpolate(frame, [fps * 0.2, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const descriptionOpacity = interpolate(frame, [fps * 0.4, fps * 0.7], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const mapScale = interpolate(frame, [0, durationInFrames], [1.1, 1], {
    extrapolateRight: 'clamp',
  });

  const styles = getTemplateStyles(template);
  const formattedDate = format(new Date(date), 'EEEE, MMM d');

  // Use animated map if we have markers
  const showAnimatedMap = dayMarkers.length > 0 && dayBounds;

  return (
    <AbsoluteFill>
      {/* Background - animated map or static image */}
      {showAnimatedMap && dayBounds ? (
        <AbsoluteFill>
          <AnimatedMap
            markers={dayMarkers}
            bounds={dayBounds}
            template={template}
            initialZoom={1.5} // Slight zoom out effect
            targetZoom={1}
            pinRevealStart={Math.floor(fps * 0.3)}
            pinRevealDelay={Math.floor(fps * 0.15)}
            showConnectorLines={dayMarkers.length > 1}
            connectorRevealStart={Math.floor(fps * 0.5)}
            width={1080}
            height={1920}
          />
          <AbsoluteFill style={{ background: styles.mapOverlay }} />
        </AbsoluteFill>
      ) : mapUrl ? (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={mapUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${mapScale})`,
            }}
          />
          <AbsoluteFill style={{ background: styles.mapOverlay }} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ background: styles.headerGradient }} />
      )}

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
        {/* Day Number */}
        <div
          style={{
            opacity: dayOpacity,
            transform: `translateY(${dayY}px)`,
            color: styles.accentColor,
            fontSize: 24,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 12,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          Day {dayIndex} of {totalDays}
        </div>

        {/* Date */}
        <div
          style={{
            opacity: dayOpacity,
            transform: `translateY(${dayY}px)`,
            color: styles.textColor,
            fontSize: 20,
            fontWeight: 400,
            marginBottom: 32,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          {formattedDate}
        </div>

        {/* Headline */}
        {headline && (
          <div
            style={{
              opacity: headlineOpacity,
              color: styles.textColor,
              fontSize: 42,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 20,
              textShadow: '0 4px 20px rgba(0,0,0,0.4)',
              maxWidth: 800,
            }}
          >
            {headline}
          </div>
        )}

        {/* Description */}
        {description && (
          <div
            style={{
              opacity: descriptionOpacity,
              color: styles.subtitleColor,
              fontSize: 22,
              fontWeight: 400,
              lineHeight: 1.5,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              maxWidth: 700,
            }}
          >
            {description}
          </div>
        )}

        {/* Place count badge */}
        <div
          style={{
            opacity: descriptionOpacity,
            marginTop: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: styles.badgeBg,
            borderRadius: 20,
            padding: '10px 20px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span style={{ fontSize: 18 }}>📍</span>
          <span style={{ color: styles.textColor, fontSize: 14, fontWeight: 600 }}>
            {dayMarkers.length} {dayMarkers.length === 1 ? 'stop' : 'stops'}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type PlaceCardProps = {
  place: PlaceItem;
  order: number;
  totalPlaces: number;
  template: StoryTemplate;
  isHighlight?: boolean;
};

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  order,
  totalPlaces,
  template,
  isHighlight,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Slide-in animation
  const slideX = interpolate(frame, [0, fps * 0.4], [100, 0], {
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Image zoom effect
  const imageScale = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    extrapolateRight: 'clamp',
  });

  // Progress bar animation
  const progressWidth = interpolate(
    frame,
    [0, durationInFrames],
    [0, 100],
    { extrapolateRight: 'clamp' }
  );

  const styles = getTemplateStyles(template);

  return (
    <AbsoluteFill>
      {/* Background Image */}
      {place.photo && (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={place.photo}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${imageScale})`,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Overlay gradient */}
      <AbsoluteFill
        style={{
          background: styles.cardOverlay,
        }}
      />

      {/* Content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 60,
          paddingBottom: 100,
          opacity,
          transform: `translateX(${slideX}px)`,
        }}
      >
        {/* Type Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: styles.badgeBg,
            borderRadius: 8,
            padding: '8px 14px',
            marginBottom: 16,
            alignSelf: 'flex-start',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span style={{ fontSize: 18 }}>{getPlaceIcon(place.type)}</span>
          <span
            style={{
              color: styles.textColor,
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {place.type}
          </span>
        </div>

        {/* Place Name */}
        <div
          style={{
            color: styles.textColor,
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 12,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {place.name}
        </div>

        {/* Time Slot */}
        {place.timeSlot && (
          <div
            style={{
              color: styles.subtitleColor,
              fontSize: 20,
              fontWeight: 500,
              marginBottom: 8,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            {place.timeSlot}
          </div>
        )}

        {/* Rating */}
        {place.rating && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>⭐</span>
            <span
              style={{
                color: styles.textColor,
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {place.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Progress indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 60,
            right: 60,
          }}
        >
          <div
            style={{
              color: styles.subtitleColor,
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 8,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            {order} / {totalPlaces}
          </div>
          <div
            style={{
              height: 4,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressWidth}%`,
                backgroundColor: styles.accentColor,
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      </AbsoluteFill>

      {/* Highlight badge */}
      {isHighlight && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 60,
            backgroundColor: styles.accentColor,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: 20,
          }}
        >
          Highlight
        </div>
      )}
    </AbsoluteFill>
  );
};

function getTemplateStyles(template: StoryTemplate) {
  const styles: Record<StoryTemplate, {
    backgroundColor: string;
    textColor: string;
    subtitleColor: string;
    accentColor: string;
    badgeBg: string;
    headerGradient: string;
    cardOverlay: string;
    mapOverlay: string;
  }> = {
    minimal: {
      backgroundColor: '#FFFFFF',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.85)',
      accentColor: '#58A6C1',
      badgeBg: 'rgba(0,0,0,0.4)',
      headerGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      cardOverlay: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)',
      mapOverlay: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)',
    },
    aesthetic: {
      backgroundColor: '#F5E6D3',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.85)',
      accentColor: '#D4A574',
      badgeBg: 'rgba(139,90,43,0.5)',
      headerGradient: 'linear-gradient(135deg, #D4A574 0%, #8B5A2B 100%)',
      cardOverlay: 'linear-gradient(to top, rgba(80,50,25,0.85) 0%, rgba(139,90,43,0.1) 60%)',
      mapOverlay: 'linear-gradient(to top, rgba(80,50,25,0.8) 0%, rgba(139,90,43,0.2) 100%)',
    },
    trendy: {
      backgroundColor: '#1A1A2E',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.8)',
      accentColor: '#E94560',
      badgeBg: 'rgba(233,69,96,0.4)',
      headerGradient: 'linear-gradient(135deg, #E94560 0%, #533483 100%)',
      cardOverlay: 'linear-gradient(to top, rgba(26,26,46,0.9) 0%, rgba(26,26,46,0.1) 60%)',
      mapOverlay: 'linear-gradient(to top, rgba(26,26,46,0.85) 0%, rgba(83,52,131,0.2) 100%)',
    },
    luxury: {
      backgroundColor: '#0D0D0D',
      textColor: '#FFFFFF',
      subtitleColor: 'rgba(255,255,255,0.85)',
      accentColor: '#D4AF37',
      badgeBg: 'rgba(212,175,55,0.3)',
      headerGradient: 'linear-gradient(135deg, #3D3D3D 0%, #0D0D0D 100%)',
      cardOverlay: 'linear-gradient(to top, rgba(13,13,13,0.9) 0%, rgba(13,13,13,0.1) 60%)',
      mapOverlay: 'linear-gradient(to top, rgba(13,13,13,0.85) 0%, rgba(61,61,61,0.2) 100%)',
    },
  };

  return styles[template];
}

function getPlaceIcon(type: string): string {
  const icons: Record<string, string> = {
    hotel: '🏨',
    spot: '📍',
    food: '🍽️',
    activity: '⭐',
    note: '📝',
  };
  return icons[type] || '📍';
}
