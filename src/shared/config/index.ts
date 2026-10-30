export const ENV_CONFIG = {
  radioBrowserFallbackMirrors: [
    'https://de1.api.radio-browser.info',
    'https://fr1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
  ],
  maxCacheSizeBytes: 2 * 1024 * 1024 * 1024,
  playbackPositionPersistenceIntervalMs: 15000,
  searchDebounceMs: 350,
} as const;

export type MainTabParamList = {
  RadioCatalog: undefined;
  PodcastsFeed: undefined;
  Downloads: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  PodcastDetails: { podcastId: string; title: string };
  PlayerModal: undefined;
};

