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
import { Q } from '@nozbe/watermelondb';
import { database, TableName, EpisodeModel } from '@shared/db';
import { fetchWithTimeout } from '@shared/api';
import { sanitizeImageUrl } from '@shared/lib';
import { flushEpisodePlaybackProgress } from '@entities/episode';
import { useStationFilterStore } from '@features/filter-stations';
import { PlayableTrack, PlaybackSpeed, usePlayerStore } from './store';

let isPlayerInitialized = false;
let streamWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
const triedFallbackTrackIds = new Set<string>();

export function clearStreamWatchdog(): void {
  if (streamWatchdogTimer !== null) {
    clearTimeout(streamWatchdogTimer);
    streamWatchdogTimer = null;
  }
}

function normalizeRadioStreamUrl(url: string): string {
  let normalized = url.trim();
  if (
    normalized.includes('195.95.206.17/HitFM') ||
    normalized.includes('online.hitfm.ua/HitFM')
  ) {
    return 'https://online.hitfm.ua/HitFM';
  }
  if (
    normalized.includes('195.95.206.14/KissFM') ||
    normalized.includes('online.kissfm.ua/KissFM')
  ) {
    return 'https://online.kissfm.ua/KissFM';
  }
  if (
    normalized.includes('195.95.206.16/RadioROKS') ||
    normalized.includes('online.radioroks.ua/RadioROKS')
  ) {
    return 'https://online.radioroks.ua/RadioROKS';
  }
  if (
    normalized.includes('195.95.206.18/MelodiaFM') ||
    normalized.includes('online.melodiafm.ua/MelodiaFM')
  ) {
    return 'https://online.melodiafm.ua/MelodiaFM';
  }
  if (
    normalized.includes('195.95.206.19/Relax') ||
    normalized.includes('online.radiorelax.ua/Relax')
  ) {
    return 'https://online.radiorelax.ua/Relax';
  }
  if (
    normalized.includes('195.95.206.20/NasheRadio') ||
    normalized.includes('online.nasheradio.ua/NasheRadio')
  ) {
    return 'https://online.nasheradio.ua/NasheRadio';
  }
  if (
    normalized.includes('195.95.206.82/Jazz') ||
    normalized.includes('online.radiojazz.ua/Jazz')
  ) {
    return 'https://online.radiojazz.ua/Jazz';
  }
  if (normalized.startsWith('http://online.') && normalized.includes('.ua/')) {
    return normalized.replace('http://', 'https://');
  }
  return normalized;
}

async function resolvePlaylistStreamUrl(rawUrl: string): Promise<string> {
  const normalizedInput = normalizeRadioStreamUrl(rawUrl);
  const trimmed = normalizedInput.trim();
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
          Accept: '*/*',
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
      minBuffer: 2,
      maxBuffer: 10,
      playBuffer: 0.5,
      backBuffer: 0,
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
  const sanitized = sanitizeImageUrl(playable.artworkUrl);
  const validArtwork = sanitized ? sanitized : undefined;

  return {
    id: playable.id,
    url: playable.streamOrFileUrl,
    type: isHls ? TrackType.HLS : undefined,
    title: playable.title,
    artist: playable.subtitle,
    artwork: validArtwork,
    duration: playable.duration > 0 ? playable.duration : undefined,
    isLiveStream: playable.sourceType === 'radio',
  };
}

