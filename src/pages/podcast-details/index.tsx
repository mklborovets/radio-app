import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { subscribeOrRefreshPodcastFeed } from '@features/subscribe-rss';
import {
  deleteEpisodeDownloadedFiles,
  enforceCacheStorageLimitLru,
  pauseEpisodeDownload,
  startOrResumeEpisodeDownload,
  unsubscribeAndDeletePodcastCascade,
  useDownloadManagerStore,
} from '@features/download-episode';
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
import { RootStackParamList } from '@shared/config';
import { formatTime } from '@shared/lib/formatTime';
import { COLORS, ScreenContainer } from '@shared/ui';

export type PodcastDetailsPageProps = NativeStackScreenProps<
  RootStackParamList,
  'PodcastDetails'
>;

const PAGE_SIZE = 25;

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

export function PodcastDetailsPage({
  route,
  navigation,
}: PodcastDetailsPageProps): React.JSX.Element {
  const { podcastId, title } = route.params;

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

  const handlePlayEpisode = useCallback(
    (episode: EpisodeEntity) => {
      if (activeTrack?.id === episode.id) {
        togglePlaybackState().catch(() => {});
        return;
      }

      const playable = mapEpisodeToPlayableTrack(episode, podcast?.title ?? title);
      const resumeSeconds = episode.isCompleted ? 0 : episode.playbackPosition;
      startPlayableTrack(playable, resumeSeconds).catch(() => {});
    },
    [activeTrack, podcast?.title, title],
  );

  const handleAddToQueue = useCallback(
    (episode: EpisodeEntity) => {
      if (queue.some((item) => item.id === episode.id)) {
        return;
      }
      const playable = mapEpisodeToPlayableTrack(episode, podcast?.title ?? title);
      appendTrackToPlaybackQueue(playable).catch(() => {});
    },
    [podcast?.title, queue, title],
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

  const handleUnsubscribe = useCallback(async () => {
    await unsubscribeAndDeletePodcastCascade(podcastId);
    navigation.goBack();
  }, [navigation, podcastId]);

  return (
    <ScreenContainer>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryTopRow}>
          <View style={styles.summaryTitleCol}>
            <Text style={styles.podcastTitle} numberOfLines={2}>
              {podcast?.title ?? title}
            </Text>
            <Text style={styles.episodeCount}>
              {totalCount} episodes • Showing {episodes.length}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.unsubscribeBtn}
            onPress={() => {
              handleUnsubscribe().catch(() => {});
            }}>
            <Text style={styles.unsubscribeBtnText}>UNSUBSCRIBE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={episodes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          loadNextPage().catch(() => {});
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingFeed}
            onRefresh={() => {
              handleRefreshRss().catch(() => {});
            }}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => {
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
            downloadLabel = 'OFFLINE ✓';
          } else if (status === 'failed') {
            downloadLabel = 'RETRY DL';
          }

          return (
            <View style={[styles.episodeCard, isCurrent && styles.episodeCardActive]}>
              <View style={styles.episodeInfo}>
                <Text style={styles.episodeTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.episodeMeta}>
                  {new Date(item.publishedAt).toLocaleDateString()} •{' '}
                  {item.duration > 0 ? formatTime(item.duration) : 'Audio'}
                  {item.playbackPosition > 0 && !item.isCompleted
                    ? ` • Saved at ${formatTime(item.playbackPosition)}`
                    : ''}
                  {item.isCompleted ? ' • Completed' : ''}
                </Text>
              </View>

              <View style={styles.episodeActions}>
                <TouchableOpacity
                  style={[
                    styles.downloadBtn,
                    status === 'completed' && styles.downloadBtnDone,
                  ]}
                  onPress={() => {
                    handleDownloadAction(item).catch(() => {});
                  }}>
                  <Text
                    style={[
                      styles.downloadBtnText,
                      status === 'completed' && styles.downloadBtnTextDone,
                    ]}>
                    {downloadLabel}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.queueBtn, isQueued && styles.queueBtnActive]}
                  onPress={() => handleAddToQueue(item)}>
                  <Text style={styles.queueBtnText}>
                    {isQueued ? 'QUEUED' : '+ QUEUE'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => handlePlayEpisode(item)}>
                  <Text style={styles.playBtnText}>
                    {isCurrent && isPlaying
                      ? 'PAUSE'
                      : item.playbackPosition > 0 && !item.isCompleted
                        ? 'RESUME'
                        : 'PLAY'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryTitleCol: {
    flex: 1,
  },
  podcastTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  episodeCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  unsubscribeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  unsubscribeBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
  },
  episodeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  episodeCardActive: {
    borderColor: COLORS.primary,
  },
  episodeInfo: {
    marginBottom: 12,
  },
  episodeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  episodeMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  episodeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  downloadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
  },
  downloadBtnDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  downloadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  downloadBtnTextDone: {
    color: COLORS.success,
  },
  queueBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
  },
  queueBtnActive: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  queueBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  playBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  playBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.background,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
