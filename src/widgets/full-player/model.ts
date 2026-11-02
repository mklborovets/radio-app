import { useCallback, useEffect, useState } from 'react';
import {
  PlayableTrack,
  seekToPositionSeconds,
  usePlayerStore,
} from '@entities/player';
import {
  enforceCacheStorageLimitLru,
  pauseEpisodeDownload,
  startOrResumeEpisodeDownload,
  useDownloadManagerStore,
} from '@features/download-episode';
import { database, TableName } from '@shared/db';
import { EpisodeDownloadStatus, EpisodeModel } from '@shared/db/models/EpisodeModel';
import { formatTime } from '@shared/lib/formatTime';

export const SCRUB_PERCENTAGES: readonly number[] = [0, 0.25, 0.5, 0.75, 0.95];

export interface ScrubOptionViewModel {
  ratio: number;
  label: string;
}

export interface UseFullPlayerResult {
  activeTrack: PlayableTrack | null;
  playbackError: string | null;
  isRadio: boolean;
  isBuffering: boolean;
  hasTimeline: boolean;
  headerTitle: string;
  liveBadgeLabel: string;
  initials: string;
  progressWidthPercent: number;
  formattedPosition: string;
  formattedDuration: string;
  scrubOptions: ScrubOptionViewModel[];
  isDownloaded: boolean;
  downloadEpisodeLabel: string;
  onToggleDownloadEpisode: () => void;
  onScrubToRatio: (ratio: number) => void;
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

  const scrubOptions: ScrubOptionViewModel[] = SCRUB_PERCENTAGES.map((ratio) => ({
    ratio,
    label: `${Math.round(ratio * 100)}%`,
  }));

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
    initials: activeTrack ? activeTrack.title.slice(0, 2).toUpperCase() : '',
    progressWidthPercent: progressRatio * 100,
    formattedPosition: formatTime(positionSeconds),
    formattedDuration: formatTime(effectiveDuration),
    scrubOptions,
    isDownloaded,
    downloadEpisodeLabel,
    onToggleDownloadEpisode,
    onScrubToRatio,
    onDismissError,
  };
}