export async function populatePodcastPseudoQueue(
  podcastId: string,
  currentEpisodeId: string,
): Promise<void> {
  try {
    const episodeCollection = database.get<EpisodeModel>(TableName.Episodes);
    const currentEpisode = await episodeCollection.find(currentEpisodeId).catch(() => null);
    const currentPublishedAt = currentEpisode?.publishedAt ?? Date.now();

    const upcomingEpisodes = await episodeCollection
      .query(
        Q.where('podcast_id', podcastId),
        Q.where('id', Q.notEq(currentEpisodeId)),
        Q.where('published_at', Q.lte(currentPublishedAt)),
        Q.sortBy('published_at', Q.desc),
        Q.take(5),
      )
      .fetch();

    if (upcomingEpisodes.length === 0) {
      return;
    }

    const store = usePlayerStore.getState();
    const manualQueue = store.queue.filter((item) => !item.isAutoGenerated);
    const pseudoTracks: PlayableTrack[] = upcomingEpisodes.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: store.activeTrack?.subtitle ?? '',
      artworkUrl: item.artworkUrl,
      streamOrFileUrl:
        item.localFilePath && item.downloadStatus === 'completed'
          ? item.localFilePath
          : item.audioUrl,
      sourceType: 'episode',
      duration: item.duration,
      episodeId: item.id,
      podcastId: item.podcastId,
      isAutoGenerated: true,
    }));

    store.setQueue([...manualQueue, ...pseudoTracks]);
  } catch {
    return;
  }
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
  triedFallbackTrackIds.delete(playable.id);
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

  const isSwitchingSource =
    previousActive && previousActive.sourceType !== playable.sourceType;

  if (isSwitchingSource) {
    store.setQueue([]);
  }

  if (resolvedPlayable.sourceType === 'radio') {
    if (isSwitchingSource || store.queue.length === 0) {
      const availableStations = useStationFilterStore.getState().stations;
      if (availableStations.length > 0) {
        const currentIdx = availableStations.findIndex(
          (item) => item.stationUuid === resolvedPlayable.id,
        );
        const startIdx = currentIdx >= 0 ? currentIdx + 1 : 0;
        const upcoming = availableStations.slice(startIdx, startIdx + 10);
        const radioQueue: PlayableTrack[] = upcoming.map((item) => ({
          id: item.stationUuid,
          title: item.name,
          subtitle: `${item.country || 'Radio'} • ${item.codec}`,
          artworkUrl: item.faviconUrl,
          streamOrFileUrl: item.streamUrl,
          fallbackStreamUrl: item.fallbackStreamUrl,
          sourceType: 'radio',
          duration: 0,
          isAutoGenerated: true,
        }));
        store.setQueue(radioQueue);
      }
    }
  } else if (resolvedPlayable.sourceType === 'episode' && resolvedPlayable.podcastId) {
    const episodeId = resolvedPlayable.episodeId ?? resolvedPlayable.id;
    populatePodcastPseudoQueue(resolvedPlayable.podcastId, episodeId).catch(() => {});
  }

  try {
    await TrackPlayer.reset();
    const currentTrackNative = mapPlayableTrackToNativeTrack(resolvedPlayable);
    if (resolvedPlayable.sourceType === 'radio') {
      await TrackPlayer.add([currentTrackNative]);
    } else {
      const queuedTracksNative = store.queue
        .filter((item) => item.id !== resolvedPlayable.id)
        .map(mapPlayableTrackToNativeTrack);
      await TrackPlayer.add([currentTrackNative, ...queuedTracksNative]);
    }

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

    await TrackPlayer.setVolume(1.0);
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

  if (queue.length > 0) {
    const [nextTrack, ...remainingQueue] = queue;
    store.setQueue(remainingQueue);
    await startPlayableTrack(nextTrack, 0);

    if (nextTrack.sourceType === 'episode' && nextTrack.podcastId) {
      const remainingPseudo = remainingQueue.filter((item) => item.isAutoGenerated).length;
      if (remainingPseudo < 3) {
        const episodeId = nextTrack.episodeId ?? nextTrack.id;
        populatePodcastPseudoQueue(nextTrack.podcastId, episodeId).catch(() => {});
      }
    }
    return;
  }

  if (activeTrack?.sourceType === 'radio') {
    const availableStations = useStationFilterStore.getState().stations;
    if (availableStations.length > 0) {
      const currentIndex = availableStations.findIndex(
        (item) => item.stationUuid === activeTrack.id,
      );
      const nextIndex = (currentIndex + 1) % availableStations.length;
      const station = availableStations[nextIndex];
      const nextRadio: PlayableTrack = {
        id: station.stationUuid,
        title: station.name,
        subtitle: `${station.country || 'Radio'} • ${station.codec}`,
        artworkUrl: station.faviconUrl,
        streamOrFileUrl: station.streamUrl,
        fallbackStreamUrl: station.fallbackStreamUrl,
        sourceType: 'radio',
        duration: 0,
        isAutoGenerated: true,
      };
      await startPlayableTrack(nextRadio, 0);
    }
    return;
  }

  if (activeTrack?.sourceType === 'episode' && activeTrack.podcastId) {
    const episodeId = activeTrack.episodeId ?? activeTrack.id;
    await populatePodcastPseudoQueue(activeTrack.podcastId, episodeId);
    const updatedStore = usePlayerStore.getState();
    if (updatedStore.queue.length > 0) {
      const [nextTrack, ...remainingQueue] = updatedStore.queue;
      updatedStore.setQueue(remainingQueue);
      await startPlayableTrack(nextTrack, 0);
    }
  }
}

