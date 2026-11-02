import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteEpisodeDownloadedFiles,
  enforceCacheStorageLimitLru,
  pauseEpisodeDownload,
  startOrResumeEpisodeDownload,
  unsubscribeAndDeletePodcastCascade,
  useDownloadManagerStore,
} from '@features/download-episode';
import { subscribeOrRefreshPodcastFeed } from '@features/subscribe-rss';
import {
  appendTrackToPlaybackQueue,
  PlayableTrack,
  startPlayableTrack,
  togglePlaybackState,
  usePlayerStore,
} from '@entities/player';
import { getPodcastById, PodcastEntity } from '@entities/podcast';
import {
  countEpisodesForPodcast,
  EpisodeEntity,
  queryPaginatedEpisodesForPodcast,
} from '@entities/episode';
import { formatTime } from '@shared/lib/formatTime';
import { database, EpisodeModel, TableName } from '@shared/db';

const PAGE_SIZE = 5;

export function mapEpisodeToPlayableTrack(
  episode: EpisodeEntity,
  podcastTitle: string,
): PlayableTrack {
  const playbackUri =
    episode.downloadStatus === 'completed' && episode.localFilePath
      ? `file://${episode.localFilePath}`
      : episode.audioUrl;

  return {
    id: episode.id,
    title: episode.title,
    subtitle: podcastTitle,
    artworkUrl: episode.artworkUrl,
    streamOrFileUrl: playbackUri,
    sourceType: 'episode',
    duration: episode.duration,
    episodeId: episode.id,
    podcastId: episode.podcastId,
  };
}

export interface EpisodeRowViewModel {
  episode: EpisodeEntity;
  isCurrent: boolean;
  isQueued: boolean;
  isCompletedDownload: boolean;
  metaText: string;
  downloadLabel: string;
  queueLabel: string;
  playLabel: string;
}

export interface UsePodcastDetailsPageResult {
  headerTitle: string;
  summarySubtitle: string;
  episodeRows: EpisodeRowViewModel[];
  isLoadingMore: boolean;
  isRefreshingFeed: boolean;
  onRefreshRss: () => void;
  onLoadNextPage: () => void;
  onUnsubscribe: () => void;
  onDownloadAction: (episode: EpisodeEntity) => void;
  onAddToQueue: (episode: EpisodeEntity) => void;
  onPlayEpisode: (episode: EpisodeEntity) => void;
  onOpenEpisodeDetails: (episode: EpisodeEntity) => void;
}

