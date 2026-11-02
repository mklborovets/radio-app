import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderHandlers,
  LayoutChangeEvent,
  PanResponder,
  View,
} from 'react-native';
import {
  getPlaybackVolume,
  PlayableTrack,
  seekToPositionSeconds,
  setPlaybackVolume,
  usePlayerStore,
} from '@entities/player';
import {
  getFavoriteStationUuids,
  RadioStation,
  toggleFavoriteStationInDb,
} from '@entities/station';
import { useStationFilterStore } from '@features/filter-stations';
import {
  enforceCacheStorageLimitLru,
  pauseEpisodeDownload,
  startOrResumeEpisodeDownload,
  useDownloadManagerStore,
} from '@features/download-episode';
import { database, TableName } from '@shared/db';
import { EpisodeDownloadStatus, EpisodeModel } from '@shared/db/models/EpisodeModel';
import { formatTime, getInitials } from '@shared/lib';

export interface UseFullPlayerResult {
  activeTrack: PlayableTrack | null;
  playbackError: string | null;
  isRadio: boolean;
  isBuffering: boolean;
  hasTimeline: boolean;
  headerTitle: string;
  liveBadgeLabel: string;
  initials: string;
  progressRatio: number;
  positionSeconds: number;
  effectiveDuration: number;
  formattedPosition: string;
  formattedDuration: string;
  isDownloaded: boolean;
  downloadEpisodeLabel: string;
  isStationFavorite: boolean;
  volume: number;
  onToggleDownloadEpisode: () => void;
  onToggleFavoriteStation: () => void;
  onScrubToRatio: (ratio: number) => void;
  onChangeVolume: (volume: number) => void;
  onToggleMute: () => void;
  onDismissError: () => void;
}

