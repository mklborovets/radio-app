import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActionMenuModal,
  ActionMenuOption,
  Badge,
  BadgeVariant,
  COLORS,
  EmptyState,
  MoreOptionsButton,
  PlayPauseButton,
  ProgressBar,
  ScreenContainer,
} from '@shared/ui';
import { DownloadItemViewModel, useDownloadsPage } from './model';

export function DownloadsPage(): React.JSX.Element {
  const {
    downloadRows,
    usedMegabytesLabel,
    limitMegabytesLabel,
    offlineReadyCountLabel,
    usageWidthPercent,
    isRefreshing,
    onRefresh,
    onRunLruEvict,
    onPauseDownload,
    onResumeDownload,
    onPlayOffline,
    onToggleQueue,
    onDeleteDownload,
    onBrowsePodcasts,
  } = useDownloadsPage();

  const [activeMenuDownload, setActiveMenuDownload] = useState<DownloadItemViewModel | null>(null);

  const getMenuOptions = (item: DownloadItemViewModel): ActionMenuOption[] => {
    const options: ActionMenuOption[] = [
      {
        label: item.isQueued ? 'REMOVE FROM QUEUE' : 'ADD TO QUEUE',
        isActive: item.isQueued,
        onPress: () => onToggleQueue(item.episode),
      },
    ];

    if (item.status === 'downloading') {
      options.push({
        label: 'PAUSE DOWNLOAD',
        onPress: () => onPauseDownload(item.episode.id),
      });
    } else if (item.status === 'paused' || item.status === 'failed') {
      options.push({
        label: 'RESUME DOWNLOAD',
        onPress: () => onResumeDownload(item.episode.id),
      });
    }

    options.push({
      label: 'DELETE DOWNLOAD',
      isDestructive: true,
      onPress: () => onDeleteDownload(item.episode.id),
    });

    return options;
  };

  const getBadgeVariant = (status: DownloadItemViewModel['status']): BadgeVariant => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'downloading':
        return 'primary';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Offline Downloads</Text>
            <Text style={styles.subtitle}>{offlineReadyCountLabel}</Text>
          </View>
          <TouchableOpacity
            style={styles.evictButton}
            onPress={onRunLruEvict}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.evictButtonText}>CLEAR CACHE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.storageCard}>
          <View style={styles.storageStatsRow}>
            <View>
              <Text style={styles.storageStatLabel}>CACHE USED</Text>
              <Text style={styles.storageStatValue}>{usedMegabytesLabel}</Text>
            </View>
            <View style={styles.storageStatRight}>
              <Text style={styles.storageStatLabel}>STORAGE LIMIT</Text>
              <Text style={styles.storageStatValue}>{limitMegabytesLabel}</Text>
            </View>
          </View>
          <ProgressBar
            progress={usageWidthPercent}
            height={7}
            borderRadius={4}
            style={styles.storageProgressBar}
          />
        </View>
      </View>

      <FlatList
        data={downloadRows}
        keyExtractor={(item) => item.episode.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => {
          const isItemActivePlaying =
            item.isCurrent && item.playButtonLabel === 'PAUSE';
          const isItemDownloading = item.status === 'downloading';

          return (
            <View style={[styles.card, item.isCurrent && styles.cardActive]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderInfo}>
                  <View style={styles.cardTopRow}>
                    <Badge
                      text={item.statusBadgeText}
                      variant={getBadgeVariant(item.status)}
                    />
                    <Text style={styles.metaText}>{item.metaText}</Text>
                  </View>

                  <Text style={styles.episodeTitle} numberOfLines={2}>
                    {item.episode.title}
                  </Text>
                </View>

                <View style={styles.actionsCluster}>
                  <PlayPauseButton
                    isPlaying={isItemDownloading || isItemActivePlaying}
                    variant={isItemActivePlaying ? 'active' : 'default'}
                    onPress={() => {
                      if (item.status === 'downloading') {
                        onPauseDownload(item.episode.id);
                      } else if (item.status === 'paused' || item.status === 'failed') {
                        onResumeDownload(item.episode.id);
                      } else {
                        onPlayOffline(item.episode);
                      }
                    }}
                  />

                  <MoreOptionsButton
                    onPress={() => setActiveMenuDownload(item)}
                  />
                </View>
              </View>

              {item.status !== 'completed' && (
                <ProgressBar
                  progress={item.progressPercent}
                  height={5}
                  borderRadius={3}
                  style={styles.itemProgressBar}
                />
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            iconText="↓"
            title="No Offline Episodes Yet"
            message="Subscribe to a podcast and tap DOWNLOAD on any episode to cache it for offline listening with HTTP Range resume support."
            actionLabel="BROWSE PODCASTS"
            onAction={onBrowsePodcasts}
          />
        }
      />

      <ActionMenuModal
        visible={Boolean(activeMenuDownload)}
        title={activeMenuDownload?.episode.title}
        onClose={() => setActiveMenuDownload(null)}
        closeLabel="CANCEL"
        options={activeMenuDownload ? getMenuOptions(activeMenuDownload) : []}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  evictButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  evictButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  storageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storageStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  storageStatRight: {
    alignItems: 'flex-end',
  },
  storageStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  storageStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  storageProgressBar: {
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#162338',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  episodeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  itemProgressBar: {
    marginTop: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderInfo: {
    flex: 1,
    marginRight: 12,
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
