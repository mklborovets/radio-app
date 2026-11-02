import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@shared/ui';
import { CountryChipViewModel, GenreChipViewModel } from './model';

export interface StationFiltersModalProps {
  visible: boolean;
  favoritesOnly: boolean;
  activeFiltersCount: number;
  countryChips: CountryChipViewModel[];
  genreChips: GenreChipViewModel[];
  onClose: () => void;
  onResetAll: () => void;
  onToggleFavoritesOnly: () => void;
  onSelectCountry: (code: string) => void;
  onSelectGenre: (genre: string) => void;
}

export function StationFiltersModal({
  visible,
  favoritesOnly,
  activeFiltersCount,
  countryChips,
  genreChips,
  onClose,
  onResetAll,
  onToggleFavoritesOnly,
  onSelectCountry,
  onSelectGenre,
}: StationFiltersModalProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Filter Radio Stations</Text>
              <Text style={styles.sheetSubtitle}>
                {activeFiltersCount > 0
                  ? `${activeFiltersCount} active filter(s) applied`
                  : 'Showing all available stations'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Library Scope</Text>
              <View style={styles.grid}>
                <TouchableOpacity
                  style={[styles.optionCard, !favoritesOnly && styles.optionCardActive]}
                  onPress={() => {
                    if (favoritesOnly) {
                      onToggleFavoritesOnly();
                    }
                  }}>
                  <Text
                    style={[
                      styles.optionCardText,
                      !favoritesOnly && styles.optionCardTextActive,
                    ]}>
                    All Stations
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    favoritesOnly && styles.optionCardFavoriteActive,
                  ]}
                  onPress={() => {
                    if (!favoritesOnly) {
                      onToggleFavoritesOnly();
                    }
                  }}>
                  <Text
                    style={[
                      styles.optionCardText,
                      favoritesOnly && styles.optionCardFavoriteTextActive,
                    ]}>
                    Saved Favorites Only
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Country / Region</Text>
              <View style={styles.grid}>
                {countryChips.map((chip) => (
                  <TouchableOpacity
                    key={chip.key}
                    style={[
                      styles.optionCard,
                      chip.isSelected && styles.optionCardActive,
                    ]}
                    onPress={() => onSelectCountry(chip.code)}>
                    <Text
                      style={[
                        styles.optionCardText,
                        chip.isSelected && styles.optionCardTextActive,
                      ]}>
                      {chip.label}
                      {chip.code ? ` (${chip.code})` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Music Genre & Topic</Text>
              <View style={styles.grid}>
                {genreChips.map((chip) => (
                  <TouchableOpacity
                    key={chip.key}
                    style={[
                      styles.optionCard,
                      chip.isSelected && styles.optionCardActive,
                    ]}
                    onPress={() => onSelectGenre(chip.genre)}>
                    <Text
                      style={[
                        styles.optionCardText,
                        chip.isSelected && styles.optionCardTextActive,
                      ]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={onResetAll}>
              <Text style={styles.resetButtonText}>RESET ALL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyButtonText}>SHOW STATIONS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '84%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 18,
    paddingBottom: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollArea: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionCardFavoriteActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: COLORS.accent,
  },
  optionCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  optionCardTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  optionCardFavoriteTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.background,
  },
});

