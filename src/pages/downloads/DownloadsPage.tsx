import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, ScreenContainer } from '@shared/ui';
import { useDownloadsPage } from './model';

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
          <View style={styles.storageTrack}>
            <View
              style={[styles.storageFill, { width: `${usageWidthPercent}%` }]}
            />
          </View>
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
        renderItem={({ item }) => (
          <View style={[styles.card, item.isCurrent && styles.cardActive]}>
            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'completed' && styles.statusBadgeCompleted,
                  item.status === 'downloading' && styles.statusBadgeDownloading,
                  item.status === 'failed' && styles.statusBadgeFailed,
                ]}>
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.status === 'completed' && styles.statusBadgeTextCompleted,
                    item.status === 'downloading' && styles.statusBadgeTextDownloading,
                    item.status === 'failed' && styles.statusBadgeTextFailed,
                  ]}>
                  {item.statusBadgeText}
                </Text>
              </View>
              <Text style={styles.metaText}>{item.metaText}</Text>
            </View>

            <Text style={styles.episodeTitle} numberOfLines={2}>
              {item.episode.title}
            </Text>

            {item.status !== 'completed' && (
              <View style={styles.itemProgressTrack}>
                <View
                  style={[
                    styles.itemProgressFill,
                    { width: `${item.progressPercent}%` },
                  ]}
                />
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.queueBtn, item.isQueued && styles.queueBtnActive]}
                onPress={() => onToggleQueue(item.episode)}>
                <Text
                  style={[
                    styles.queueBtnText,
                    item.isQueued && styles.queueBtnTextActive,
                  ]}>
                  {item.queueButtonLabel}
                </Text>
              </TouchableOpacity>

              {item.status === 'downloading' && (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => onPauseDownload(item.episode.id)}>
                  <Text style={styles.secondaryBtnText}>PAUSE</Text>
                </TouchableOpacity>
              )}

              {(item.status === 'paused' || item.status === 'failed') && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => onResumeDownload(item.episode.id)}>
                  <Text style={styles.primaryBtnText}>RESUME (RANGE)</Text>
                </TouchableOpacity>
              )}

              {item.status === 'completed' && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => onPlayOffline(item.episode)}>
                  <Text style={styles.primaryBtnText}>{item.playButtonLabel}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => onDeleteDownload(item.episode.id)}>
                <Text style={styles.deleteBtnText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIconText}>↓</Text>
            </View>
            <Text style={styles.emptyTitle}>No Offline Episodes Yet</Text>
            <Text style={styles.emptyText}>
              Subscribe to a podcast and tap DOWNLOAD on any episode to cache it for
              offline listening with HTTP Range resume support.
            </Text>
            <TouchableOpacity
              style={styles.browsePodcastsBtn}
              onPress={onBrowsePodcasts}>
              <Text style={styles.browsePodcastsBtnText}>BROWSE PODCASTS</Text>
            </TouchableOpacity>
          </View>
        }
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
  storageTrack: {
    height: 7,
    borderRadius: 4,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  statusBadgeDownloading: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  statusBadgeFailed: {
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusBadgeTextCompleted: {
    color: COLORS.success,
  },
  statusBadgeTextDownloading: {
    color: COLORS.primary,
  },
  statusBadgeTextFailed: {
    color: COLORS.accent,
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
  itemProgressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceElevated,
    overflow: 'hidden',
    marginTop: 10,
  },
  itemProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  queueBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  queueBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  queueBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  queueBtnTextActive: {
    color: COLORS.primary,
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
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
    borderRadius: 8,
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
    borderRadius: 8,
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
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  browsePodcastsBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  browsePodcastsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.background,
  },
});

