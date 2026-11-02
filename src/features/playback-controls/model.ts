import { useCallback } from 'react';
import {
  changePlaybackSpeed,
  PLAYBACK_SPEED_OPTIONS,
  PlaybackSpeed,
  seekRelativeSeconds,
  skipToNextInQueue,
  skipToPreviousInQueue,
  togglePlaybackState,
  usePlayerStore,
} from '@entities/player';

export interface SpeedChipViewModel {
  speed: PlaybackSpeed;
  label: string;
  isSelected: boolean;
}

export interface UsePlaybackControlsResult {
  hasMultipleTracks: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  primaryButtonLabel: string;
  speedChips: SpeedChipViewModel[];
  onRewind: () => void;
  onForward: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSelectSpeed: (speed: PlaybackSpeed) => void;
}

export function usePlaybackControls(): UsePlaybackControlsResult {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const playbackSpeed = usePlayerStore((state) => state.playbackSpeed);
  const queueLength = usePlayerStore((state) => state.queue.length);

  const onRewind = useCallback(() => {
    seekRelativeSeconds(-30).catch(() => {});
  }, []);

  const onForward = useCallback(() => {
    seekRelativeSeconds(30).catch(() => {});
  }, []);

  const onPrevious = useCallback(() => {
    skipToPreviousInQueue().catch(() => {});
  }, []);

  const onNext = useCallback(() => {
    skipToNextInQueue().catch(() => {});
  }, []);

  const onTogglePlay = useCallback(() => {
    togglePlaybackState().catch(() => {});
  }, []);

  const onSelectSpeed = useCallback((speed: PlaybackSpeed) => {
    changePlaybackSpeed(speed).catch(() => {});
  }, []);

  const primaryButtonLabel = isBuffering
    ? 'BUFFERING'
    : isPlaying
      ? 'PAUSE'
      : 'PLAY';

  const speedChips: SpeedChipViewModel[] = PLAYBACK_SPEED_OPTIONS.map((speed) => ({
    speed,
    label: `${speed}x`,
    isSelected: playbackSpeed === speed,
  }));

  return {
    hasMultipleTracks: queueLength > 1,
    isPlaying,
    isBuffering,
    primaryButtonLabel,
    speedChips,
    onRewind,
    onForward,
    onPrevious,
    onNext,
    onTogglePlay,
    onSelectSpeed,
  };
}

