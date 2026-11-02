import TrackPlayer, {
  Event,
  PlaybackActiveTrackChangedEvent,
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
  clearStreamWatchdog,
  handleTrackPlaybackFailure,
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

async function flushCurrentEpisodeIfApplicable(): Promise<void> {
  const store = usePlayerStore.getState();
  const active = store.activeTrack;
  if (!active || active.sourceType !== 'episode') {
    return;
  }

  const episodeId = active.episodeId ?? active.id;
  await flushEpisodePlaybackProgress(
    episodeId,
    store.positionSeconds,
    store.durationSeconds || active.duration,
  );
}

export async function playbackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    await TrackPlayer.play();
    usePlayerStore.getState().setIsPlaying(true);
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    await TrackPlayer.pause();
    usePlayerStore.getState().setIsPlaying(false);
    await flushCurrentEpisodeIfApplicable();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    await flushCurrentEpisodeIfApplicable();
    await TrackPlayer.stop();
    usePlayerStore.getState().setIsPlaying(false);
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    await flushCurrentEpisodeIfApplicable();
    await skipToNextInQueue();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    await flushCurrentEpisodeIfApplicable();
    await skipToPreviousInQueue();
  });

  TrackPlayer.addEventListener(
    Event.RemoteJumpForward,
    async (event: RemoteJumpForwardEvent) => {
      const interval = event.interval > 0 ? event.interval : 30;
      await seekRelativeSeconds(interval);
      await flushCurrentEpisodeIfApplicable();
    },
  );

  TrackPlayer.addEventListener(
    Event.RemoteJumpBackward,
    async (event: RemoteJumpBackwardEvent) => {
      const interval = event.interval > 0 ? event.interval : 30;
      await seekRelativeSeconds(-interval);
      await flushCurrentEpisodeIfApplicable();
    },
  );

  TrackPlayer.addEventListener(Event.RemoteSeek, async (event: RemoteSeekEvent) => {
    await seekToPositionSeconds(event.position);
    await flushCurrentEpisodeIfApplicable();
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, async (event: RemoteDuckEvent) => {
    const store = usePlayerStore.getState();

    if (event.permanent) {
      store.setWasPlayingBeforeInterruption(false);
      await TrackPlayer.pause();
      store.setIsPlaying(false);
      await flushCurrentEpisodeIfApplicable();
      return;
    }

    if (event.paused) {
      const wasCurrentlyPlaying = store.isPlaying;
      store.setWasPlayingBeforeInterruption(wasCurrentlyPlaying);
      await TrackPlayer.pause();
      store.setIsPlaying(false);
      await flushCurrentEpisodeIfApplicable();
      return;
    }

    await TrackPlayer.setVolume(1.0);
    if (store.wasPlayingBeforeInterruption) {
      store.setWasPlayingBeforeInterruption(false);
      await TrackPlayer.play();
      store.setIsPlaying(true);
    }
  });

  TrackPlayer.addEventListener(
    Event.PlaybackState,
    async (playbackState: PlaybackState) => {
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
      } else if (
        playbackState.state === State.Paused ||
        playbackState.state === State.Ended
      ) {
        clearStreamWatchdog();
        store.setIsPlaying(false);
        store.setIsBuffering(false);
        await flushCurrentEpisodeIfApplicable();
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
    },
  );

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
    await flushCurrentEpisodeIfApplicable();
    await skipToNextInQueue();
  });

  TrackPlayer.addEventListener(
    Event.PlaybackError,
    async (event: PlaybackErrorEvent) => {
      await handleTrackPlaybackFailure(event.message || 'stream error');
    },
  );

  TrackPlayer.addEventListener(
    Event.PlaybackProgressUpdated,
    async (event: PlaybackProgressUpdatedEvent) => {
      const store = usePlayerStore.getState();
      store.setProgress(event.position, event.duration);

      const active = store.activeTrack;
      if (active && active.sourceType === 'episode' && store.isPlaying) {
        const episodeId = active.episodeId ?? active.id;
        recordEpisodePlaybackProgressThrottled(
          episodeId,
          event.position,
          event.duration || active.duration,
        );
      }
    },
  );

  TrackPlayer.addEventListener(
    Event.PlaybackActiveTrackChanged,
    async (event: PlaybackActiveTrackChangedEvent) => {
      if (!event.track || !event.track.id) {
        return;
      }
      const store = usePlayerStore.getState();
      const matched = store.queue.find((item) => item.id === event.track?.id);
      if (matched && store.activeTrack?.id !== matched.id) {
        store.setActiveTrack(matched);
      }
    },
  );
}