export async function skipToPreviousInQueue(): Promise<void> {
  const store = usePlayerStore.getState();
  const { activeTrack } = store;
  if (!activeTrack) {
    return;
  }

  await ensureTrackPlayerInitialized();
  if (activeTrack.sourceType === 'radio') {
    const availableStations = useStationFilterStore.getState().stations;
    if (availableStations.length > 0) {
      const currentIndex = availableStations.findIndex(
        (item) => item.stationUuid === activeTrack.id,
      );
      const prevIndex =
        currentIndex > 0 ? currentIndex - 1 : availableStations.length - 1;
      const station = availableStations[prevIndex];
      const prevRadio: PlayableTrack = {
        id: station.stationUuid,
        title: station.name,
        subtitle: `${station.country || 'Radio'} • ${station.codec}`,
        artworkUrl: station.faviconUrl,
        streamOrFileUrl: station.streamUrl,
        fallbackStreamUrl: station.fallbackStreamUrl,
        sourceType: 'radio',
        duration: 0,
        isAutoGenerated: true,
      };
      await startPlayableTrack(prevRadio, 0);
    }
    return;
  }

  if (activeTrack.sourceType === 'episode') {
    const progress = await TrackPlayer.getProgress();
    if (progress.position > 5) {
      await TrackPlayer.seekTo(0);
      store.setProgress(0, progress.duration);
      return;
    }

    if (activeTrack.podcastId) {
      try {
        const episodeId = activeTrack.episodeId ?? activeTrack.id;
        const episodeCollection = database.get<EpisodeModel>(TableName.Episodes);
        const currentEpisode = await episodeCollection.find(episodeId).catch(() => null);
        if (currentEpisode) {
          const previousEpisodes = await episodeCollection
            .query(
              Q.where('podcast_id', activeTrack.podcastId),
              Q.where('id', Q.notEq(episodeId)),
              Q.where('published_at', Q.gte(currentEpisode.publishedAt)),
              Q.sortBy('published_at', Q.asc),
              Q.take(1),
            )
            .fetch();

          if (previousEpisodes.length > 0) {
            const prevEp = previousEpisodes[0];
            const prevTrack: PlayableTrack = {
              id: prevEp.id,
              title: prevEp.title,
              subtitle: activeTrack.subtitle,
              artworkUrl: prevEp.artworkUrl,
              streamOrFileUrl:
                prevEp.localFilePath && prevEp.downloadStatus === 'completed'
                  ? prevEp.localFilePath
                  : prevEp.audioUrl,
              sourceType: 'episode',
              duration: prevEp.duration,
              episodeId: prevEp.id,
              podcastId: prevEp.podcastId,
            };
            await startPlayableTrack(prevTrack, 0);
            return;
          }
        }
      } catch {}
    }

    await TrackPlayer.seekTo(0);
    store.setProgress(0, store.durationSeconds);
  }
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

  const manualTracks = store.queue.filter((item) => !item.isAutoGenerated);
  const autoTracks = store.queue.filter((item) => item.isAutoGenerated);
  const nextQueue = [
    ...manualTracks,
    { ...playable, isAutoGenerated: false },
    ...autoTracks,
  ];
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
