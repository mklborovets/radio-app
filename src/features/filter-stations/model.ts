import { create } from 'zustand';
import {
  fetchRadioStations,
  getFavoriteStations,
  RadioStation,
  toggleFavoriteStationInDb,
} from '@entities/station';

export interface CountryFilterOption {
  label: string;
  code: string;
}

export const COUNTRY_FILTER_OPTIONS: readonly CountryFilterOption[] = [
  { label: 'All Countries', code: '' },
  { label: 'Ukraine', code: 'UA' },
  { label: 'United States', code: 'US' },
  { label: 'United Kingdom', code: 'GB' },
  { label: 'Germany', code: 'DE' },
  { label: 'France', code: 'FR' },
  { label: 'Poland', code: 'PL' },
];

export const GENRE_FILTER_OPTIONS: readonly string[] = [
  '',
  'rock',
  'pop',
  'jazz',
  'electronic',
  'classical',
  'news',
  'ambient',
  'lofi',
];

export interface StationFilterCriteria {
  searchQuery: string;
  countryCode: string;
  tag: string;
  favoritesOnly: boolean;
}

export interface StationFilterStoreState extends StationFilterCriteria {
  stations: RadioStation[];
  isLoading: boolean;
  errorMessage: string | null;
  setSearchQuery: (query: string) => void;
  setCountryCode: (code: string) => void;
  setTag: (tag: string) => void;
  setFavoritesOnly: (favoritesOnly: boolean) => void;
  loadStations: () => Promise<void>;
  toggleFavorite: (station: RadioStation) => Promise<void>;
}

export const useStationFilterStore = create<StationFilterStoreState>((set, get) => ({
  searchQuery: '',
  countryCode: '',
  tag: '',
  favoritesOnly: false,
  stations: [],
  isLoading: false,
  errorMessage: null,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCountryCode: (countryCode) => set({ countryCode }),
  setTag: (tag) => set({ tag }),
  setFavoritesOnly: (favoritesOnly) => set({ favoritesOnly }),

  loadStations: async () => {
    const { searchQuery, countryCode, tag, favoritesOnly } = get();
    set({ isLoading: true, errorMessage: null });

    try {
      if (favoritesOnly) {
        const favorites = await getFavoriteStations();
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const normalizedTag = tag.trim().toLowerCase();
        const normalizedCountry = countryCode.trim().toUpperCase();

        const filtered = favorites.filter((station) => {
          const matchesQuery =
            normalizedQuery.length === 0 ||
            station.name.toLowerCase().includes(normalizedQuery);
          const matchesCountry =
            normalizedCountry.length === 0 ||
            station.countryCode.toUpperCase() === normalizedCountry;
          const matchesTag =
            normalizedTag.length === 0 ||
            station.tags.some((item) => item.toLowerCase().includes(normalizedTag));
          return matchesQuery && matchesCountry && matchesTag;
        });

        set({ stations: filtered, isLoading: false });
        return;
      }

      const remoteStations = await fetchRadioStations({
        name: searchQuery,
        countrycode: countryCode,
        tag,
        limit: 60,
      });

      set({ stations: remoteStations, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load radio stations';
      set({ errorMessage: message, isLoading: false });
    }
  },

  toggleFavorite: async (station) => {
    const isNowFavorite = await toggleFavoriteStationInDb(station);
    const { stations, favoritesOnly } = get();

    if (favoritesOnly && !isNowFavorite) {
      set({
        stations: stations.filter((item) => item.stationUuid !== station.stationUuid),
      });
      return;
    }

    set({
      stations: stations.map((item) =>
        item.stationUuid === station.stationUuid
          ? { ...item, isFavorite: isNowFavorite }
          : item,
      ),
    });
  },
}));
