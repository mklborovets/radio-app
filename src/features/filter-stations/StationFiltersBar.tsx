import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ENV_CONFIG } from '@shared/config';
import { COLORS } from '@shared/ui';
import {
  COUNTRY_FILTER_OPTIONS,
  GENRE_FILTER_OPTIONS,
  useStationFilterStore,
} from './model';

export function StationFiltersBar(): React.JSX.Element {
  const searchQuery = useStationFilterStore((state) => state.searchQuery);
  const countryCode = useStationFilterStore((state) => state.countryCode);
  const tag = useStationFilterStore((state) => state.tag);
  const favoritesOnly = useStationFilterStore((state) => state.favoritesOnly);
  const setSearchQuery = useStationFilterStore((state) => state.setSearchQuery);
  const setCountryCode = useStationFilterStore((state) => state.setCountryCode);
  const setTag = useStationFilterStore((state) => state.setTag);
  const setFavoritesOnly = useStationFilterStore((state) => state.setFavoritesOnly);
  const loadStations = useStationFilterStore((state) => state.loadStations);

  const [inputText, setInputText] = useState(searchQuery);

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

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Search stations by name..."
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[
            styles.favoritesToggle,
            favoritesOnly && styles.favoritesToggleActive,
          ]}
          onPress={() => setFavoritesOnly(!favoritesOnly)}>
          <Text
            style={[
              styles.favoritesToggleText,
              favoritesOnly && styles.favoritesToggleTextActive,
            ]}>
            FAVORITES
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}>
        {COUNTRY_FILTER_OPTIONS.map((option) => {
          const isSelected = countryCode === option.code;
          return (
            <TouchableOpacity
              key={option.code || 'ALL_COUNTRIES'}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setCountryCode(option.code)}>
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}>
        {GENRE_FILTER_OPTIONS.map((genre) => {
          const isSelected = tag === genre;
          const label = genre.length > 0 ? `#${genre}` : 'All Genres';
          return (
            <TouchableOpacity
              key={genre || 'ALL_GENRES'}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setTag(genre)}>
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 42,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
  },
  favoritesToggle: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoritesToggleActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
  },
  favoritesToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  favoritesToggleTextActive: {
    color: COLORS.accent,
  },
  chipsScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.background,
  },
});
