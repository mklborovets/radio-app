import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@shared/ui';
import { useStationFiltersBar } from './model';
import { StationFiltersModal } from './StationFiltersModal';

export function StationFiltersBar(): React.JSX.Element {
  const {
    inputText,
    hasInputText,
    favoritesOnly,
    isFilterModalOpen,
    activeFiltersCount,
    filterButtonLabel,
    activeSummaryText,
    countryChips,
    genreChips,
    onChangeSearchText,
    onClearSearchText,
    onToggleFavoritesOnly,
    onSelectCountry,
    onSelectGenre,
    onOpenFilterModal,
    onCloseFilterModal,
    onResetAllFilters,
  } = useStationFiltersBar();

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            value={inputText}
            onChangeText={onChangeSearchText}
            placeholder="Search stations by name..."
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {hasInputText && (
            <TouchableOpacity
              style={styles.clearInputBtn}
              onPress={onClearSearchText}>
              <Text style={styles.clearInputText}>X</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterModalButton,
            activeFiltersCount > 0 && styles.filterModalButtonActive,
          ]}
          onPress={onOpenFilterModal}>
          <Text
            style={[
              styles.filterModalButtonText,
              activeFiltersCount > 0 && styles.filterModalButtonTextActive,
            ]}>
            {filterButtonLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.favoritesToggle,
            favoritesOnly && styles.favoritesToggleActive,
          ]}
          onPress={onToggleFavoritesOnly}>
          <Text
            style={[
              styles.favoritesToggleText,
              favoritesOnly && styles.favoritesToggleTextActive,
            ]}>
            SAVED
          </Text>
        </TouchableOpacity>
      </View>

      {activeSummaryText && (
        <View style={styles.activeSummaryBar}>
          <Text style={styles.activeSummaryText} numberOfLines={1}>
            {activeSummaryText}
          </Text>
          <TouchableOpacity onPress={onResetAllFilters}>
            <Text style={styles.resetInlineText}>CLEAR ALL</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}>
        {countryChips.map((chip) => (
          <TouchableOpacity
            key={chip.key}
            style={[styles.chip, chip.isSelected && styles.chipActive]}
            onPress={() => onSelectCountry(chip.code)}>
            <Text style={[styles.chipText, chip.isSelected && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}>
        {genreChips.map((chip) => (
          <TouchableOpacity
            key={chip.key}
            style={[styles.chip, chip.isSelected && styles.chipActive]}
            onPress={() => onSelectGenre(chip.genre)}>
            <Text style={[styles.chipText, chip.isSelected && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <StationFiltersModal
        visible={isFilterModalOpen}
        favoritesOnly={favoritesOnly}
        activeFiltersCount={activeFiltersCount}
        countryChips={countryChips}
        genreChips={genreChips}
        onClose={onCloseFilterModal}
        onResetAll={onResetAllFilters}
        onToggleFavoritesOnly={onToggleFavoritesOnly}
        onSelectCountry={onSelectCountry}
        onSelectGenre={onSelectGenre}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchInputWrapper: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  clearInputBtn: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  clearInputText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterModalButton: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterModalButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  filterModalButtonTextActive: {
    color: COLORS.background,
  },
  favoritesToggle: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
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
  activeSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  activeSummaryText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 8,
  },
  resetInlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  chipsScroll: {
    paddingVertical: 4,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
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
    fontWeight: '700',
  },
});
