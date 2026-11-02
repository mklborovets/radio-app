import TrackPlayer, {
  Event,
  PlaybackErrorEvent,
  PlaybackProgressUpdatedEvent,
  PlaybackState,
  RemoteDuckEvent,
  RemoteJumpBackwardEvent,
  RemoteJumpForwardEvent,
  RemoteSeekEvent,
  State,
} from 'react-native-track-player';
import {
  claimTrackEnd,
  clearStreamWatchdog,
  handleTrackPlaybackFailure,
  pausePlayback,
  resumePlayback,
  seekRelativeSeconds,
  seekToPositionSeconds,
  skipToNextInQueue,
  skipToPreviousInQueue,
  usePlayerStore,
} from '@entities/player';
import {
  flushEpisodePlaybackProgress,
  recordEpisodePlaybackProgressThrottled,
} from '@entities/episode';

let progressOwnerEpisodeId: string | null = null;

function guarded<TEvent = void>(
  handler: (event: TEvent) => Promise<void>,
): (event: TEvent) => Promise<void> {
  return async (event: TEvent) => {
    try {
      await handler(event);
    } catch (error) {
      console.warn('[playbackService]', error);
    }
  };
}

async function flushCurrentEpisodeIfApplicable(): Promise<void> {
  const store = usePlayerStore.getState();
  const active = store.activeTrack;
  if (!active || active.sourceType !== 'episode') {
    return;
  }

  const episodeId = active.episodeId ?? active.id;
  if (progressOwnerEpisodeId !== episodeId) {
    return;
  }
  await flushEpisodePlaybackProgress(
    episodeId,
    store.positionSeconds,
    store.durationSeconds || active.duration,
  );
}

let isTransitioningToNextTrack = false;

async function handleTrackEnded(): Promise<void> {
  if (isTransitioningToNextTrack) {
    return;
  }
  const endedTrack = usePlayerStore.getState().activeTrack;
  if (endedTrack && !claimTrackEnd(endedTrack.id)) {
    return;
  }
  isTransitioningToNextTrack = true;
  clearStreamWatchdog();
  const store = usePlayerStore.getState();
  store.setIsPlaying(false);
  store.setIsBuffering(false);
  try {
    await flushCurrentEpisodeIfApplicable();
    await skipToNextInQueue();
  } finally {
    isTransitioningToNextTrack = false;
  }
}

export async function playbackService(): Promise<void> {
  TrackPlayer.addEventListener(
    Event.RemotePlay,
    guarded(async () => {
      await resumePlayback();
    }),
  );

  TrackPlayer.addEventListener(
    Event.RemotePause,
    guarded(async () => {
      await pausePlayback();
      await flushCurrentEpisodeIfApplicable();
    }),
  );

  TrackPlayer.addEventListener(Event.RemoteStop, guarded(async () => {
    await flushCurrentEpisodeIfApplicable();
    await TrackPlayer.stop();
    usePlayerStore.getState().setIsPlaying(false);
  }));

  TrackPlayer.addEventListener(Event.RemoteNext, guarded(async () => {
    await flushCurrentEpisodeIfApplicable();
    await skipToNextInQueue();
  }));

  TrackPlayer.addEventListener(Event.RemotePrevious, guarded(async () => {
    await flushCurrentEpisodeIfApplicable();
    await skipToPreviousInQueue();
  }));

  TrackPlayer.addEventListener(
    Event.RemoteJumpForward,
    guarded(async (event: RemoteJumpForwardEvent) => {
      const interval = event.interval > 0 ? event.interval : 30;
      await seekRelativeSeconds(interval);
      await flushCurrentEpisodeIfApplicable();
    }),
  );

  TrackPlayer.addEventListener(
    Event.RemoteJumpBackward,
    guarded(async (event: RemoteJumpBackwardEvent) => {
      const interval = event.interval > 0 ? event.interval : 30;
      await seekRelativeSeconds(-interval);
      await flushCurrentEpisodeIfApplicable();
    }),
  );

  TrackPlayer.addEventListener(Event.RemoteSeek, guarded(async (event: RemoteSeekEvent) => {
    await seekToPositionSeconds(event.position);
    await flushCurrentEpisodeIfApplicable();
  }));

  TrackPlayer.addEventListener(Event.RemoteDuck, guarded(async (event: RemoteDuckEvent) => {
    const store = usePlayerStore.getState();

    if (event.permanent) {
      store.setWasPlayingBeforeInterruption(false);
      await pausePlayback();
      await flushCurrentEpisodeIfApplicable();
      return;
    }

    if (event.paused) {
      const wasCurrentlyPlaying = store.isPlaying;
      store.setWasPlayingBeforeInterruption(wasCurrentlyPlaying);
      await pausePlayback();
      await flushCurrentEpisodeIfApplicable();
      return;
    }

    await TrackPlayer.setVolume(usePlayerStore.getState().volume);
    if (store.wasPlayingBeforeInterruption) {
      store.setWasPlayingBeforeInterruption(false);
      await resumePlayback();
    }
  }));

  TrackPlayer.addEventListener(
    Event.PlaybackState,
    guarded(async (playbackState: PlaybackState) => {
      const store = usePlayerStore.getState();
      if (playbackState.state === State.Error) {
        const errorMessage = playbackState.error?.message || 'playback error';
        await handleTrackPlaybackFailure(errorMessage);
        return;
      }

      if (playbackState.state === State.Playing) {
        clearStreamWatchdog();
        store.setIsPlaying(true);
        store.setIsBuffering(false);
        store.setPlaybackError(null);
      } else if (
        playbackState.state === State.Buffering ||
        playbackState.state === State.Loading
      ) {
        store.setIsBuffering(true);
      } else if (playbackState.state === State.Ready) {
        if (store.isPlaying || store.isBuffering) {
          store.setIsPlaying(true);
          store.setIsBuffering(false);
          await TrackPlayer.play().catch(() => {});
        }
      } else if (playbackState.state === State.Paused) {
        clearStreamWatchdog();
        store.setIsPlaying(false);
        store.setIsBuffering(false);
        await flushCurrentEpisodeIfApplicable();
      } else if (playbackState.state === State.Ended) {
        await handleTrackEnded();
      } else if (
        playbackState.state === State.Stopped ||
        playbackState.state === State.None
      ) {
        if (!store.isBuffering) {
          clearStreamWatchdog();
          store.setIsPlaying(false);
          store.setIsBuffering(false);
          await flushCurrentEpisodeIfApplicable();
        }
      }
    }),
  );

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, guarded(async () => {
    await handleTrackEnded();
  }));

  TrackPlayer.addEventListener(
    Event.PlaybackError,
    guarded(async (event: PlaybackErrorEvent) => {
      await handleTrackPlaybackFailure(event.message || 'stream error');
    }),
  );

  TrackPlayer.addEventListener(
    Event.PlaybackProgressUpdated,
    guarded(async (event: PlaybackProgressUpdatedEvent) => {
      const store = usePlayerStore.getState();
      store.setProgress(event.position, event.duration);

      const active = store.activeTrack;
      progressOwnerEpisodeId =
        active && active.sourceType === 'episode'
          ? (active.episodeId ?? active.id)
          : null;
      if (active && active.sourceType === 'episode' && store.isPlaying) {
        const episodeId = active.episodeId ?? active.id;
        recordEpisodePlaybackProgressThrottled(
          episodeId,
          event.position,
          event.duration || active.duration,
        );

        if (
          event.duration > 0 &&
          event.position >= event.duration - 0.5 &&
          !isTransitioningToNextTrack
        ) {
          await handleTrackEnded();
        }
      }
    }),
  );
}
