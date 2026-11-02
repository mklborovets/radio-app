import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  IOSCategory,
  IOSCategoryMode,
  RepeatMode,
  State,
  Track,
  TrackType,
} from 'react-native-track-player';
import { fetchWithTimeout } from '@shared/api';
import { flushEpisodePlaybackProgress } from '@entities/episode';
import { PlayableTrack, PlaybackSpeed, usePlayerStore } from './store';

let isPlayerInitialized = false;
let streamWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
const triedFallbackTrackIds = new Set<string>();

const STREAM_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

export function clearStreamWatchdog(): void {
  if (streamWatchdogTimer !== null) {
    clearTimeout(streamWatchdogTimer);
    streamWatchdogTimer = null;
  }
}

async function resolvePlaylistStreamUrl(rawUrl: string): Promise<string> {
  const trimmed = rawUrl.trim();
  const lower = trimmed.toLowerCase();
  const isPls = lower.endsWith('.pls') || lower.includes('.pls?');
  const isM3u =
    (lower.endsWith('.m3u') || lower.includes('.m3u?')) && !lower.includes('.m3u8');
  const isAsx = lower.endsWith('.asx') || lower.includes('.asx?');

  if (!isPls && !isM3u && !isAsx) {
    return trimmed;
  }

  try {
    const response = await fetchWithTimeout(
      trimmed,
      {
        method: 'GET',
        headers: {
          'User-Agent': STREAM_USER_AGENT,
        },
      },
      8000,
    );
    const body = await response.text();
    const lines = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('file') || lowerLine.startsWith('ref') || lowerLine.includes('href=')) {
        const eqIndex = line.indexOf('=');
        if (eqIndex > 0) {
          const candidate = line.slice(eqIndex + 1).replace(/["']/g, '').trim();
          if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
            return candidate;
          }
        }
      } else if (line.startsWith('http://') || line.startsWith('https://')) {
        return line;
      }
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

export async function ensureTrackPlayerInitialized(): Promise<void> {
  if (isPlayerInitialized) {
    return;
  }

  try {
    await TrackPlayer.setupPlayer({
      minBuffer: 15,
      maxBuffer: 50,
      playBuffer: 2.0,
      backBuffer: 10,
      iosCategory: IOSCategory.Playback,
      iosCategoryMode: IOSCategoryMode.Default,
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
  const lowerUrl = playable.streamOrFileUrl.toLowerCase();
  const isHls = lowerUrl.includes('.m3u8');
  const rawArtwork = playable.artworkUrl?.trim();
  const validArtwork =
    rawArtwork &&
    rawArtwork !== 'null' &&
    rawArtwork !== 'undefined' &&
    (rawArtwork.startsWith('http://') ||
      rawArtwork.startsWith('https://') ||
      rawArtwork.startsWith('file://'))
      ? rawArtwork
      : undefined;

  return {
    id: playable.id,
    url: playable.streamOrFileUrl,
    type: isHls ? TrackType.HLS : undefined,
    userAgent: STREAM_USER_AGENT,
    headers: {
      'User-Agent': STREAM_USER_AGENT,
    },
    title: playable.title,
    artist: playable.subtitle,
    artwork: validArtwork,
    duration: playable.duration > 0 ? playable.duration : undefined,
    isLiveStream: playable.sourceType === 'radio',
  };
}

export async function handleTrackPlaybackFailure(reason?: string): Promise<void> {
  clearStreamWatchdog();
  const store = usePlayerStore.getState();
  const active = store.activeTrack;
  if (!active) {
    return;
  }

  if (
    active.fallbackStreamUrl &&
    active.fallbackStreamUrl !== active.streamOrFileUrl &&
    !triedFallbackTrackIds.has(active.id)
  ) {
    triedFallbackTrackIds.add(active.id);
    const fallbackTrack: PlayableTrack = {
      ...active,
      streamOrFileUrl: active.fallbackStreamUrl,
    };
    await startPlayableTrack(fallbackTrack, 0);
    return;
  }

  store.setIsBuffering(false);
  store.setIsPlaying(false);
  const detail = reason ? ` (${reason})` : '';
  store.setPlaybackError(
    `Cannot play "${active.title}": stream is offline or unsupported format${detail}.`,
  );

  try {
    await TrackPlayer.stop();
  } catch {
    return;
  }
}

export async function startPlayableTrack(
  playable: PlayableTrack,
  initialPositionSeconds = 0,
): Promise<void> {
  clearStreamWatchdog();
  await ensureTrackPlayerInitialized();

  const store = usePlayerStore.getState();
  const previousActive = store.activeTrack;
  if (
    previousActive &&
    previousActive.sourceType === 'episode' &&
    previousActive.id !== playable.id
  ) {
    const episodeId = previousActive.episodeId ?? previousActive.id;
    await flushEpisodePlaybackProgress(
      episodeId,
      store.positionSeconds,
      store.durationSeconds || previousActive.duration,
    ).catch(() => {});
  }

  store.setPlaybackError(null);
  store.setActiveTrack(playable);
  store.setIsBuffering(true);

  const resolvedUrl =
    playable.sourceType === 'radio'
      ? await resolvePlaylistStreamUrl(playable.streamOrFileUrl)
      : playable.streamOrFileUrl;

  const resolvedPlayable: PlayableTrack = {
    ...playable,
    streamOrFileUrl: resolvedUrl,
  };

  store.setActiveTrack(resolvedPlayable);

  const currentQueue = store.queue;
  const existingIndex = currentQueue.findIndex(
    (item) => item.id === resolvedPlayable.id,
  );

  if (existingIndex >= 0) {
    const nextQueue = currentQueue.map((item, idx) =>
      idx === existingIndex ? resolvedPlayable : item,
    );
    store.setQueue(nextQueue);
  }

  try {
    await TrackPlayer.reset();
    const currentTrackNative = mapPlayableTrackToNativeTrack(resolvedPlayable);
    const queuedTracksNative = store.queue
      .filter((item) => item.id !== resolvedPlayable.id)
      .map(mapPlayableTrackToNativeTrack);
    await TrackPlayer.add([currentTrackNative, ...queuedTracksNative]);

    if (resolvedPlayable.sourceType === 'episode' && initialPositionSeconds > 0) {
      await TrackPlayer.seekTo(initialPositionSeconds);
      store.setProgress(initialPositionSeconds, resolvedPlayable.duration);
    } else {
      store.setProgress(0, resolvedPlayable.duration);
    }

    if (resolvedPlayable.sourceType === 'episode') {
      await TrackPlayer.setRate(store.playbackSpeed);
    } else {
      await TrackPlayer.setRate(1.0);
    }

    await TrackPlayer.play();
    store.setIsPlaying(true);

    if (resolvedPlayable.sourceType === 'radio') {
      streamWatchdogTimer = setTimeout(() => {
        TrackPlayer.getPlaybackState()
          .then((playbackState) => {
            const latestStore = usePlayerStore.getState();
            if (
              latestStore.activeTrack?.id === resolvedPlayable.id &&
              playbackState.state !== State.Playing
            ) {
              handleTrackPlaybackFailure('connection timeout').catch(() => {});
            }
          })
          .catch(() => {});
      }, 25000);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'stream load error';
    await handleTrackPlaybackFailure(message);
  }
}

export async function togglePlaybackState(): Promise<void> {
  await ensureTrackPlayerInitialized();
  const playbackState = await TrackPlayer.getPlaybackState();
  const store = usePlayerStore.getState();

  if (
    playbackState.state === State.Playing ||
    playbackState.state === State.Buffering
  ) {
    clearStreamWatchdog();
    if (store.activeTrack?.sourceType === 'radio') {
      await TrackPlayer.stop();
    } else {
      await TrackPlayer.pause();
    }
    store.setIsPlaying(false);
    store.setIsBuffering(false);
  } else {
    if (store.activeTrack?.sourceType === 'radio') {
      await startPlayableTrack(store.activeTrack, 0);
      return;
    }
    if (
      store.activeTrack &&
      (playbackState.state === State.None ||
        playbackState.state === State.Error ||
        playbackState.state === State.Stopped)
    ) {
      triedFallbackTrackIds.delete(store.activeTrack.id);
      await startPlayableTrack(store.activeTrack, store.positionSeconds);
      return;
    }
    store.setPlaybackError(null);
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
  if (queue.length === 0) {
    return;
  }

  const currentIndex = activeTrack
    ? queue.findIndex((item) => item.id === activeTrack.id)
    : -1;

  let nextTrack: PlayableTrack | null = null;
  if (currentIndex >= 0 && currentIndex + 1 < queue.length) {
    nextTrack = queue[currentIndex + 1];
  } else if (currentIndex < 0 && queue.length > 0) {
    nextTrack = queue[0];
  }

  if (nextTrack) {
    await startPlayableTrack(nextTrack, 0);
  }
}

export async function skipToPreviousInQueue(): Promise<void> {
  const store = usePlayerStore.getState();
  const { queue, activeTrack } = store;
  if (!activeTrack) {
    return;
  }

  await ensureTrackPlayerInitialized();
  if (activeTrack.sourceType === 'episode') {
    const progress = await TrackPlayer.getProgress();
    if (progress.position > 5) {
      await TrackPlayer.seekTo(0);
      store.setProgress(0, progress.duration);
      return;
    }
  }

  const currentIndex = queue.findIndex((item) => item.id === activeTrack.id);
  if (currentIndex <= 0) {
    if (activeTrack.sourceType === 'episode') {
      await TrackPlayer.seekTo(0);
      store.setProgress(0, store.durationSeconds);
    }
    return;
  }

  const previousTrack = queue[currentIndex - 1];
  await startPlayableTrack(previousTrack, 0);
}

export async function appendTrackToPlaybackQueue(playable: PlayableTrack): Promise<void> {
  await ensureTrackPlayerInitialized();
  const store = usePlayerStore.getState();

  const existingIndex = store.queue.findIndex((item) => item.id === playable.id);
  if (existingIndex >= 0) {
    if (store.activeTrack?.id !== playable.id) {
      await removeTrackFromPlaybackQueue(playable.id);
    }
    return;
  }

  if (!store.activeTrack) {
    await startPlayableTrack(playable, 0);
    return;
  }

  const nextQueue = [...store.queue, playable];
  store.setQueue(nextQueue);
  try {
    await TrackPlayer.add(mapPlayableTrackToNativeTrack(playable));
  } catch {
    return;
  }
}

export async function reorderPlaybackQueue(
  fromIndex: number,
  toIndex: number,
): Promise<void> {
  const store = usePlayerStore.getState();
  const currentQueue = store.queue;
  if (
    fromIndex < 0 ||
    fromIndex >= currentQueue.length ||
    toIndex < 0 ||
    toIndex >= currentQueue.length ||
    fromIndex === toIndex
  ) {
    return;
  }

  const reordered = [...currentQueue];
  const [movedItem] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, movedItem);
  store.setQueue(reordered);

  await ensureTrackPlayerInitialized();
  try {
    await TrackPlayer.move(fromIndex, toIndex);
  } catch {
    return;
  }
}

export async function removeTrackFromPlaybackQueue(trackId: string): Promise<void> {
  const store = usePlayerStore.getState();
  const index = store.queue.findIndex((item) => item.id === trackId);
  if (index < 0) {
    return;
  }

  const isRemovingActive = store.activeTrack?.id === trackId;
  const nextQueue = store.queue.filter((item) => item.id !== trackId);
  store.setQueue(nextQueue);

  await ensureTrackPlayerInitialized();

  if (nextQueue.length === 0) {
    clearStreamWatchdog();
    await TrackPlayer.reset();
    store.setActiveTrack(null);
    store.setIsPlaying(false);
    store.setIsBuffering(false);
    return;
  }

  if (isRemovingActive) {
    const nextActiveIndex = Math.min(index, nextQueue.length - 1);
    const nextActive = nextQueue[nextActiveIndex];
    await startPlayableTrack(nextActive, 0);
  } else {
    try {
      await TrackPlayer.remove(index);
    } catch {
      return;
    }
  }
}

export async function clearPlaybackQueue(): Promise<void> {
  const store = usePlayerStore.getState();
  store.setQueue([]);

  await ensureTrackPlayerInitialized();
  try {
    const queue = await TrackPlayer.getQueue();
    const activeIndex = await TrackPlayer.getActiveTrackIndex();
    if (activeIndex !== undefined && activeIndex !== null && queue.length > 1) {
      const activeTrack = queue[activeIndex];
      await TrackPlayer.reset();
      if (activeTrack) {
        await TrackPlayer.add([activeTrack]);
        if (store.isPlaying) {
          await TrackPlayer.play();
        }
      }
    }
  } catch {}
}
