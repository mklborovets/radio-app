import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  CacheUsageSummary,
  calculateCacheUsageSummary,
  deleteEpisodeDownloadedFiles,
  enforceCacheStorageLimitLru,
  getDownloadedOrActiveEpisodes,
  pauseEpisodeDownload,
  startOrResumeEpisodeDownload,
  useDownloadManagerStore,
} from '@features/download-episode';
import {
  appendTrackToPlaybackQueue,
  PlayableTrack,
  startPlayableTrack,
  togglePlaybackState,
  usePlayerStore,
} from '@entities/player';
import { EpisodeEntity } from '@entities/episode';
import { MainTabParamList } from '@shared/config';
import { formatTime } from '@shared/lib/formatTime';
import {
  database,
  EpisodeDownloadStatus,
  EpisodeModel,
  TableName,
} from '@shared/db';

export function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function mapOfflineEpisodeToPlayableTrack(
  episode: EpisodeEntity,
): PlayableTrack {
  const uri =
    episode.downloadStatus === 'completed' && episode.localFilePath
      ? `file://${episode.localFilePath}`
      : episode.audioUrl;

  return {
    id: episode.id,
    title: episode.title,
    subtitle: 'Offline Podcast Episode',
    artworkUrl: episode.artworkUrl,
    streamOrFileUrl: uri,
    sourceType: 'episode',
    duration: episode.duration,
    episodeId: episode.id,
    podcastId: episode.podcastId,
  };
}

export interface DownloadItemViewModel {
  episode: EpisodeEntity;
  isCurrent: boolean;
  isPlaying: boolean;
  isQueued: boolean;
  status: EpisodeDownloadStatus;
  statusBadgeText: string;
  progressPercent: number;
  metaText: string;
  queueButtonLabel: string;
  playButtonLabel: string;
}

export interface UseDownloadsPageResult {
  downloadRows: DownloadItemViewModel[];
  usedMegabytesLabel: string;
  limitMegabytesLabel: string;
  offlineReadyCountLabel: string;
  usageWidthPercent: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onRunLruEvict: () => void;
  onPauseDownload: (episodeId: string) => void;
  onResumeDownload: (episodeId: string) => void;
  onPlayOffline: (episode: EpisodeEntity) => void;
  onToggleQueue: (episode: EpisodeEntity) => void;
  onDeleteDownload: (episodeId: string) => void;
  onBrowsePodcasts: () => void;
}

