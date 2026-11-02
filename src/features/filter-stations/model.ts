import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import {
  fetchRadioStations,
  getFavoriteStations,
  RadioStation,
  toggleFavoriteStationInDb,
} from '@entities/station';
import { ENV_CONFIG } from '@shared/config';

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
  { label: 'Canada', code: 'CA' },
  { label: 'Netherlands', code: 'NL' },
  { label: 'Switzerland', code: 'CH' },
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
  'dance',
  'indie',
  'chillout',
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
  resetAllFilters: () => void;
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
  resetAllFilters: () =>
    set({
      searchQuery: '',
      countryCode: '',
      tag: '',
      favoritesOnly: false,
    }),

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

export interface GenreChipViewModel {
  key: string;
  genre: string;
  label: string;
  isSelected: boolean;
}

export interface CountryChipViewModel {
  key: string;
  code: string;
  label: string;
  isSelected: boolean;
}

export interface UseStationFiltersBarResult {
  inputText: string;
  hasInputText: boolean;
  favoritesOnly: boolean;
  isFilterModalOpen: boolean;
  activeFiltersCount: number;
  filterButtonLabel: string;
  activeSummaryText: string | null;
  countryChips: CountryChipViewModel[];
  genreChips: GenreChipViewModel[];
  onChangeSearchText: (text: string) => void;
  onClearSearchText: () => void;
  onToggleFavoritesOnly: () => void;
  onSelectCountry: (code: string) => void;
  onSelectGenre: (genre: string) => void;
  onOpenFilterModal: () => void;
  onCloseFilterModal: () => void;
  onResetAllFilters: () => void;
}

export function useStationFiltersBar(): UseStationFiltersBarResult {
  const searchQuery = useStationFilterStore((state) => state.searchQuery);
  const countryCode = useStationFilterStore((state) => state.countryCode);
  const tag = useStationFilterStore((state) => state.tag);
  const favoritesOnly = useStationFilterStore((state) => state.favoritesOnly);
  const setSearchQuery = useStationFilterStore((state) => state.setSearchQuery);
  const setCountryCode = useStationFilterStore((state) => state.setCountryCode);
  const setTag = useStationFilterStore((state) => state.setTag);
  const setFavoritesOnly = useStationFilterStore((state) => state.setFavoritesOnly);
  const resetAllFilters = useStationFilterStore((state) => state.resetAllFilters);
  const loadStations = useStationFilterStore((state) => state.loadStations);

  const [inputText, setInputText] = useState(searchQuery);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputText !== searchQuery) {
        setSearchQuery(inputText);
      }
    }, ENV_CONFIG.searchDebounceMs);

    return () => clearTimeout(timer);
  }, [inputText, searchQuery, setSearchQuery]);

  useEffect(() => {
    loadStations().catch(() => {});
  }, [searchQuery, countryCode, tag, favoritesOnly, loadStations]);

  const onToggleFavoritesOnly = useCallback(() => {
    setFavoritesOnly(!favoritesOnly);
  }, [favoritesOnly, setFavoritesOnly]);

  const onClearSearchText = useCallback(() => {
    setInputText('');
    setSearchQuery('');
  }, [setSearchQuery]);

  const onOpenFilterModal = useCallback(() => {
    setIsFilterModalOpen(true);
  }, []);

  const onCloseFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const onResetAllFilters = useCallback(() => {
    setInputText('');
    resetAllFilters();
  }, [resetAllFilters]);

  const countryChips: CountryChipViewModel[] = COUNTRY_FILTER_OPTIONS.map((option) => ({
    key: option.code || 'ALL_COUNTRIES',
    code: option.code,
    label: option.label,
    isSelected: countryCode === option.code,
  }));

  const genreChips: GenreChipViewModel[] = GENRE_FILTER_OPTIONS.map((genre) => ({
    key: genre || 'ALL_GENRES',
    genre,
    label: genre.length > 0 ? `#${genre}` : 'All Genres',
    isSelected: tag === genre,
  }));

  let activeFiltersCount = 0;
  const summaryParts: string[] = [];
  if (countryCode) {
    activeFiltersCount += 1;
    const matchedCountry = COUNTRY_FILTER_OPTIONS.find((c) => c.code === countryCode);
    summaryParts.push(matchedCountry ? matchedCountry.label : countryCode);
  }
  if (tag) {
    activeFiltersCount += 1;
    summaryParts.push(`#${tag}`);
  }
  if (favoritesOnly) {
    activeFiltersCount += 1;
    summaryParts.push('Saved Only');
  }

  const filterButtonLabel =
    activeFiltersCount > 0 ? `FILTERS (${activeFiltersCount})` : 'FILTERS';

  const activeSummaryText =
    summaryParts.length > 0 ? `Active: ${summaryParts.join(' • ')}` : null;

  return {
    inputText,
    hasInputText: inputText.length > 0,
    favoritesOnly,
    isFilterModalOpen,
    activeFiltersCount,
    filterButtonLabel,
    activeSummaryText,
    countryChips,
    genreChips,
    onChangeSearchText: setInputText,
    onClearSearchText,
    onToggleFavoritesOnly,
    onSelectCountry: setCountryCode,
    onSelectGenre: setTag,
    onOpenFilterModal,
    onCloseFilterModal,
    onResetAllFilters,
  };
}
