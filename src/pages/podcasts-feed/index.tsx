import React, { useCallback, useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { subscribeOrRefreshPodcastFeed } from '@features/subscribe-rss';
import { getSubscribedPodcasts, PodcastEntity } from '@entities/podcast';
import { RootStackParamList } from '@shared/config';
import { COLORS, ScreenContainer } from '@shared/ui';

const SAMPLE_FEEDS: readonly { label: string; url: string }[] = [
  {
    label: 'Syntax.fm',
    url: 'https://feed.syntax.fm/rss',
  },
  {
    label: 'Changelog',
    url: 'https://changelog.com/podcast/feed',
  },
];

export function PodcastsFeedPage(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [feedUrlInput, setFeedUrlInput] = useState('');
  const [podcasts, setPodcasts] = useState<PodcastEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadPodcastsFromDb = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getSubscribedPodcasts();
      setPodcasts(list);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPodcastsFromDb().catch(() => {});
  }, [loadPodcastsFromDb]);

  const handleSubscribe = useCallback(
    async (targetUrl?: string) => {
      const urlToUse = (targetUrl ?? feedUrlInput).trim();
      if (!urlToUse) {
        return;
      }

      setIsSubscribing(true);
      setErrorMessage(null);
      setStatusMessage(null);

      try {
        const { podcast, wasModified } = await subscribeOrRefreshPodcastFeed(urlToUse);
        setFeedUrlInput('');
        setStatusMessage(
          wasModified
            ? `Subscribed to "${podcast.title}"`
            : `"${podcast.title}" is already up to date (304 Not Modified)`,
        );
        await loadPodcastsFromDb();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to subscribe to RSS feed';
        setErrorMessage(message);
      } finally {
        setIsSubscribing(false);
      }
    },
    [feedUrlInput, loadPodcastsFromDb],
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Podcasts</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.urlInput}
            value={feedUrlInput}
            onChangeText={setFeedUrlInput}
            placeholder="Paste RSS feed URL (https://...)"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.addButton}
            disabled={isSubscribing}
            onPress={() => {
              handleSubscribe().catch(() => {});
            }}>
            {isSubscribing ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Text style={styles.addButtonText}>ADD RSS</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.presetsRow}>
          {SAMPLE_FEEDS.map((sample) => (
            <TouchableOpacity
              key={sample.url}
              style={styles.presetChip}
              disabled={isSubscribing}
              onPress={() => {
                handleSubscribe(sample.url).catch(() => {});
              }}>
              <Text style={styles.presetChipText}>+ {sample.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {errorMessage && <Text style={styles.errorBanner}>{errorMessage}</Text>}
        {statusMessage && <Text style={styles.statusBanner}>{statusMessage}</Text>}
      </View>

      <FlatList
        data={podcasts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              loadPodcastsFromDb().catch(() => {});
            }}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.podcastCard}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('PodcastDetails', {
                podcastId: item.id,
                title: item.title,
              })
            }>
            <View style={styles.artworkBox}>
              {item.artworkUrl ? (
                <Image
                  source={{ uri: item.artworkUrl }}
                  style={styles.artworkImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.artworkFallback}>
                  <Text style={styles.artworkFallbackText}>
                    {item.title.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.podcastInfo}>
              <Text style={styles.podcastTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.podcastAuthor} numberOfLines={1}>
                {item.author}
              </Text>
              <Text style={styles.podcastDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No podcast subscriptions yet. Enter an RSS URL above to subscribe.
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
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 13,
  },
  addButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    borderRadius: 12,
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
