import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  IOSCategory,
  IOSCategoryMode,
  RepeatMode,
  State,
  Track,
} from 'react-native-track-player';
import { PlayableTrack, PlaybackSpeed, usePlayerStore } from './store';

let isPlayerInitialized = false;

export async function ensureTrackPlayerInitialized(): Promise<void> {
  if (isPlayerInitialized) {
    return;
  }

  try {
    await TrackPlayer.setupPlayer({
      minBuffer: 15,
      maxBuffer: 50,
      playBuffer: 2.5,
      backBuffer: 10,
      iosCategory: IOSCategory.Playback,
      iosCategoryMode: IOSCategoryMode.SpokenAudio,
      autoHandleInterruptions: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!message.toLowerCase().includes('already been initialized')) {
      throw error;
    }
  }

  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      alwaysPauseOnInterruption: true,
    },
    forwardJumpInterval: 30,
    backwardJumpInterval: 30,
    progressUpdateEventInterval: 1,
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.Stop,
      Capability.SeekTo,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.JumpForward,
      Capability.JumpBackward,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.JumpBackward,
      Capability.JumpForward,
    ],
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToPrevious,
      Capability.SkipToNext,
      Capability.JumpBackward,
      Capability.JumpForward,
      Capability.SeekTo,
    ],
  });

  await TrackPlayer.setRepeatMode(RepeatMode.Off);
  isPlayerInitialized = true;
}

export function mapPlayableTrackToNativeTrack(playable: PlayableTrack): Track {
  return {
    id: playable.id,
    url: playable.streamOrFileUrl,
    title: playable.title,
    artist: playable.subtitle,
    artwork: playable.artworkUrl || undefined,
    duration: playable.duration > 0 ? playable.duration : undefined,
    isLiveStream: playable.sourceType === 'radio',
  };
}

export async function startPlayableTrack(
  playable: PlayableTrack,
  initialPositionSeconds = 0,
): Promise<void> {
  await ensureTrackPlayerInitialized();

  const store = usePlayerStore.getState();
  store.setActiveTrack(playable);
  store.setIsBuffering(true);

  const currentQueue = store.queue;
  const existingIndex = currentQueue.findIndex((item) => item.id === playable.id);

  let nextQueue: PlayableTrack[];
  if (playable.sourceType === 'radio') {
    nextQueue = [playable];
  } else if (existingIndex >= 0) {
    nextQueue = currentQueue;
  } else {
    nextQueue = [...currentQueue.filter((t) => t.sourceType !== 'radio'), playable];
  }

  store.setQueue(nextQueue);

  await TrackPlayer.reset();
  const nativeTracks = nextQueue.map(mapPlayableTrackToNativeTrack);
  await TrackPlayer.add(nativeTracks);

  const targetIndex = nextQueue.findIndex((item) => item.id === playable.id);
  if (targetIndex > 0) {
    await TrackPlayer.skip(targetIndex);
  }

  if (playable.sourceType === 'episode' && initialPositionSeconds > 0) {
    await TrackPlayer.seekTo(initialPositionSeconds);
    store.setProgress(initialPositionSeconds, playable.duration);
  } else {
    store.setProgress(0, playable.duration);
  }

  if (playable.sourceType === 'episode') {
    await TrackPlayer.setRate(store.playbackSpeed);
  } else {
    await TrackPlayer.setRate(1.0);
  }

  await TrackPlayer.play();
  store.setIsPlaying(true);
}

export async function togglePlaybackState(): Promise<void> {
  await ensureTrackPlayerInitialized();
  const playbackState = await TrackPlayer.getPlaybackState();
  const store = usePlayerStore.getState();

  if (
    playbackState.state === State.Playing ||
    playbackState.state === State.Buffering
  ) {
    await TrackPlayer.pause();
    store.setIsPlaying(false);
  } else {
    if (store.activeTrack && playbackState.state === State.None) {
      await startPlayableTrack(store.activeTrack, store.positionSeconds);
      return;
    }
    await TrackPlayer.play();
    store.setIsPlaying(true);
  }
}

export async function seekRelativeSeconds(deltaSeconds: number): Promise<void> {
  const store = usePlayerStore.getState();
  if (!store.activeTrack || store.activeTrack.sourceType === 'radio') {
    return;
  }

  await ensureTrackPlayerInitialized();
  const progress = await TrackPlayer.getProgress();
  const duration = progress.duration > 0 ? progress.duration : store.durationSeconds;
  const unclampedTarget = progress.position + deltaSeconds;
  const clampedTarget =
    duration > 0
      ? Math.max(0, Math.min(duration, unclampedTarget))
      : Math.max(0, unclampedTarget);

  await TrackPlayer.seekTo(clampedTarget);
  store.setProgress(clampedTarget, duration);
}

export async function seekToPositionSeconds(positionSeconds: number): Promise<void> {
  const store = usePlayerStore.getState();
  if (!store.activeTrack || store.activeTrack.sourceType === 'radio') {
    return;
  }

  await ensureTrackPlayerInitialized();
  const clamped = Math.max(0, positionSeconds);
  await TrackPlayer.seekTo(clamped);
  store.setProgress(clamped, store.durationSeconds);
}

export async function changePlaybackSpeed(speed: PlaybackSpeed): Promise<void> {
  const store = usePlayerStore.getState();
  store.setPlaybackSpeed(speed);

  await ensureTrackPlayerInitialized();
  if (store.activeTrack?.sourceType !== 'radio') {
    await TrackPlayer.setRate(speed);
  }
}

export async function skipToNextInQueue(): Promise<void> {
  const store = usePlayerStore.getState();
  const { queue, activeTrack } = store;
  if (!activeTrack || queue.length <= 1) {
    return;
  }

  const currentIndex = queue.findIndex((item) => item.id === activeTrack.id);
  if (currentIndex < 0 || currentIndex + 1 >= queue.length) {
    return;
  }

  const nextTrack = queue[currentIndex + 1];
  await ensureTrackPlayerInitialized();
  await TrackPlayer.skipToNext();
  await TrackPlayer.play();
  store.setActiveTrack(nextTrack);
  store.setIsPlaying(true);
}

export async function skipToPreviousInQueue(): Promise<void> {
  const store = usePlayerStore.getState();
  const { queue, activeTrack } = store;
  if (!activeTrack) {
    return;
  }

  await ensureTrackPlayerInitialized();
  const progress = await TrackPlayer.getProgress();
  if (progress.position > 5) {
    await TrackPlayer.seekTo(0);
    store.setProgress(0, progress.duration);
    return;
  }

  const currentIndex = queue.findIndex((item) => item.id === activeTrack.id);
  if (currentIndex <= 0) {
    await TrackPlayer.seekTo(0);
    store.setProgress(0, progress.duration);
    return;
  }

  const previousTrack = queue[currentIndex - 1];
  await TrackPlayer.skipToPrevious();
  await TrackPlayer.play();
  store.setActiveTrack(previousTrack);
  store.setIsPlaying(true);
}
