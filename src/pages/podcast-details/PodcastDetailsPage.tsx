import React from 'react';
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
import { COLORS, ScreenContainer } from '@shared/ui';
import { usePodcastDetailsPage } from './model';

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
    isLoadingMore,
    isRefreshingFeed,
    onRefreshRss,
    onLoadNextPage,
    onUnsubscribe,
    onDownloadAction,
    onAddToQueue,
    onPlayEpisode,
  } = usePodcastDetailsPage(
    route.params.podcastId,
    route.params.title,
    navigation.goBack,
  );

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
        contentContainerStyle={styles.listContent}
        onEndReached={onLoadNextPage}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingFeed}
            onRefresh={onRefreshRss}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.episodeCard, item.isCurrent && styles.episodeCardActive]}>
            <View style={styles.episodeInfo}>
              <Text style={styles.episodeTitle} numberOfLines={2}>
                {item.episode.title}
              </Text>
              <Text style={styles.episodeMeta}>{item.metaText}</Text>
            </View>

            <View style={styles.episodeActions}>
              <TouchableOpacity
                style={[
                  styles.downloadBtn,
                  item.isCompletedDownload && styles.downloadBtnDone,
                ]}
                onPress={() => onDownloadAction(item.episode)}>
                <Text
                  style={[
                    styles.downloadBtnText,
                    item.isCompletedDownload && styles.downloadBtnTextDone,
                  ]}>
                  {item.downloadLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.queueBtn, item.isQueued && styles.queueBtnActive]}
                onPress={() => onAddToQueue(item.episode)}>
                <Text
                  style={[
                    styles.queueBtnText,
                    item.isQueued && styles.queueBtnTextActive,
                  ]}>
                  {item.queueLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => onPlayEpisode(item.episode)}>
                <Text style={styles.playBtnText}>{item.playLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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