export function useDownloadsPage(): UseDownloadsPageResult {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [episodes, setEpisodes] = useState<EpisodeEntity[]>([]);
  const [cacheSummary, setCacheSummary] = useState<CacheUsageSummary>({
    totalUsedBytes: 0,
    maxLimitBytes: 2 * 1024 * 1024 * 1024,
    downloadedCount: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const downloadTasks = useDownloadManagerStore((state) => state.tasks);
  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const queue = usePlayerStore((state) => state.queue);

  const reloadDownloads = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [items, summary] = await Promise.all([
        getDownloadedOrActiveEpisodes(),
        calculateCacheUsageSummary(),
      ]);
      setEpisodes(items);
      setCacheSummary(summary);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    reloadDownloads().catch(() => {});
  }, [reloadDownloads, downloadTasks]);

  useFocusEffect(
    useCallback(() => {
      reloadDownloads().catch(() => {});
    }, [reloadDownloads]),
  );

  const onRefresh = useCallback(() => {
    reloadDownloads().catch(() => {});
  }, [reloadDownloads]);

  const onRunLruEvict = useCallback(() => {
    enforceCacheStorageLimitLru(cacheSummary.totalUsedBytes * 0.5)
      .then(() => reloadDownloads())
      .catch(() => {});
  }, [cacheSummary.totalUsedBytes, reloadDownloads]);

  const onPauseDownload = useCallback(
    (episodeId: string) => {
      pauseEpisodeDownload(episodeId)
        .then(() => reloadDownloads())
        .catch(() => {});
    },
    [reloadDownloads],
  );

  const onResumeDownload = useCallback(
    (episodeId: string) => {
      startOrResumeEpisodeDownload(episodeId, reloadDownloads).catch(() => {});
    },
    [reloadDownloads],
  );

  const onDeleteDownload = useCallback(
    (episodeId: string) => {
      deleteEpisodeDownloadedFiles(episodeId)
        .then(() => reloadDownloads())
        .catch(() => {});
    },
    [reloadDownloads],
  );

  const onPlayOffline = useCallback(
    async (episode: EpisodeEntity) => {
      if (activeTrack?.id === episode.id) {
        togglePlaybackState().catch(() => {});
        return;
      }
      let resumePos = episode.isCompleted ? 0 : episode.playbackPosition;
      try {
        const record = await database
          .get<EpisodeModel>(TableName.Episodes)
          .find(episode.id);
        if (record && !record.isCompleted && record.playbackPosition > 0) {
          resumePos = record.playbackPosition;
        }
      } catch {}
      const playable = mapOfflineEpisodeToPlayableTrack(episode);
      startPlayableTrack(playable, resumePos).catch(() => {});
    },
    [activeTrack?.id],
  );

  const onToggleQueue = useCallback((episode: EpisodeEntity) => {
    const playable = mapOfflineEpisodeToPlayableTrack(episode);
    appendTrackToPlaybackQueue(playable).catch(() => {});
  }, []);

  const onBrowsePodcasts = useCallback(() => {
    navigation.navigate('PodcastsFeed');
  }, [navigation]);

  const usageRatio =
    cacheSummary.maxLimitBytes > 0
      ? Math.min(1, cacheSummary.totalUsedBytes / cacheSummary.maxLimitBytes)
      : 0;

  const downloadRows = useMemo<DownloadItemViewModel[]>(() => {
    return episodes.map((item) => {
      const liveTask = downloadTasks[item.id];
      const status = liveTask ? liveTask.status : item.downloadStatus;
      const progress = liveTask ? liveTask.progress : item.downloadProgress;
      const bytes = liveTask ? liveTask.downloadedBytes : item.downloadedBytes;
      const isCurrent = activeTrack?.id === item.id;
      const isQueued = queue.some((q) => q.id === item.id);
      const progressPercent = Math.min(100, Math.max(0, Math.round(progress * 100)));

      let statusBadgeText = 'QUEUED';
      if (status === 'completed') {
        statusBadgeText = 'OFFLINE READY';
      } else if (status === 'downloading') {
        statusBadgeText = `DOWNLOADING ${progressPercent}%`;
      } else if (status === 'paused') {
        statusBadgeText = `PAUSED ${progressPercent}%`;
      } else if (status === 'failed') {
        statusBadgeText = 'FAILED';
      }

      const durationText = item.duration > 0 ? formatTime(item.duration) : 'Audio';
      const metaText = `${formatMegabytes(bytes)} • ${durationText}`;

      return {
        episode: item,
        isCurrent,
        isPlaying: isCurrent && isPlaying,
        isQueued,
        status,
        statusBadgeText,
        progressPercent,
        metaText,
        queueButtonLabel: isQueued ? 'QUEUED' : '+ QUEUE',
        playButtonLabel: isCurrent && isPlaying ? 'PAUSE' : 'PLAY OFFLINE',
      };
    });
  }, [activeTrack?.id, downloadTasks, episodes, isPlaying, queue]);

  return {
    downloadRows,
    usedMegabytesLabel: formatMegabytes(cacheSummary.totalUsedBytes),
    limitMegabytesLabel: formatMegabytes(cacheSummary.maxLimitBytes),
    offlineReadyCountLabel: `${cacheSummary.downloadedCount} episodes cached`,
    usageWidthPercent: usageRatio * 100,
    isRefreshing,
    onRefresh,
    onRunLruEvict,
    onPauseDownload,
    onResumeDownload,
    onPlayOffline,
    onToggleQueue,
    onDeleteDownload,
    onBrowsePodcasts,
  };
}
