import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { startPlayableTrack, usePlayerStore } from '@entities/player';
import { EpisodeEntity } from '@entities/episode';
import { formatTime } from '@shared/lib/formatTime';
import { COLORS, ScreenContainer } from '@shared/ui';

function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function DownloadsPage(): React.JSX.Element {
  const [episodes, setEpisodes] = useState<EpisodeEntity[]>([]);
  const [cacheSummary, setCacheSummary] = useState<CacheUsageSummary>({
    totalUsedBytes: 0,
    maxLimitBytes: 2 * 1024 * 1024 * 1024,
    downloadedCount: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const downloadTasks = useDownloadManagerStore((state) => state.tasks);
  const activeTrack = usePlayerStore((state) => state.activeTrack);

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

  const handlePlayOfflineEpisode = useCallback((episode: EpisodeEntity) => {
    const uri =
      episode.downloadStatus === 'completed' && episode.localFilePath
        ? `file://${episode.localFilePath}`
        : episode.audioUrl;

    startPlayableTrack(
      {
        id: episode.id,
        title: episode.title,
        subtitle: 'Offline Episode',
        artworkUrl: episode.artworkUrl,
        streamOrFileUrl: uri,
        sourceType: 'episode',
        duration: episode.duration,
        episodeId: episode.id,
        podcastId: episode.podcastId,
      },
      episode.isCompleted ? 0 : episode.playbackPosition,
    ).catch(() => {});
  }, []);

  const usageRatio =
    cacheSummary.maxLimitBytes > 0
      ? Math.min(1, cacheSummary.totalUsedBytes / cacheSummary.maxLimitBytes)
      : 0;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Offline Downloads</Text>
        <View style={styles.storageCard}>
          <View style={styles.storageRow}>
            <Text style={styles.storageText}>
              Used: {formatMegabytes(cacheSummary.totalUsedBytes)} /{' '}
              {formatMegabytes(cacheSummary.maxLimitBytes)}
            </Text>
            <TouchableOpacity
              style={styles.evictButton}
              onPress={() => {
                enforceCacheStorageLimitLru(cacheSummary.totalUsedBytes * 0.5)
                  .then(() => reloadDownloads())
                  .catch(() => {});
              }}>
              <Text style={styles.evictButtonText}>RUN LRU EVICT</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.storageTrack}>
            <View
              style={[styles.storageFill, { width: `${usageRatio * 100}%` }]}
            />
          </View>
        </View>
      </View>

      <FlatList
        data={episodes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              reloadDownloads().catch(() => {});
            }}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => {
          const liveTask = downloadTasks[item.id];
          const status = liveTask ? liveTask.status : item.downloadStatus;
          const progress = liveTask ? liveTask.progress : item.downloadProgress;
          const bytes = liveTask ? liveTask.downloadedBytes : item.downloadedBytes;
          const isCurrent = activeTrack?.id === item.id;

          return (
            <View style={[styles.card, isCurrent && styles.cardActive]}>
              <Text style={styles.episodeTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.metaText}>
                Status: {status.toUpperCase()} • {Math.round(progress * 100)}% (
                {formatMegabytes(bytes)}) • {formatTime(item.duration)}
              </Text>

              <View style={styles.actionsRow}>
                {status === 'downloading' && (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => {
                      pauseEpisodeDownload(item.id)
                        .then(() => reloadDownloads())
                        .catch(() => {});
                    }}>
                    <Text style={styles.secondaryBtnText}>PAUSE</Text>
                  </TouchableOpacity>
                )}

                {(status === 'paused' || status === 'failed') && (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => {
                      startOrResumeEpisodeDownload(item.id, reloadDownloads).catch(
                        () => {},
                      );
                    }}>
                    <Text style={styles.primaryBtnText}>RESUME (RANGE)</Text>
                  </TouchableOpacity>
                )}

                {status === 'completed' && (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => handlePlayOfflineEpisode(item)}>
                    <Text style={styles.primaryBtnText}>PLAY OFFLINE</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    deleteEpisodeDownloadedFiles(item.id)
                      .then(() => reloadDownloads())
                      .catch(() => {});
                  }}>
                  <Text style={styles.deleteBtnText}>DELETE</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No offline downloads yet. Download episodes from any podcast screen to
              listen in Airplane Mode.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  storageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storageText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  evictButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
  },
  evictButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  storageTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceElevated,
    overflow: 'hidden',
  },
  storageFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardActive: {
    borderColor: COLORS.primary,
  },
  episodeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.background,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
  },
  secondaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
