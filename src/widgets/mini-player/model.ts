import { useCallback } from 'react';
import {
  PlayableTrack,
  seekRelativeSeconds,
  skipToNextInQueue,
  skipToPreviousInQueue,
  togglePlaybackState,
  usePlayerStore,
} from '@entities/player';
import { formatTime } from '@shared/lib/formatTime';

export interface UseMiniPlayerResult {
  activeTrack: PlayableTrack | null;
  playbackError: string | null;
  isRadio: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  showProgressBar: boolean;
  progressWidthPercent: number;
  initials: string;
  subtitleText: string;
  playButtonLabel: string;
  queueBadgeLabel: string;
  hasNextInQueue: boolean;
  hasPreviousInQueue: boolean;
  onSkipBackward: () => void;
  onSkipPrevious: () => void;
  onSkipNext: () => void;
  onTogglePlay: () => void;
  onDismissError: () => void;
}

export function useMiniPlayer(): UseMiniPlayerResult {
  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const playbackError = usePlayerStore((state) => state.playbackError);
  const positionSeconds = usePlayerStore((state) => state.positionSeconds);
  const durationSeconds = usePlayerStore((state) => state.durationSeconds);
  const queue = usePlayerStore((state) => state.queue);
  const setPlaybackError = usePlayerStore((state) => state.setPlaybackError);

  const onSkipBackward = useCallback(() => {
    seekRelativeSeconds(-30).catch(() => {});
  }, []);

  const onSkipPrevious = useCallback(() => {
    skipToPreviousInQueue().catch(() => {});
  }, []);

  const onSkipNext = useCallback(() => {
    skipToNextInQueue().catch(() => {});
  }, []);

  const onTogglePlay = useCallback(() => {
    togglePlaybackState().catch(() => {});
  }, []);

  const onDismissError = useCallback(() => {
    setPlaybackError(null);
  }, [setPlaybackError]);

  if (!activeTrack) {
    return {
      activeTrack: null,
      playbackError,
      isRadio: false,
      isPlaying: false,
      isBuffering: false,
      showProgressBar: false,
      progressWidthPercent: 0,
      initials: '',
      subtitleText: '',
      playButtonLabel: 'PLAY',
      queueBadgeLabel: `Q (${queue.length})`,
      hasNextInQueue: queue.length > 0,
      hasPreviousInQueue: false,
      onSkipBackward,
      onSkipPrevious,
      onSkipNext,
      onTogglePlay,
      onDismissError,
    };
  }

  const isRadio = activeTrack.sourceType === 'radio';
  const showProgressBar = !isRadio && durationSeconds > 0;
  const progressRatio = showProgressBar
    ? Math.min(1, Math.max(0, positionSeconds / durationSeconds))
    : 0;

  let subtitleText = '';
  const queueSuffix = queue.length > 0 ? ` • Queue (${queue.length})` : '';
  if (isBuffering) {
    subtitleText = 'Connecting to stream...';
  } else if (isRadio) {
    subtitleText = `LIVE • ${activeTrack.subtitle}${queueSuffix}`;
  } else {
    subtitleText = `${formatTime(positionSeconds)} / ${formatTime(durationSeconds)}${queueSuffix}`;
  }

  const playButtonLabel = isBuffering ? 'WAIT' : isPlaying ? 'PAUSE' : 'PLAY';

  return {
    activeTrack,
    playbackError,
    isRadio,
    isPlaying,
    isBuffering,
    showProgressBar,
    progressWidthPercent: progressRatio * 100,
    initials: activeTrack.title.slice(0, 2).toUpperCase(),
    subtitleText,
    playButtonLabel,
    queueBadgeLabel: `QUEUE (${queue.length})`,
    hasNextInQueue: true,
    hasPreviousInQueue: true,
    onSkipBackward,
    onSkipPrevious,
    onSkipNext,
    onTogglePlay,
    onDismissError,
  };
}
