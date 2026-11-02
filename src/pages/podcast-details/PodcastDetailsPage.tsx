import React, { useState } from 'react';
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
import { RootStackParamList } from '@shared/config';
import {
  ActionMenuModal,
  COLORS,
  MoreOptionsButton,
  PlayPauseButton,
  ScreenContainer,
} from '@shared/ui';
import { EpisodeRowViewModel, usePodcastDetailsPage } from './model';

export type PodcastDetailsPageProps = NativeStackScreenProps<
  RootStackParamList,
  'PodcastDetails'
>;

export function PodcastDetailsPage({
  route,
  navigation,
}: PodcastDetailsPageProps): React.JSX.Element {
  const {
    headerTitle,
    summarySubtitle,
    episodeRows,
    totalCount,
    isLoadingMore,
    isRefreshingFeed,
    onRefreshRss,
    onLoadNextPage,
    onUnsubscribe,
    onDownloadAction,
    onAddToQueue,
    onPlayEpisode,
    onOpenEpisodeDetails,
  } = usePodcastDetailsPage(
    route.params.podcastId,
    route.params.title,
    navigation.goBack,
    () => navigation.navigate('PlayerModal'),
  );

  const [activeMenuEpisode, setActiveMenuEpisode] = useState<EpisodeRowViewModel | null>(null);

  const downloadOptionLabel = activeMenuEpisode
    ? activeMenuEpisode.downloadLabel.startsWith('PAUSE')
      ? 'PAUSE DOWNLOAD'
      : activeMenuEpisode.downloadLabel.startsWith('RESUME')
      ? 'RESUME DOWNLOAD'
      : activeMenuEpisode.isCompletedDownload
      ? 'DELETE DOWNLOADED FILE'
      : 'DOWNLOAD EPISODE'
    : '';

  return (
    <ScreenContainer includeTopInset={false} includeBottomInset>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryTopRow}>
          <View style={styles.summaryTitleCol}>
            <Text style={styles.podcastTitle} numberOfLines={2}>
              {headerTitle}
            </Text>
            <Text style={styles.episodeCount}>{summarySubtitle}</Text>
          </View>
          <TouchableOpacity style={styles.unsubscribeBtn} onPress={onUnsubscribe}>
            <Text style={styles.unsubscribeBtnText}>UNSUBSCRIBE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={episodeRows}
        keyExtractor={(item) => item.episode.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onEndReached={onLoadNextPage}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingFeed}
            onRefresh={onRefreshRss}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.episodeCard, item.isCurrent && styles.episodeCardActive]}>
            <View style={styles.episodeCardRow}>
              <TouchableOpacity
                style={styles.episodeInfo}
                activeOpacity={0.7}
                onPress={() => onOpenEpisodeDetails(item.episode)}>
                <Text style={styles.episodeTitle} numberOfLines={2}>
                  {item.episode.title}
                </Text>
                <Text style={styles.episodeMeta}>{item.metaText}</Text>
              </TouchableOpacity>

              <View style={styles.actionsCluster}>
                <PlayPauseButton
                  isPlaying={item.isCurrent && item.playLabel === 'PAUSE'}
                  variant={item.isCurrent ? 'active' : 'default'}
                  onPress={() => onPlayEpisode(item.episode)}
                />

                <MoreOptionsButton
                  onPress={() => setActiveMenuEpisode(item)}
                />
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : episodeRows.length < totalCount ? (
            <View style={styles.loadMoreContainer}>
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={onLoadNextPage}
                activeOpacity={0.7}>
                <Text style={styles.loadMoreButtonText}>
                  LOAD MORE ({episodeRows.length} OF {totalCount})
                </Text>
              </TouchableOpacity>
            </View>
          ) : episodeRows.length > 0 ? (
            <View style={styles.endOfListContainer}>
              <Text style={styles.endOfListText}>
                All {totalCount} episodes loaded
              </Text>
            </View>
          ) : null
        }
      />

      <ActionMenuModal
        visible={Boolean(activeMenuEpisode)}
        title={activeMenuEpisode?.episode.title}
        onClose={() => setActiveMenuEpisode(null)}
        closeLabel="CANCEL"
        options={
          activeMenuEpisode
            ? [
                {
                  label: activeMenuEpisode.isQueued
                    ? 'REMOVE FROM QUEUE'
                    : 'ADD TO QUEUE',
                  isActive: activeMenuEpisode.isQueued,
                  onPress: () => {
                    const ep = activeMenuEpisode.episode;
                    onAddToQueue(ep);
                  },
                },
                {
                  label: downloadOptionLabel,
                  isDone: activeMenuEpisode.isCompletedDownload,
                  onPress: () => {
                    const ep = activeMenuEpisode.episode;
                    onDownloadAction(ep);
                  },
                },
              ]
            : []
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
    marginTop: 2,
  },
  unsubscribeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  unsubscribeBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
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
    backgroundColor: '#162338',
  },
  episodeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  episodeMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadMoreButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  endOfListContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