export function useFullPlayer(): UseFullPlayerResult {
  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const playbackError = usePlayerStore((state) => state.playbackError);
  const positionSeconds = usePlayerStore((state) => state.positionSeconds);
  const durationSeconds = usePlayerStore((state) => state.durationSeconds);
  const setPlaybackError = usePlayerStore((state) => state.setPlaybackError);

  const isRadio = activeTrack?.sourceType === 'radio';
  const effectiveDuration =
    durationSeconds > 0 ? durationSeconds : activeTrack?.duration ?? 0;
  const hasTimeline = !isRadio && effectiveDuration > 0;
  const progressRatio = hasTimeline
    ? Math.min(1, Math.max(0, positionSeconds / effectiveDuration))
    : 0;

  const episodeId = !isRadio
    ? activeTrack?.episodeId ?? activeTrack?.id ?? null
    : null;
  const [dbDownloadStatus, setDbDownloadStatus] =
    useState<EpisodeDownloadStatus>('none');
  const task = useDownloadManagerStore((state) =>
    episodeId ? state.tasks[episodeId] : undefined,
  );

  const [volume, setVolumeState] = useState<number>(1);
  const previousVolumeRef = useRef<number>(1);

  const stationUuid = isRadio ? activeTrack?.id : null;
  const [isFavoriteInDb, setIsFavoriteInDb] = useState<boolean>(false);

  const isStationFavorite = useStationFilterStore((state) => {
    const matched = state.stations.find((s) => s.stationUuid === stationUuid);
    return matched !== undefined ? matched.isFavorite : isFavoriteInDb;
  });

  useEffect(() => {
    let isMounted = true;
    if (!stationUuid) {
      setIsFavoriteInDb(false);
      return;
    }
    getFavoriteStationUuids()
      .then((favs) => {
        if (isMounted) {
          setIsFavoriteInDb(favs.has(stationUuid));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [stationUuid]);

  const onToggleFavoriteStation = useCallback(async () => {
    if (!activeTrack || !isRadio) {
      return;
    }
    const existingInStore = useStationFilterStore
      .getState()
      .stations.find((s) => s.stationUuid === activeTrack.id);

    const station: RadioStation = existingInStore ?? {
      stationUuid: activeTrack.id,
      name: activeTrack.title,
      streamUrl: activeTrack.streamOrFileUrl,
      fallbackStreamUrl:
        activeTrack.fallbackStreamUrl || activeTrack.streamOrFileUrl,
      faviconUrl: activeTrack.artworkUrl,
      country: '',
      countryCode: '',
      tags: [],
      bitrate: 0,
      codec: 'MP3',
      isFavorite: isStationFavorite,
    };

    const isNowFav = await toggleFavoriteStationInDb(station);
    setIsFavoriteInDb(isNowFav);

    useStationFilterStore.setState((state) => {
      const exists = state.stations.some(
        (s) => s.stationUuid === station.stationUuid,
      );
      if (!exists) {
        return {
          stations: [{ ...station, isFavorite: isNowFav }, ...state.stations],
        };
      }
      return {
        stations: state.stations.map((s) =>
          s.stationUuid === station.stationUuid
            ? { ...s, isFavorite: isNowFav }
            : s,
        ),
      };
    });
  }, [activeTrack, isRadio, isStationFavorite]);

  useEffect(() => {
    let isMounted = true;
    getPlaybackVolume()
      .then((vol) => {
        if (isMounted && typeof vol === 'number') {
          setVolumeState(vol);
          if (vol > 0) {
            previousVolumeRef.current = vol;
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const onChangeVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (clamped > 0) {
      previousVolumeRef.current = clamped;
    }
    setPlaybackVolume(clamped).catch(() => {});
  }, []);

  const onToggleMute = useCallback(() => {
    if (volume > 0) {
      previousVolumeRef.current = volume;
      setVolumeState(0);
      setPlaybackVolume(0).catch(() => {});
    } else {
      const restore =
        previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.8;
      setVolumeState(restore);
      setPlaybackVolume(restore).catch(() => {});
    }
  }, [volume]);

  useEffect(() => {
    let isCancelled = false;
    if (!episodeId) {
      setDbDownloadStatus('none');
      return;
    }

    database
      .get<EpisodeModel>(TableName.Episodes)
      .find(episodeId)
      .then((record) => {
        if (!isCancelled && record) {
          setDbDownloadStatus(record.downloadStatus);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [episodeId, task?.status]);

  const onToggleDownloadEpisode = useCallback(() => {
    if (!episodeId) {
      return;
    }
    if (task?.status === 'downloading') {
      pauseEpisodeDownload(episodeId).catch(() => {});
      return;
    }
    if (task?.status === 'completed' || dbDownloadStatus === 'completed') {
      return;
    }
    startOrResumeEpisodeDownload(episodeId, async () => {
      await enforceCacheStorageLimitLru(undefined, episodeId);
      setDbDownloadStatus('completed');
    }).catch(() => {});
  }, [episodeId, task?.status, dbDownloadStatus]);

  const isDownloaded =
    task?.status === 'completed' || dbDownloadStatus === 'completed';
  let downloadEpisodeLabel = 'DOWNLOAD EPISODE';
  if (isDownloaded) {
    downloadEpisodeLabel = 'DOWNLOADED';
  } else if (task?.status === 'downloading') {
    const pct = Math.round((task.progress || 0) * 100);
    downloadEpisodeLabel = pct > 0 ? `DOWNLOADING ${pct}%` : 'DOWNLOADING...';
  } else if (task?.status === 'paused' || dbDownloadStatus === 'paused') {
    downloadEpisodeLabel = 'RESUME DOWNLOAD';
  }

  const onScrubToRatio = useCallback(
    (ratio: number) => {
      if (effectiveDuration <= 0) {
        return;
      }
      seekToPositionSeconds(effectiveDuration * ratio).catch(() => {});
    },
    [effectiveDuration],
  );

  const onDismissError = useCallback(() => {
    setPlaybackError(null);
  }, [setPlaybackError]);

  let liveBadgeLabel = 'STREAM READY';
  if (playbackError) {
    liveBadgeLabel = 'STREAM UNAVAILABLE (OFFLINE)';
  } else if (isBuffering) {
    liveBadgeLabel = 'CONNECTING TO STREAM...';
  } else if (isPlaying) {
    liveBadgeLabel = 'ONLINE • LIVE BROADCAST';
  }

  return {
    activeTrack,
    playbackError,
    isRadio: Boolean(isRadio),
    isBuffering,
    hasTimeline,
    headerTitle: isRadio ? 'Live Radio Stream' : 'Podcast & Queue Player',
    liveBadgeLabel,
    initials: getInitials(activeTrack?.title),
    progressRatio,
    positionSeconds,
    effectiveDuration,
    formattedPosition: formatTime(positionSeconds),
    formattedDuration: formatTime(effectiveDuration),
    isDownloaded,
    downloadEpisodeLabel,
    isStationFavorite,
    volume,
    onToggleDownloadEpisode,
    onToggleFavoriteStation,
    onScrubToRatio,
    onChangeVolume,
    onToggleMute,
    onDismissError,
  };
}

export interface UseTimelineScrubberProps {
  progressRatio: number;
  durationSeconds: number;
  positionSeconds: number;
  formattedPosition: string;
  onScrub: (ratio: number) => void;
}

export interface UseTimelineScrubberResult {
  activePercent: number;
  displayPosition: string;
  isScrubbing: boolean;
  panHandlers: GestureResponderHandlers;
  trackRef: React.RefObject<View>;
  onTrackLayout: (event: LayoutChangeEvent) => void;
}

export function useTimelineScrubber({
  progressRatio,
  durationSeconds,
  positionSeconds,
  formattedPosition,
  onScrub,
}: UseTimelineScrubberProps): UseTimelineScrubberResult {
  const [scrubbingRatio, setScrubbingRatio] = useState<number | null>(null);
  const trackWidthRef = useRef<number>(0);
  const trackPageXRef = useRef<number>(0);
  const trackRef = useRef<View>(null);

  const activeRatio = scrubbingRatio !== null ? scrubbingRatio : progressRatio;
  const clampedRatio = Math.max(0, Math.min(1, activeRatio));
  const activePercent = clampedRatio * 100;

  const currentSeconds =
    scrubbingRatio !== null
      ? Math.round(scrubbingRatio * durationSeconds)
      : positionSeconds;
  const displayPosition =
    scrubbingRatio !== null ? formatTime(currentSeconds) : formattedPosition;

  const updateRatioFromPageX = useCallback((pageX: number) => {
    if (trackWidthRef.current <= 0) {
      return;
    }
    const localX = pageX - trackPageXRef.current;
    const ratio = Math.max(0, Math.min(1, localX / trackWidthRef.current));
    setScrubbingRatio(ratio);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (evt, gestureState) => {
          const touchX = evt.nativeEvent?.pageX ?? gestureState.x0;
          trackRef.current?.measure((_x, _y, width, _height, pageX) => {
            trackWidthRef.current = width;
            trackPageXRef.current = pageX;
            const localX = touchX - pageX;
            const ratio = Math.max(0, Math.min(1, localX / width));
            setScrubbingRatio(ratio);
          });
        },
        onPanResponderMove: (evt, gestureState) => {
          const touchX = evt.nativeEvent?.pageX ?? gestureState.moveX;
          updateRatioFromPageX(touchX);
        },
        onPanResponderRelease: (evt, gestureState) => {
          const touchX =
            evt.nativeEvent?.pageX ?? gestureState.moveX ?? gestureState.x0;
          if (trackWidthRef.current > 0) {
            const localX = touchX - trackPageXRef.current;
            const ratio = Math.max(0, Math.min(1, localX / trackWidthRef.current));
            onScrub(ratio);
          } else if (scrubbingRatio !== null) {
            onScrub(scrubbingRatio);
          }
          setScrubbingRatio(null);
        },
        onPanResponderTerminate: () => {
          setScrubbingRatio(null);
        },
      }),
    [onScrub, scrubbingRatio, updateRatioFromPageX],
  );

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    trackWidthRef.current = event.nativeEvent.layout.width;
  }, []);

  return {
    activePercent,
    displayPosition,
    isScrubbing: scrubbingRatio !== null,
    panHandlers: panResponder.panHandlers,
    trackRef,
    onTrackLayout,
  };
}

export interface UseVolumeSliderProps {
  volume: number;
  onChangeVolume: (volume: number) => void;
  onToggleMute: () => void;
}

export interface UseVolumeSliderResult {
  volumePercent: number;
  isMuted: boolean;
  panHandlers: GestureResponderHandlers;
  trackRef: React.RefObject<View>;
  onTrackLayout: (event: LayoutChangeEvent) => void;
  onMutePress: () => void;
  onMaxVolumePress: () => void;
}

export function useVolumeSlider({
  volume,
  onChangeVolume,
  onToggleMute,
}: UseVolumeSliderProps): UseVolumeSliderResult {
  const trackWidthRef = useRef<number>(0);
  const trackPageXRef = useRef<number>(0);
  const trackRef = useRef<View>(null);

  const clampedVolume = Math.max(0, Math.min(1, volume));
  const volumePercent = clampedVolume * 100;

  const updateVolumeFromPageX = useCallback(
    (pageX: number) => {
      if (trackWidthRef.current <= 0) {
        return;
      }
      const localX = pageX - trackPageXRef.current;
      const vol = Math.max(0, Math.min(1, localX / trackWidthRef.current));
      onChangeVolume(vol);
    },
    [onChangeVolume],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (evt, gestureState) => {
          const touchX = evt.nativeEvent?.pageX ?? gestureState.x0;
          trackRef.current?.measure((_x, _y, width, _height, pageX) => {
            trackWidthRef.current = width;
            trackPageXRef.current = pageX;
            const localX = touchX - pageX;
            const vol = Math.max(0, Math.min(1, localX / width));
            onChangeVolume(vol);
          });
        },
        onPanResponderMove: (evt, gestureState) => {
          const touchX = evt.nativeEvent?.pageX ?? gestureState.moveX;
          updateVolumeFromPageX(touchX);
        },
        onPanResponderRelease: (evt, gestureState) => {
          const touchX =
            evt.nativeEvent?.pageX ?? gestureState.moveX ?? gestureState.x0;
          updateVolumeFromPageX(touchX);
        },
        onPanResponderTerminate: () => {},
      }),
    [onChangeVolume, updateVolumeFromPageX],
  );

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    trackWidthRef.current = event.nativeEvent.layout.width;
  }, []);

  const onMaxVolumePress = useCallback(() => {
    onChangeVolume(1);
  }, [onChangeVolume]);

  return {
    volumePercent,
    isMuted: volume === 0,
    panHandlers: panResponder.panHandlers,
    trackRef,
    onTrackLayout,
    onMutePress: onToggleMute,
    onMaxVolumePress,
  };
}
