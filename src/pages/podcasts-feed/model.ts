import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { subscribeOrRefreshPodcastFeed } from '@features/subscribe-rss';
import {
  getSubscribedPodcasts,
  mapPodcastModelToEntity,
  PodcastEntity,
} from '@entities/podcast';
import { database, PodcastModel, TableName } from '@shared/db';
import { getInitials } from '@shared/lib';
import { RootStackParamList } from '@shared/config';

export interface SampleFeedPreset {
  label: string;
  url: string;
}

export const SAMPLE_FEEDS: readonly SampleFeedPreset[] = [
  {
    label: 'Syntax.fm',
    url: 'https://feed.syntax.fm/rss',
  },
  {
    label: 'Changelog',
    url: 'https://changelog.com/podcast/feed',
  },
];

export interface PodcastCardItemViewModel {
  podcast: PodcastEntity;
  initials: string;
}

export interface UsePodcastsFeedPageResult {
  feedUrlInput: string;
  podcastItems: PodcastCardItemViewModel[];
  sampleFeeds: readonly SampleFeedPreset[];
  isLoading: boolean;
  isSubscribing: boolean;
  errorMessage: string | null;
  statusMessage: string | null;
  onChangeFeedUrlInput: (text: string) => void;
  onRefresh: () => void;
  onPressSubscribeInput: () => void;
  onPressPreset: (presetUrl: string) => void;
  onPressPodcast: (podcast: PodcastEntity) => void;
}

export function usePodcastsFeedPage(): UsePodcastsFeedPageResult {
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

    const collection = database.get<PodcastModel>(TableName.Podcasts);
    const subscription = collection.query().observe().subscribe((records) => {
      setPodcasts(records.map(mapPodcastModelToEntity));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadPodcastsFromDb]);

  useFocusEffect(
    useCallback(() => {
      loadPodcastsFromDb().catch(() => {});
    }, [loadPodcastsFromDb]),
  );

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

  const onRefresh = useCallback(() => {
    loadPodcastsFromDb().catch(() => {});
  }, [loadPodcastsFromDb]);

  const onPressSubscribeInput = useCallback(() => {
    handleSubscribe().catch(() => {});
  }, [handleSubscribe]);

  const onPressPreset = useCallback(
    (presetUrl: string) => {
      handleSubscribe(presetUrl).catch(() => {});
    },
    [handleSubscribe],
  );

  const onPressPodcast = useCallback(
    (podcast: PodcastEntity) => {
      navigation.navigate('PodcastDetails', {
        podcastId: podcast.id,
        title: podcast.title,
      });
    },
    [navigation],
  );

  const podcastItems: PodcastCardItemViewModel[] = podcasts.map((podcast) => ({
    podcast,
    initials: getInitials(podcast.title),
  }));

  return {
    feedUrlInput,
    podcastItems,
    sampleFeeds: SAMPLE_FEEDS,
    isLoading,
    isSubscribing,
    errorMessage,
    statusMessage,
    onChangeFeedUrlInput: setFeedUrlInput,
    onRefresh,
    onPressSubscribeInput,
    onPressPreset,
    onPressPodcast,
  };
}

