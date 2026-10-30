import TrackPlayer, {
  Event,
  PlaybackActiveTrackChangedEvent,
  PlaybackProgressUpdatedEvent,
  PlaybackState,
  RemoteDuckEvent,
  RemoteJumpBackwardEvent,
  RemoteJumpForwardEvent,
  RemoteSeekEvent,
  State,
} from 'react-native-track-player';
import {
  seekRelativeSeconds,
  seekToPositionSeconds,
  skipToNextInQueue,
  skipToPreviousInQueue,
  usePlayerStore,
} from '@entities/player';

export async function playbackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    await TrackPlayer.play();
    usePlayerStore.getState().setIsPlaying(true);
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    await TrackPlayer.pause();
    usePlayerStore.getState().setIsPlaying(false);
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    await TrackPlayer.stop();
    usePlayerStore.getState().setIsPlaying(false);
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    await skipToNextInQueue();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    await skipToPreviousInQueue();
  });

  TrackPlayer.addEventListener(
    Event.RemoteJumpForward,
    async (event: RemoteJumpForwardEvent) => {
      const interval = event.interval > 0 ? event.interval : 30;
      await seekRelativeSeconds(interval);
    },
  );

  TrackPlayer.addEventListener(
    Event.RemoteJumpBackward,
    async (event: RemoteJumpBackwardEvent) => {
      const interval = event.interval > 0 ? event.interval : 30;
      await seekRelativeSeconds(-interval);
    },
  );

  TrackPlayer.addEventListener(Event.RemoteSeek, async (event: RemoteSeekEvent) => {
    await seekToPositionSeconds(event.position);
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, async (event: RemoteDuckEvent) => {
    const store = usePlayerStore.getState();

    if (event.permanent) {
      store.setWasPlayingBeforeInterruption(false);
      await TrackPlayer.pause();
      store.setIsPlaying(false);
      return;
    }

    if (event.paused) {
      const wasCurrentlyPlaying = store.isPlaying;
      store.setWasPlayingBeforeInterruption(wasCurrentlyPlaying);
      await TrackPlayer.pause();
      store.setIsPlaying(false);
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
      const isPlaying = playbackState.state === State.Playing;
      const isBuffering =
        playbackState.state === State.Buffering ||
        playbackState.state === State.Loading;

      store.setIsPlaying(isPlaying);
      store.setIsBuffering(isBuffering);
    },
  );

  TrackPlayer.addEventListener(
    Event.PlaybackProgressUpdated,
    async (event: PlaybackProgressUpdatedEvent) => {
      usePlayerStore.getState().setProgress(event.position, event.duration);
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
