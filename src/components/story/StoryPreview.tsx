'use client';

import { useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { StoryData, StoryTemplate, VIDEO_FORMATS } from '@/types/story';
import { TripStoryComposition, getTotalDurationInFrames } from './remotion/TripStoryComposition';

interface StoryPreviewProps {
  storyData: StoryData;
  template: StoryTemplate;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export interface StoryPreviewRef {
  getContainer: () => HTMLDivElement | null;
  getPlayer: () => PlayerRef | null;
  getDurationMs: () => number;
  seekToStart: () => void;
  play: () => void;
  pause: () => void;
}

export const StoryPreview = forwardRef<StoryPreviewRef, StoryPreviewProps>(
  function StoryPreview({
    storyData,
    template,
    isPlaying,
    onPlayPause,
  }, ref) {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const format = VIDEO_FORMATS.tiktok;

  const durationInFrames = useMemo(() => {
    return getTotalDurationInFrames(storyData, format.fps);
  }, [storyData, format.fps]);

  const durationMs = useMemo(() => {
    return (durationInFrames / format.fps) * 1000;
  }, [durationInFrames, format.fps]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getContainer: () => containerRef.current,
    getPlayer: () => playerRef.current,
    getDurationMs: () => durationMs,
    seekToStart: () => {
      playerRef.current?.seekTo(0);
    },
    play: () => {
      playerRef.current?.play();
    },
    pause: () => {
      playerRef.current?.pause();
    },
  }), [durationMs]);

  // Control playback
  useEffect(() => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying]);

  // Handle player events
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handlePlay = () => {
      if (!isPlaying) onPlayPause();
    };

    const handlePause = () => {
      if (isPlaying) onPlayPause();
    };

    player.addEventListener('play', handlePlay);
    player.addEventListener('pause', handlePause);

    return () => {
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('pause', handlePause);
    };
  }, [isPlaying, onPlayPause]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <Player
        ref={playerRef}
        component={TripStoryComposition}
        inputProps={{
          storyData,
          template,
        }}
        durationInFrames={durationInFrames}
        fps={format.fps}
        compositionWidth={format.width}
        compositionHeight={format.height}
        style={{
          width: '100%',
          height: '100%',
        }}
        controls={false}
        loop
        autoPlay={false}
        clickToPlay
      />
    </div>
  );
});
