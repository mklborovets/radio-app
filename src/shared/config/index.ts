export const ENV_CONFIG = {
  radioBrowserFallbackMirrors: [
    'https://de1.api.radio-browser.info',
    'https://fr1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
  ],
  maxCacheSizeBytes: 2 * 1024 * 1024 * 1024,
  playbackPositionPersistenceIntervalMs: 15000,
  searchDebounceMs: 350,
  radioStreamRewrites: [
    {
      matches: ['195.95.206.17/HitFM', 'online.hitfm.ua/HitFM'],
      target: 'https://online.hitfm.ua/HitFM',
    },
    {
      matches: ['195.95.206.14/KissFM', 'online.kissfm.ua/KissFM'],
      target: 'https://online.kissfm.ua/KissFM',
    },
    {
      matches: ['195.95.206.16/RadioROKS', 'online.radioroks.ua/RadioROKS'],
      target: 'https://online.radioroks.ua/RadioROKS',
    },
    {
      matches: ['195.95.206.18/MelodiaFM', 'online.melodiafm.ua/MelodiaFM'],
      target: 'https://online.melodiafm.ua/MelodiaFM',
    },
    {
      matches: ['195.95.206.19/Relax', 'online.radiorelax.ua/Relax'],
      target: 'https://online.radiorelax.ua/Relax',
    },
    {
      matches: ['195.95.206.20/NasheRadio', 'online.nasheradio.ua/NasheRadio'],
      target: 'https://online.nasheradio.ua/NasheRadio',
    },
    {
      matches: ['195.95.206.82/Jazz', 'online.radiojazz.ua/Jazz'],
      target: 'https://online.radiojazz.ua/Jazz',
    },
  ],
} as const;

export type MainTabParamList = {
  RadioCatalog: undefined;
  PodcastsFeed: undefined;
  Downloads: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  PodcastDetails: {podcastId: string; title: string};
  PlayerModal: undefined;
};
