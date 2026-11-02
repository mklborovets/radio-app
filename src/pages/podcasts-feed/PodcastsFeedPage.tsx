import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, ScreenContainer } from '@shared/ui';
import { usePodcastsFeedPage } from './model';

export function PodcastsFeedPage(): React.JSX.Element {
  const {
    feedUrlInput,
    podcastItems,
    sampleFeeds,
    isLoading,
    isSubscribing,
    errorMessage,
    statusMessage,
    onChangeFeedUrlInput,
    onRefresh,
    onPressSubscribeInput,
    onPressPreset,
    onPressPodcast,
  } = usePodcastsFeedPage();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Podcasts</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.urlInput}
            value={feedUrlInput}
            onChangeText={onChangeFeedUrlInput}
            placeholder="Paste RSS feed URL (https://...)"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.addButton}
            disabled={isSubscribing}
            onPress={onPressSubscribeInput}>
            {isSubscribing ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Text style={styles.addButtonText}>ADD RSS</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.presetsRow}>
          {sampleFeeds.map((sample) => (
            <TouchableOpacity
              key={sample.url}
              style={styles.presetChip}
              disabled={isSubscribing}
              onPress={() => onPressPreset(sample.url)}>
              <Text style={styles.presetChipText}>+ {sample.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {errorMessage && <Text style={styles.errorBanner}>{errorMessage}</Text>}
        {statusMessage && <Text style={styles.statusBanner}>{statusMessage}</Text>}
      </View>

      <FlatList
        data={podcastItems}
        keyExtractor={(item) => item.podcast.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.podcastCard}
            activeOpacity={0.85}
            onPress={() => onPressPodcast(item.podcast)}>
            <View style={styles.artworkBox}>
              {Boolean(item.podcast.artworkUrl) &&
              item.podcast.artworkUrl !== 'null' &&
              item.podcast.artworkUrl !== 'undefined' &&
              (item.podcast.artworkUrl.startsWith('http://') ||
                item.podcast.artworkUrl.startsWith('https://') ||
                item.podcast.artworkUrl.startsWith('file://')) ? (
                <Image
                  source={{ uri: item.podcast.artworkUrl }}
                  style={styles.artworkImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.artworkFallback}>
                  <Text style={styles.artworkFallbackText}>{item.initials}</Text>
                </View>
              )}
            </View>
            <View style={styles.podcastInfo}>
              <Text style={styles.podcastTitle} numberOfLines={1}>
                {item.podcast.title}
              </Text>
              <Text style={styles.podcastAuthor} numberOfLines={1}>
                {item.podcast.author}
              </Text>
              <Text style={styles.podcastDescription} numberOfLines={2}>
                {item.podcast.description}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No podcast subscriptions yet. Enter an RSS URL above or tap a quick
              preset to subscribe.
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
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 13,
  },
  addButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.background,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  errorBanner: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.accent,
  },
  statusBanner: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.success,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  podcastCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  artworkBox: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceElevated,
    marginRight: 12,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkFallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  podcastInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  podcastTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  podcastAuthor: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  podcastDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
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