export function usePodcastDetailsPage(
  podcastId: string,
  fallbackTitle: string,
  onNavigateBack: () => void,
  onNavigateToPlayer?: () => void,
): UsePodcastDetailsPageResult {
  const [podcast, setPodcast] = useState<PodcastEntity | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeEntity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);

  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const queue = usePlayerStore((state) => state.queue);
  const downloadTasks = useDownloadManagerStore((state) => state.tasks);

  const loadInitialPage = useCallback(async () => {
    setIsLoadingInitial(true);
    try {
      const [podcastData, total, firstPage] = await Promise.all([
        getPodcastById(podcastId),
        countEpisodesForPodcast(podcastId),
        queryPaginatedEpisodesForPodcast(podcastId, 0, PAGE_SIZE),
      ]);
      setPodcast(podcastData);
      setTotalCount(total);
      setEpisodes(firstPage);
    } finally {
      setIsLoadingInitial(false);
    }
  }, [podcastId]);

  useEffect(() => {
    loadInitialPage().catch(() => {});
  }, [loadInitialPage]);

  const loadNextPage = useCallback(async () => {
    if (isLoadingMore || isLoadingInitial || episodes.length >= totalCount) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const nextSlice = await queryPaginatedEpisodesForPodcast(
        podcastId,
        episodes.length,
        PAGE_SIZE,
      );
      if (nextSlice.length > 0) {
        setEpisodes((prev) => [...prev, ...nextSlice]);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [episodes.length, isLoadingInitial, isLoadingMore, podcastId, totalCount]);

  const handleRefreshRss = useCallback(async () => {
    if (!podcast) {
      return;
    }

    setIsRefreshingFeed(true);
    try {
      await subscribeOrRefreshPodcastFeed(podcast.feedUrl);
      await loadInitialPage();
    } catch {
      await loadInitialPage();
    } finally {
      setIsRefreshingFeed(false);
    }
  }, [loadInitialPage, podcast]);

  const onPlayEpisode = useCallback(
    async (episode: EpisodeEntity) => {
      if (activeTrack?.id === episode.id) {
        togglePlaybackState().catch(() => {});
        return;
      }

      let resumeSeconds = episode.isCompleted ? 0 : episode.playbackPosition;
      try {
        const record = await database
          .get<EpisodeModel>(TableName.Episodes)
          .find(episode.id);
        if (record && !record.isCompleted && record.playbackPosition > 0) {
          resumeSeconds = record.playbackPosition;
        }
      } catch {}

      const playable = mapEpisodeToPlayableTrack(
        episode,
        podcast?.title ?? fallbackTitle,
      );
      startPlayableTrack(playable, resumeSeconds).catch(() => {});
    },
    [activeTrack, fallbackTitle, podcast?.title],
  );

  const onAddToQueue = useCallback(
    (episode: EpisodeEntity) => {
      const playable = mapEpisodeToPlayableTrack(
        episode,
        podcast?.title ?? fallbackTitle,
      );
      appendTrackToPlaybackQueue(playable).catch(() => {});
    },
    [fallbackTitle, podcast?.title],
  );

  const handleDownloadAction = useCallback(
    async (episode: EpisodeEntity) => {
      const liveTask = downloadTasks[episode.id];
      const currentStatus = liveTask ? liveTask.status : episode.downloadStatus;

      if (currentStatus === 'downloading') {
        await pauseEpisodeDownload(episode.id);
        await loadInitialPage();
        return;
      }

      if (currentStatus === 'completed') {
        await deleteEpisodeDownloadedFiles(episode.id);
        await loadInitialPage();
        return;
      }

      await startOrResumeEpisodeDownload(episode.id, async () => {
        await enforceCacheStorageLimitLru(undefined, episode.id);
        await loadInitialPage();
      });
    },
    [downloadTasks, loadInitialPage],
  );

  const onDownloadAction = useCallback(
    (episode: EpisodeEntity) => {
      handleDownloadAction(episode).catch(() => {});
    },
    [handleDownloadAction],
  );

  const onUnsubscribe = useCallback(() => {
    unsubscribeAndDeletePodcastCascade(podcastId)
      .then(() => {
        onNavigateBack();
      })
      .catch(() => {});
  }, [onNavigateBack, podcastId]);

  const onRefreshRss = useCallback(() => {
    handleRefreshRss().catch(() => {});
  }, [handleRefreshRss]);

  const onLoadNextPage = useCallback(() => {
    loadNextPage().catch(() => {});
  }, [loadNextPage]);

  const episodeRows = useMemo<EpisodeRowViewModel[]>(() => {
    return episodes.map((item) => {
      const isCurrent = activeTrack?.id === item.id;
      const isQueued = queue.some((q) => q.id === item.id);
      const liveTask = downloadTasks[item.id];
      const status = liveTask ? liveTask.status : item.downloadStatus;
      const progress = liveTask ? liveTask.progress : item.downloadProgress;

      let downloadLabel = 'DOWNLOAD';
      if (status === 'downloading') {
        downloadLabel = `PAUSE ${Math.round(progress * 100)}%`;
      } else if (status === 'paused') {
        downloadLabel = `RESUME ${Math.round(progress * 100)}%`;
      } else if (status === 'completed') {
        downloadLabel = 'OFFLINE';
      } else if (status === 'failed') {
        downloadLabel = 'RETRY DL';
      }

      const publishedLabel = new Date(item.publishedAt).toLocaleDateString();
      const durationLabel = item.duration > 0 ? formatTime(item.duration) : 'Audio';
      const savedSuffix =
        item.playbackPosition > 0 && !item.isCompleted
          ? ` • Saved at ${formatTime(item.playbackPosition)}`
          : '';
      const completedSuffix = item.isCompleted ? ' • Completed' : '';
      const metaText = `${publishedLabel} • ${durationLabel}${savedSuffix}${completedSuffix}`;

      const playLabel =
        isCurrent && isPlaying
          ? 'PAUSE'
          : item.playbackPosition > 0 && !item.isCompleted
            ? 'RESUME'
            : 'PLAY';

      return {
        episode: item,
        isCurrent,
        isQueued,
        isCompletedDownload: status === 'completed',
        metaText,
        downloadLabel,
        queueLabel: isQueued ? 'QUEUED' : '+ QUEUE',
        playLabel,
      };
    });
  }, [activeTrack?.id, downloadTasks, episodes, isPlaying, queue]);

  const onOpenEpisodeDetails = useCallback(
    async (episode: EpisodeEntity) => {
      if (activeTrack?.id !== episode.id) {
        await onPlayEpisode(episode);
      }
      onNavigateToPlayer?.();
    },
    [activeTrack?.id, onPlayEpisode, onNavigateToPlayer],
  );

  return {
    headerTitle: podcast?.title ?? fallbackTitle,
    summarySubtitle: `${totalCount} episodes • Showing ${episodes.length}`,
    episodeRows,
    isLoadingMore,
    isRefreshingFeed,
    onRefreshRss,
    onLoadNextPage,
    onUnsubscribe,
    onDownloadAction,
    onAddToQueue,
    onPlayEpisode,
    onOpenEpisodeDetails,
  };
}
