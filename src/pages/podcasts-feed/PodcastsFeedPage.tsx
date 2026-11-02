import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Artwork,
  Banner,
  COLORS,
  EmptyState,
  ScreenContainer,
} from '@shared/ui';
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

        {errorMessage && (
          <Banner
            message={errorMessage}
            variant="error"
            style={styles.banner}
          />
        )}
        {statusMessage && (
          <Banner
            message={statusMessage}
            variant="success"
            style={styles.banner}
          />
        )}
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
            <Artwork
              uri={item.podcast.artworkUrl}
              fallbackText={item.initials}
              size={64}
              borderRadius={10}
              style={styles.artworkBox}
            />
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
          <EmptyState
            message="No podcast subscriptions yet. Enter an RSS URL above or tap a quick preset to subscribe."
          />
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
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.background,
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  banner: {
    marginTop: 10,
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
    marginRight: 12,
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
});
